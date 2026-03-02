import React, { useEffect, useMemo, useRef, useCallback } from "react";
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

import Translate from "ol/interaction/Translate";
import Collection from "ol/Collection";
import { primaryAction } from "ol/events/condition";

import { Icon, Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";

import { Button } from "@/components/ui/button";

const TILE_SIZE = 256;
const HIT_TOLERANCE = 8;

export default function OpenLayersMap({
    mapId,
    nginxUrl,
    width,
    height,
    maxZoom,

    locations = [],

    // preview marker (for "add location")
    previewCoord = null,

    // click to add new location
    addMode = false,
    onMapClick,

    // select existing location
    onSelectLocation,
    selectedLocationId = null,

    // drag selected marker
    editMode = false,
    onMoveLocation,

    markerIconUrl = "/marker.svg",
}) {
    /** ---------------------------
     * Refs: OL instances
     * -------------------------- */
    const elRef = useRef(null);
    const mapRef = useRef(null);
    const markerSourceRef = useRef(null);
    const markerLayerRef = useRef(null);

    /** ---------------------------
     * Refs: latest props for OL handlers (avoid rebind)
     * -------------------------- */
    const addModeRef = useRef(addMode);
    const editModeRef = useRef(editMode);
    const locationsRef = useRef(locations);
    const onMapClickRef = useRef(onMapClick);
    const onSelectLocationRef = useRef(onSelectLocation);
    const onMoveLocationRef = useRef(onMoveLocation);

    useEffect(() => { addModeRef.current = addMode; }, [addMode]);
    useEffect(() => { editModeRef.current = editMode; }, [editMode]);
    useEffect(() => { locationsRef.current = locations; }, [locations]);
    useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
    useEffect(() => { onSelectLocationRef.current = onSelectLocation; }, [onSelectLocation]);
    useEffect(() => { onMoveLocationRef.current = onMoveLocation; }, [onMoveLocation]);

    /** ---------------------------
     * Marker bookkeeping
     * -------------------------- */
    const featuresByIdRef = useRef(new Map());            // id -> Feature
    const previewFeatureRef = useRef(null);               // Feature
    const hoveredIdRef = useRef(null);                    // id | null

    // selected is controlled from parent via selectedLocationId,
    // но OL style function читает из ref
    const selectedIdRef = useRef(selectedLocationId);

    // pending coords exist only on client side until parent "commits" via locations update
    const pendingCoordsRef = useRef(new Map());           // id -> {x,y}
    const draggingIdRef = useRef(null);                   // id | null
    const prevSelectedIdRef = useRef(null);               // last selected id (for revert)

    /** ---------------------------
     * Projection + tiling
     * -------------------------- */
    const extent = useMemo(() => [0, 0, width, height], [width, height]);

    const projection = useMemo(() => {
        return new Projection({
            code: "PIXELS",
            units: "pixels",
            extent,
        });
    }, [extent]);

    const resolutions = useMemo(() => {
        // z=0 is most zoomed-out; z=maxZoom is most zoomed-in
        return Array.from({ length: maxZoom + 1 }, (_, z) => Math.pow(2, maxZoom - z));
    }, [maxZoom]);

    /** ---------------------------
     * Style cache
     * -------------------------- */
    const styleCacheRef = useRef(new Map());

    const getMarkerStyle = useCallback((iconUrl, variant) => {
        const key = `${iconUrl}|${variant}`;
        const cache = styleCacheRef.current;
        const cached = cache.get(key);
        if (cached) return cached;

        // You can tweak these safely in one place:
        const scale =
            variant === "hover" ? 1.10 :
                variant === "selected" ? 1.18 :
                    variant === "dragging" ? 1.22 :
                        variant === "preview" ? 1.00 :
                            1.00;

        const opacity =
            variant === "preview" ? 0.75 :
                variant === "dragging" ? 0.95 :
                    1.0;

        const zIndex =
            variant === "selected" ? 30 :
                variant === "dragging" ? 28 :
                    variant === "hover" ? 25 :
                        variant === "preview" ? 15 :
                            10;

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
            zIndex,
        });

        // ring for hover/selected/dragging
        if (variant === "hover" || variant === "selected" || variant === "dragging") {
            const radius =
                variant === "selected" ? 10 :
                    variant === "dragging" ? 11 :
                        9;

            const strokeWidth =
                variant === "selected" ? 3 :
                    variant === "dragging" ? 3 :
                        2;

            const ring = new Style({
                image: new CircleStyle({
                    radius,
                    fill: new Fill({ color: "rgba(255,255,255,0.35)" }),
                    stroke: new Stroke({ color: "rgba(0,0,0,0.55)", width: strokeWidth }),
                }),
                zIndex: zIndex - 1,
            });

            const arr = [ring, icon];
            cache.set(key, arr);
            return arr;
        }

        cache.set(key, icon);
        return icon;
    }, []);

    /** ---------------------------
     * Helpers: pick feature at pixel
     * -------------------------- */
    const pickLocationFeatureAtPixel = useCallback((map, pixel, markerLayer) => {
        let picked = null;

        map.forEachFeatureAtPixel(
            pixel,
            (feature) => (picked = feature, true),
            {
                hitTolerance: HIT_TOLERANCE,
                layerFilter: (layer) => layer === markerLayer,
            }
        );

        if (!picked) return null;
        if (picked.get("kind") !== "location") return null;
        return picked;
    }, []);

    /** ---------------------------
     * Init OL map once per tileset/projection change
     * -------------------------- */
    useEffect(() => {
        if (!elRef.current) return;

        /** Tile grid + tiles */
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

        /** Marker layer */
        const markerSource = new VectorSource();
        markerSourceRef.current = markerSource;

        const markerLayer = new VectorLayer({
            source: markerSource,
            zIndex: 10,
            updateWhileInteracting: true,
            updateWhileAnimating: true,
        });
        markerLayerRef.current = markerLayer;

        // Style function reads from refs (hover/selected/dragging)
        markerLayer.setStyle((feature) => {
            const kind = feature.get("kind");
            if (kind === "preview") {
                if (!feature.get("visible")) return null;
                const iconUrl = feature.get("iconUrl") || markerIconUrl;
                return getMarkerStyle(iconUrl, "preview");
            }

            if (kind === "location") {
                const id = feature.get("locationId");
                const iconUrl = feature.get("iconUrl") || markerIconUrl;

                const isSelected = selectedIdRef.current === id;
                const isHovered = hoveredIdRef.current === id;
                const isDragging = draggingIdRef.current === id;

                const variant =
                    isDragging ? "dragging" :
                        isSelected ? "selected" :
                            isHovered ? "hover" :
                                "normal";

                return getMarkerStyle(iconUrl, variant);
            }

            return null;
        });

        /** View + map */
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
        mapRef.current = map;

        /** Preview feature */
        const previewFeature = new Feature({
            geometry: new Point([0, 0]),
            kind: "preview",
        });
        previewFeature.set("visible", false);
        previewFeature.set("iconUrl", markerIconUrl);
        markerSource.addFeature(previewFeature);
        previewFeatureRef.current = previewFeature;

        /** Hover */
        const onPointerMove = (evt) => {
            const f = pickLocationFeatureAtPixel(map, evt.pixel, markerLayer);
            const id = f ? f.get("locationId") : null;

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

        /** Click: select marker OR add new location */
        const onSingleClick = (evt) => {
            const picked = pickLocationFeatureAtPixel(map, evt.pixel, markerLayer);

            if (picked) {
                const id = picked.get("locationId");

                // notify parent
                const loc = locationsRef.current.find((l) => l.id === id);
                if (loc) onSelectLocationRef.current?.(loc);
                return;
            }

            // clicked empty space: only meaningful in addMode
            if (!addModeRef.current) return;
            const [x, y] = evt.coordinate;
            onMapClickRef.current?.({ x, y });
        };
        map.on("singleclick", onSingleClick);

        /** Drag selected marker (Translate interaction) */
        const translateFeatures = new Collection();
        const translate = new Translate({
            features: translateFeatures,      // we will keep exactly one feature here
            layers: [markerLayer],
            hitTolerance: HIT_TOLERANCE,
            condition: primaryAction,
        });

        // Active only when editMode=true AND something selected (we update outside)
        translate.setActive(false);
        map.addInteraction(translate);

        const onTranslateStart = (evt) => {
            evt.features.forEach((feature) => {
                if (feature.get("kind") !== "location") return;
                draggingIdRef.current = feature.get("locationId") || null;
            });
            markerLayer.changed();
        };

        const onTranslateEnd = (evt) => {
            evt.features.forEach((feature) => {
                if (feature.get("kind") !== "location") return;

                const id = feature.get("locationId");
                const geom = feature.getGeometry();
                if (!id || !geom) return;

                const [x, y] = geom.getCoordinates();

                // store as "pending" until parent commits via locations update
                pendingCoordsRef.current.set(id, { x, y });

                // notify parent (e.g. update form preview)
                onMoveLocationRef.current?.({ id, x, y });
            });

            draggingIdRef.current = null;
            markerLayer.changed();
        };

        translate.on("translatestart", onTranslateStart);
        translate.on("translateend", onTranslateEnd);

        // store to refs for later updates
        // (we keep translateFeatures local but accessible through closure)
        const api = {
            translate,
            translateFeatures,
            cleanup() {
                translate.un("translatestart", onTranslateStart);
                translate.un("translateend", onTranslateEnd);
                map.removeInteraction(translate);
            },
        };
        map.__translateApi = api;

        /** Cleanup */
        return () => {
            map.un("pointermove", onPointerMove);
            map.un("singleclick", onSingleClick);
            elRef.current?.removeEventListener("mouseleave", onMouseLeave);

            if (map.__translateApi) {
                map.__translateApi.cleanup();
                map.__translateApi = null;
            }

            map.setTarget(undefined);

            // reset refs
            mapRef.current = null;
            markerLayerRef.current = null;
            markerSourceRef.current = null;

            featuresByIdRef.current.clear();
            previewFeatureRef.current = null;

            hoveredIdRef.current = null;
            selectedIdRef.current = null;
            draggingIdRef.current = null;

            pendingCoordsRef.current.clear();
            styleCacheRef.current.clear();
        };
    }, [
        mapId,
        nginxUrl,
        extent,
        projection,
        resolutions,
        maxZoom,
        markerIconUrl,
        getMarkerStyle,
        pickLocationFeatureAtPixel,
    ]);

    /** ---------------------------
     * Sync: locations -> features
     * -------------------------- */
    useEffect(() => {
        const source = markerSourceRef.current;
        const layer = markerLayerRef.current;
        if (!source || !layer) return;

        const byId = featuresByIdRef.current;
        const nextIds = new Set(locations.map((l) => l.id));

        // remove deleted
        for (const [id, f] of byId.entries()) {
            if (!nextIds.has(id)) {
                source.removeFeature(f);
                byId.delete(id);
                pendingCoordsRef.current.delete(id);
                if (hoveredIdRef.current === id) hoveredIdRef.current = null;
                if (selectedIdRef.current === id) selectedIdRef.current = null;
            }
        }

        // upsert + set coords (pending overrides until commit)
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
            }

            const pending = pendingCoordsRef.current.get(loc.id);
            const x = pending ? pending.x : loc.x;
            const y = pending ? pending.y : loc.y;

            f.getGeometry().setCoordinates([x, y]);

            // if parent committed (locations updated to pending), clear pending
            if (pending && pending.x === loc.x && pending.y === loc.y) {
                pendingCoordsRef.current.delete(loc.id);
            }

            if (loc.iconUrl) f.set("iconUrl", loc.iconUrl);
            else f.unset("iconUrl", true);
        }

        layer.changed();
    }, [locations]);

    /** ---------------------------
     * Preview marker
     * -------------------------- */
    useEffect(() => {
        const f = previewFeatureRef.current;
        const layer = markerLayerRef.current;
        if (!f || !layer) return;

        f.set("iconUrl", markerIconUrl);

        if (!previewCoord) {
            f.set("visible", false);
            layer.changed();
            return;
        }

        f.set("visible", true);
        f.getGeometry().setCoordinates([previewCoord.x, previewCoord.y]);
        layer.changed();
    }, [previewCoord, markerIconUrl]);

    /** ---------------------------
     * Selection + translate activation + rollback logic
     * -------------------------- */
    useEffect(() => {
        selectedIdRef.current = selectedLocationId;

        const map = mapRef.current;
        const layer = markerLayerRef.current;
        const byId = featuresByIdRef.current;

        // --- rollback rule ---
        // if selection changed away from previous selected id (or became null, or addMode turned on),
        // then discard pending coords for that previous id and reset marker to committed coordinates (from locations)
        const prev = prevSelectedIdRef.current;
        const next = selectedLocationId || null;

        const shouldLeaveEditContext = addMode || !editModeRef.current;

        // selection changed (prev -> next different)
        if (prev && prev !== next) {
            rollbackPendingFor(prev);
        }

        // selection cleared
        if (prev && !next) {
            rollbackPendingFor(prev);
        }

        // entering add-mode usually means "stop editing current marker"
        if (prev && shouldLeaveEditContext) {
            rollbackPendingFor(prev);
        }

        prevSelectedIdRef.current = next;

        // --- translate setup (only if editMode + selected exists) ---
        if (!map || !map.__translateApi) {
            layer?.changed();
            return;
        }

        const { translate, translateFeatures } = map.__translateApi;

        translateFeatures.clear();

        const canDrag = !!editMode && !!selectedLocationId && byId.has(selectedLocationId) && !addMode;
        if (canDrag) {
            translateFeatures.push(byId.get(selectedLocationId));
        }

        translate.setActive(!!canDrag);

        layer?.changed();

        function rollbackPendingFor(id) {
            const pending = pendingCoordsRef.current.get(id);
            if (!pending) return;

            pendingCoordsRef.current.delete(id);

            // reset feature coords back to committed value from locations prop
            const loc = locationsRef.current.find((l) => l.id === id);
            const f = byId.get(id);
            if (loc && f) {
                f.getGeometry().setCoordinates([loc.x, loc.y]);
            }

            // drop dragging state too
            if (draggingIdRef.current === id) draggingIdRef.current = null;

            layer?.changed();
        }
    }, [selectedLocationId, editMode, addMode]);

    /** ---------------------------
     * Zoom controls
     * -------------------------- */
    const clampZoom = (z) => Math.max(0, Math.min(maxZoom, z));

    const animateZoomBy = (delta) => {
        const olMap = mapRef.current;
        if (!olMap) return;

        const view = olMap.getView();

        const currentZoom = view.getZoom() ?? 0;
        const targetZoom = clampZoom(currentZoom + delta);
        if (targetZoom === currentZoom) return;

        const center = view.getCenter();
        if (!center) return;

        const targetRes = view.getResolutionForZoom(targetZoom);
        const constrainedCenter = view.getConstrainedCenter(center, targetRes);

        view.animate(
            { zoom: targetZoom, center: constrainedCenter, duration: 180 },
            () => {
                const z = view.getZoom() ?? targetZoom;
                const res = view.getResolutionForZoom(z);
                const c = view.getCenter();
                if (c) view.setCenter(view.getConstrainedCenter(c, res));
                olMap.renderSync();
            }
        );
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div ref={elRef} style={{ width: "100%", height: "100%" }} />

            <div className="map-control-stack">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="map-control-btn"
                    title="Приблизить"
                    aria-label="Приблизить"
                    onClick={() => animateZoomBy(+0.5)}
                >
                    <Plus className="h-4 w-4" strokeWidth={4} />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="map-control-btn"
                    title="Отдалить"
                    aria-label="Отдалить"
                    onClick={() => animateZoomBy(-0.5)}
                >
                    <Minus className="h-4 w-4" strokeWidth={4} />
                </Button>
            </div>
        </div>
    );
}