import React, { useEffect, useMemo, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import OLMap from "ol/Map";
import View from "ol/View";
import Projection from "ol/proj/Projection";
import { defaults as defaultInteractions } from "ol/interaction";
import { defaults as defaultControls } from "ol/control";

import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import { Icon, Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";


import { Button } from "@/components/ui/button";

const TILE_SIZE = 256;

export default function OpenLayersMap({
    mapId,
    nginxUrl,
    width,
    height,
    maxZoom,
    locations = [],
    previewCoord = null,
    addMode = false,
    onMapClick,
    onSelectLocation,
    markerIconUrl = "/marker.svg",
    previewIconUrl = "/marker.svg",
}) {
    const elRef = useRef(null);

    const mapRef = useRef(null);
    const markerSourceRef = useRef(null);
    const markerLayerRef = useRef(null);

    const addModeRef = useRef(addMode);
    const locationsRef = useRef(locations);
    const onMapClickRef = useRef(onMapClick);
    const onSelectLocationRef = useRef(onSelectLocation);

    useEffect(() => { addModeRef.current = addMode; }, [addMode]);
    useEffect(() => { locationsRef.current = locations; }, [locations]);
    useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
    useEffect(() => { onSelectLocationRef.current = onSelectLocation; }, [onSelectLocation]);

    // marker bookkeeping
    const featuresByIdRef = useRef(new Map());
    const previewFeatureRef = useRef(null);
    const hoveredIdRef = useRef(null);
    const selectedIdRef = useRef(null);

    const styleCacheRef = useRef(new Map());

    const extent = useMemo(() => [0, 0, width, height], [width, height]);

    const projection = useMemo(() => {
        return new Projection({
            code: "PIXELS",
            units: "pixels",
            extent,
        });
    }, [extent]);

    const resolutions = useMemo(() => {
        return Array.from({ length: maxZoom + 1 }, (_, z) => Math.pow(2, maxZoom - z));
    }, [maxZoom]);

    const getStyleFor = (kind, iconUrl, variant) => {
        const key = `${kind}|${iconUrl}|${variant}`;
        const cache = styleCacheRef.current;
        const cached = cache.get(key);
        if (cached) return cached;

        const scale =
            variant === "hover" ? 1.1 :
                variant === "selected" ? 1.18 :
                    variant === "preview" ? 1.0 : 1.0;

        const opacity =
            variant === "preview" ? 0.75 : 1.0;

        const icon = new Style({
            image: new Icon({
                src: iconUrl,
                anchor: [0.5, 1],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction",
                crossOrigin: "anonymous",
                scale,
                opacity,
            }),
            zIndex: variant === "selected" ? 20 : variant === "hover" ? 15 : 10,
        });

        if (variant === "hover" || variant === "selected") {
            const radius = variant === "selected" ? 10 : 9;
            const strokeWidth = variant === "selected" ? 3 : 2;

            const ring = new Style({
                image: new CircleStyle({
                    radius,
                    fill: new Fill({ color: "rgba(255,255,255,0.35)" }),
                    stroke: new Stroke({ color: "rgba(0,0,0,0.55)", width: strokeWidth }),
                }),
                zIndex: icon.getZIndex() - 1,
            });

            const arr = [ring, icon];
            cache.set(key, arr);
            return arr;
        }

        cache.set(key, icon);
        return icon;
    };

    useEffect(() => {
        if (!elRef.current) return;

        const tileGrid = new TileGrid({
            extent,
            origin: [0, 0],
            resolutions,
            tileSize: TILE_SIZE,
        });

        const tiles = new TileLayer({
            source: new XYZ({
                projection,
                tileGrid,
                wrapX: false,
                tileUrlFunction: (tileCoord) => {
                    if (!tileCoord) return undefined;
                    const z = tileCoord[0];
                    const x = tileCoord[1];
                    const y = -tileCoord[2] - 1;

                    if (z < 0 || z > maxZoom || x < 0 || y < 0) return undefined;
                    return `${nginxUrl}/tiles/${mapId}/${z}/${x}/${y}.png`;
                },
            }),
        });

        const markerSource = new VectorSource();
        markerSourceRef.current = markerSource;

        const markerLayer = new VectorLayer({
            source: markerSource,
            zIndex: 10,
            updateWhileInteracting: true,
            updateWhileAnimating: true,
        });
        markerLayerRef.current = markerLayer;

        markerLayer.setStyle((feature) => {
            const kind = feature.get("kind");

            if (kind === "preview") {
                const visible = feature.get("visible");
                if (!visible) return null;

                const iconUrl = feature.get("iconUrl") || previewIconUrl || markerIconUrl;
                return getStyleFor("preview", iconUrl, "preview");
            }

            if (kind === "location") {
                const id = feature.get("locationId");
                const iconUrl = feature.get("iconUrl") || markerIconUrl;

                const isSelected = selectedIdRef.current === id;
                const isHovered = hoveredIdRef.current === id;

                const variant = isSelected ? "selected" : isHovered ? "hover" : "normal";
                return getStyleFor("location", iconUrl, variant);
            }

            return null;
        });

        const view = new View({
            projection,
            minZoom: 0,
            maxZoom,
            extent,
            constrainOnlyCenter: false,
            smoothExtentConstraint: true,
            resolutions,
            center: [extent[2] / 2, extent[3] / 2],
            zoom: 0,
        });

        const map = new OLMap({
            target: elRef.current,
            controls: defaultControls({ zoom: false, rotate: false }),
            interactions: defaultInteractions({ altShiftDragRotate: false, pinchRotate: false }),
            layers: [tiles, markerLayer],
            view,
        });

        view.fit(extent, { padding: [20, 20, 20, 20] });

        const onPointerMove = (evt) => {
            let picked = null;
            map.forEachFeatureAtPixel(
                evt.pixel,
                (feature) => (picked = feature, true),
                {
                    hitTolerance: 8,
                    layerFilter: (layer) => layer === markerLayer,
                }
            );

            const id =
                picked && picked.get("kind") === "location"
                    ? picked.get("locationId")
                    : null;

            if (hoveredIdRef.current !== id) {
                hoveredIdRef.current = id;
                markerLayer.changed();
            }
        };

        map.on("pointermove", onPointerMove);

        const onMouseLeave = () => {
            if (hoveredIdRef.current !== null) {
                hoveredIdRef.current = null;
                markerLayer.changed();
            }
        };
        elRef.current.addEventListener("mouseleave", onMouseLeave);

        const onSingleClick = (evt) => {
            let picked = null;

            map.forEachFeatureAtPixel(
                evt.pixel,
                (feature) => (picked = feature, true),
                {
                    hitTolerance: 8,
                    layerFilter: (layer) => layer === markerLayer,
                }
            );

            if (picked) {
                const kind = picked.get("kind");

                if (kind === "location") {
                    const id = picked.get("locationId");
                    if (selectedIdRef.current !== id) {
                        selectedIdRef.current = id;
                        markerLayer.changed();
                    }

                    const loc = locationsRef.current.find((l) => l.id === id);
                    if (loc) onSelectLocationRef.current?.(loc);
                }

                return;
            }

            if (!addModeRef.current) return;
            const [x, y] = evt.coordinate;
            onMapClickRef.current?.({ x, y });
        };

        map.on("singleclick", onSingleClick);

        const previewFeature = new Feature({
            geometry: new Point([0, 0]),
            kind: "preview",
        });
        previewFeature.set("visible", false);
        previewFeature.set("iconUrl", previewIconUrl || markerIconUrl);
        markerSource.addFeature(previewFeature);
        previewFeatureRef.current = previewFeature;

        mapRef.current = map;

        return () => {
            map.un("pointermove", onPointerMove);
            map.un("singleclick", onSingleClick);
            elRef.current?.removeEventListener("mouseleave", onMouseLeave);

            map.setTarget(undefined);

            mapRef.current = null;
            markerLayerRef.current = null;
            markerSourceRef.current = null;

            featuresByIdRef.current.clear();
            previewFeatureRef.current = null;

            hoveredIdRef.current = null;
            selectedIdRef.current = null;
            styleCacheRef.current.clear();
        };
    }, [mapId, nginxUrl, extent, projection, resolutions, maxZoom, markerIconUrl, previewIconUrl]);

    useEffect(() => {
        const source = markerSourceRef.current;
        const layer = markerLayerRef.current;
        if (!source || !layer) return;

        const byId = featuresByIdRef.current;
        const nextIds = new Set(locations.map((l) => l.id));

        for (const [id, f] of byId.entries()) {
            if (!nextIds.has(id)) {
                source.removeFeature(f);
                byId.delete(id);

                if (hoveredIdRef.current === id) hoveredIdRef.current = null;
                if (selectedIdRef.current === id) selectedIdRef.current = null;
            }
        }

        for (const loc of locations) {
            let f = byId.get(loc.id);
            if (!f) {
                f = new Feature({
                    geometry: new Point([loc.x, loc.y]),
                    kind: "location",
                    locationId: loc.id,
                });
                byId.set(loc.id, f);
                source.addFeature(f);
            } else {
                f.getGeometry().setCoordinates([loc.x, loc.y]);
            }

            if (loc.iconUrl) f.set("iconUrl", loc.iconUrl);
            else f.unset("iconUrl", true);
        }

        layer.changed();
    }, [locations]);

    useEffect(() => {
        const f = previewFeatureRef.current;
        const layer = markerLayerRef.current;
        if (!f || !layer) return;

        f.set("iconUrl", previewIconUrl || markerIconUrl);

        if (!previewCoord) {
            f.set("visible", false);
            layer.changed();
            return;
        }

        f.set("visible", true);
        f.getGeometry().setCoordinates([previewCoord.x, previewCoord.y]);
        layer.changed();
    }, [previewCoord, previewIconUrl, markerIconUrl]);

    const clampZoom = (z) => Math.max(0, Math.min(maxZoom, z));

    const animateZoomBy = (delta) => {
        const olMap = mapRef.current;
        if (!olMap) return;

        const view = olMap.getView();
        const current = view.getZoom() ?? 0;
        const target = clampZoom(current + delta);

        if (target === current) return;

        view.animate(
            { zoom: target, duration: 220 },
        );
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div ref={elRef} style={{ width: "100%", height: "100%" }} />

            <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="
                    h-8 w-8
                    rounded-md
                    bg-[rgba(252,247,233,0.95)]
                    border border-[#c9aa71]
                    text-[#3a2f1b]
                    shadow-md
                    backdrop-blur-sm
                    hover:bg-[#f2f0e6]
                    hover:text-[#486248]
                    hover:border-[#5b7a5b]
                    active:scale-95
                    transition-all
                    "
                    title="Приблизить"
                    aria-label="Приблизить"
                    onClick={() => animateZoomBy(+1)}
                >
                    <Plus className="h-4 w-4" strokeWidth={4} />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="
                    h-8 w-8
                    rounded-md
                    bg-[rgba(252,247,233,0.95)]
                    border border-[#c9aa71]
                    text-[#3a2f1b]
                    shadow-md
                    backdrop-blur-sm
                    hover:bg-[#f2f0e6]
                    hover:text-[#486248]
                    hover:border-[#5b7a5b]
                    hover:shadow-[0_0_10px_rgba(91,122,91,0.4)]
                    active:scale-95
                    transition-all
                    "
                    title="Отдалить"
                    aria-label="Отдалить"
                    onClick={() => animateZoomBy(-1)}
                >
                    <Minus className="h-4 w-4" strokeWidth={4} />
                </Button>
            </div>
        </div>
    );
}