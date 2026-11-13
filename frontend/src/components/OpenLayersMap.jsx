import { useCallback, useEffect, useMemo, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from "ol/style";

import { Button } from "@/components/ui/button";
import { useLatest } from "@/hooks/useLatest";

const TILE_SIZE = 256;
const HIT_TOLERANCE = 8;
const MIN_ZOOM = 0;

const MARKER_VARIANTS = {
    normal: { scale: 1, opacity: 1, zIndex: 10 },
    hover: { scale: 1.1, opacity: 1, zIndex: 25, ring: { radius: 9, strokeWidth: 2 } },
    selected: { scale: 1.18, opacity: 1, zIndex: 30, ring: { radius: 10, strokeWidth: 3 } },
    dragging: { scale: 1.22, opacity: 0.95, zIndex: 28, ring: { radius: 11, strokeWidth: 3 } },
    preview: { scale: 1, opacity: 0.75, zIndex: 15 },
};

export default function OpenLayersMap({
    mapId,
    storageUrl,
    tilesVersion,
    width,
    height,
    maxZoom,
    locations = [],
    previewCoord = null,
    addMode = false,
    onMapClick,
    onSelectLocation,
    selectedLocationId = null,
    editMode = false,
    onMoveLocation,
    markerIconUrl = "/marker.svg",
}) {
    const { t } = useTranslation();

    const elRef = useRef(null);
    const mapRef = useRef(null);
    const markerSourceRef = useRef(null);
    const markerLayerRef = useRef(null);
    const previewFeatureRef = useRef(null);
    const translateRef = useRef(null);

    const addModeRef = useLatest(addMode);
    const onMapClickRef = useLatest(onMapClick);
    const onSelectLocationRef = useLatest(onSelectLocation);
    const onMoveLocationRef = useLatest(onMoveLocation);
    const locationsRef = useLatest(locations);

    const featuresByIdRef = useRef(new Map());
    const pendingCoordsRef = useRef(new Map());
    const hoveredIdRef = useRef(null);
    const selectedIdRef = useRef(selectedLocationId);
    const draggingIdRef = useRef(null);
    const prevSelectedIdRef = useRef(null);
    const styleCacheRef = useRef(new Map());

    const extent = useMemo(() => [0, 0, width, height], [width, height]);

    const projection = useMemo(
        () =>
            new Projection({
                code: "PIXELS",
                units: "pixels",
                extent,
            }),
        [extent]
    );

    const resolutions = useMemo(
        () =>
            Array.from({ length: maxZoom + 1 }, (_, z) =>
                Math.pow(2, maxZoom - z)
            ),
        [maxZoom]
    );

    const getMarkerStyle = useCallback((iconUrl, variantName) => {
        const key = `${iconUrl}|${variantName}`;
        const cache = styleCacheRef.current;
        const cached = cache.get(key);
        if (cached) return cached;

        const variant = MARKER_VARIANTS[variantName] ?? MARKER_VARIANTS.normal;

        const icon = new Style({
            image: new Icon({
                src: iconUrl,
                anchor: [0.5, 1],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction",
                crossOrigin: "anonymous",
                scale: variant.scale,
                opacity: variant.opacity,
            }),
            zIndex: variant.zIndex,
        });

        if (!variant.ring) {
            cache.set(key, icon);
            return icon;
        }

        const ring = new Style({
            image: new CircleStyle({
                radius: variant.ring.radius,
                fill: new Fill({ color: "rgba(255,255,255,0.35)" }),
                stroke: new Stroke({
                    color: "rgba(0,0,0,0.55)",
                    width: variant.ring.strokeWidth,
                }),
            }),
            zIndex: variant.zIndex - 1,
        });

        const styles = [ring, icon];
        cache.set(key, styles);
        return styles;
    }, []);

    const pickLocationFeatureAtPixel = useCallback((map, pixel, markerLayer) => {
        let picked = null;

        map.forEachFeatureAtPixel(
            pixel,
            (feature) => {
                picked = feature;
                return true;
            },
            {
                hitTolerance: HIT_TOLERANCE,
                layerFilter: (layer) => layer === markerLayer,
            }
        );

        return picked?.get("kind") === "location" ? picked : null;
    }, []);

    useEffect(() => {
        const element = elRef.current;
        if (!element) return undefined;

        const featuresById = featuresByIdRef.current;

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

                    const [z, x, tileY] = tileCoord;
                    const y = -tileY - 1;

                    if (z < MIN_ZOOM || z > maxZoom || x < 0 || y < 0) {
                        return undefined;
                    }

                    return `${storageUrl}/maps/${mapId}/tiles/v${tilesVersion}/${z}/${x}/${y}.png`;
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
                if (!feature.get("visible")) return null;
                return getMarkerStyle(
                    feature.get("iconUrl") || markerIconUrl,
                    "preview"
                );
            }

            if (kind === "location") {
                const id = feature.get("locationId");
                const variant = draggingIdRef.current === id
                    ? "dragging"
                    : selectedIdRef.current === id
                      ? "selected"
                      : hoveredIdRef.current === id
                        ? "hover"
                        : "normal";

                return getMarkerStyle(
                    feature.get("iconUrl") || markerIconUrl,
                    variant
                );
            }

            return null;
        });

        // Features survive a map re-init (e.g. tiles version change).
        for (const feature of featuresById.values()) {
            markerSource.addFeature(feature);
        }

        const view = new View({
            projection,
            minZoom: MIN_ZOOM,
            maxZoom,
            extent,
            constrainOnlyCenter: false,
            smoothExtentConstraint: true,
            resolutions,
            center: [extent[2] / 2, extent[3] / 2],
            zoom: MIN_ZOOM,
        });

        const map = new OLMap({
            target: element,
            controls: defaultControls({ zoom: false, rotate: false }),
            interactions: defaultInteractions({
                altShiftDragRotate: false,
                pinchRotate: false,
            }),
            layers: [tiles, markerLayer],
            view,
        });

        view.fit(extent, { padding: [20, 20, 20, 20] });
        mapRef.current = map;

        const previewFeature = new Feature({
            geometry: new Point([0, 0]),
            kind: "preview",
        });
        previewFeature.set("visible", false);
        previewFeature.set("iconUrl", markerIconUrl);
        markerSource.addFeature(previewFeature);
        previewFeatureRef.current = previewFeature;

        const onPointerMove = (event) => {
            const feature = pickLocationFeatureAtPixel(map, event.pixel, markerLayer);
            const id = feature ? feature.get("locationId") : null;

            if (hoveredIdRef.current !== id) {
                hoveredIdRef.current = id;
                markerLayer.changed();
            }
        };

        const onMouseLeave = () => {
            if (hoveredIdRef.current === null) return;

            hoveredIdRef.current = null;
            markerLayer.changed();
        };

        const onSingleClick = (event) => {
            const picked = pickLocationFeatureAtPixel(map, event.pixel, markerLayer);

            if (picked) {
                const id = picked.get("locationId");
                const location = locationsRef.current.find((item) => item.id === id);
                if (location) onSelectLocationRef.current?.(location);
                return;
            }

            if (!addModeRef.current) return;

            const [x, y] = event.coordinate;
            onMapClickRef.current?.({ x, y });
        };

        map.on("pointermove", onPointerMove);
        map.on("singleclick", onSingleClick);
        element.addEventListener("mouseleave", onMouseLeave);

        const translateFeatures = new Collection();
        const translate = new Translate({
            features: translateFeatures,
            layers: [markerLayer],
            hitTolerance: HIT_TOLERANCE,
            condition: primaryAction,
        });

        translate.setActive(false);
        map.addInteraction(translate);
        translateRef.current = { translate, features: translateFeatures };

        const onTranslateStart = (event) => {
            event.features.forEach((feature) => {
                if (feature.get("kind") !== "location") return;
                draggingIdRef.current = feature.get("locationId") || null;
            });
            markerLayer.changed();
        };

        const onTranslateEnd = (event) => {
            event.features.forEach((feature) => {
                if (feature.get("kind") !== "location") return;

                const id = feature.get("locationId");
                const geometry = feature.getGeometry();
                if (!id || !geometry) return;

                const [x, y] = geometry.getCoordinates();
                pendingCoordsRef.current.set(id, { x, y });
                onMoveLocationRef.current?.({ id, x, y });
            });

            draggingIdRef.current = null;
            markerLayer.changed();
        };

        translate.on("translatestart", onTranslateStart);
        translate.on("translateend", onTranslateEnd);

        return () => {
            map.un("pointermove", onPointerMove);
            map.un("singleclick", onSingleClick);
            element.removeEventListener("mouseleave", onMouseLeave);

            translate.un("translatestart", onTranslateStart);
            translate.un("translateend", onTranslateEnd);
            map.removeInteraction(translate);
            translateRef.current = null;

            map.setTarget(undefined);

            mapRef.current = null;
            markerLayerRef.current = null;
            markerSourceRef.current = null;
            previewFeatureRef.current = null;
        };
    }, [
        mapId,
        storageUrl,
        tilesVersion,
        extent,
        projection,
        resolutions,
        maxZoom,
        markerIconUrl,
        getMarkerStyle,
        pickLocationFeatureAtPixel,
        locationsRef,
        addModeRef,
        onMapClickRef,
        onSelectLocationRef,
        onMoveLocationRef,
    ]);

    useEffect(() => {
        const source = markerSourceRef.current;
        const layer = markerLayerRef.current;
        if (!source || !layer) return;

        const byId = featuresByIdRef.current;
        const nextIds = new Set(locations.map((location) => location.id));

        for (const [id, feature] of byId.entries()) {
            if (nextIds.has(id)) continue;

            source.removeFeature(feature);
            byId.delete(id);
            pendingCoordsRef.current.delete(id);

            if (hoveredIdRef.current === id) hoveredIdRef.current = null;
            if (selectedIdRef.current === id) selectedIdRef.current = null;
        }

        for (const location of locations) {
            let feature = byId.get(location.id);

            if (!feature) {
                feature = new Feature({
                    geometry: new Point([location.x, location.y]),
                    kind: "location",
                    locationId: location.id,
                });
                byId.set(location.id, feature);
                source.addFeature(feature);
            }

            const pending = pendingCoordsRef.current.get(location.id);
            feature.getGeometry().setCoordinates([
                pending ? pending.x : location.x,
                pending ? pending.y : location.y,
            ]);

            if (pending && pending.x === location.x && pending.y === location.y) {
                pendingCoordsRef.current.delete(location.id);
            }

            if (location.iconUrl) feature.set("iconUrl", location.iconUrl);
            else feature.unset("iconUrl", true);
        }

        layer.changed();
    }, [locations]);

    useEffect(() => {
        const feature = previewFeatureRef.current;
        const layer = markerLayerRef.current;
        if (!feature || !layer) return;

        feature.set("iconUrl", markerIconUrl);

        if (!previewCoord) {
            feature.set("visible", false);
            layer.changed();
            return;
        }

        feature.set("visible", true);
        feature.getGeometry().setCoordinates([previewCoord.x, previewCoord.y]);
        layer.changed();
    }, [previewCoord, markerIconUrl]);

    useEffect(() => {
        selectedIdRef.current = selectedLocationId;

        const map = mapRef.current;
        const layer = markerLayerRef.current;
        const byId = featuresByIdRef.current;

        function rollbackPendingFor(id) {
            const pending = pendingCoordsRef.current.get(id);
            if (!pending) return;

            pendingCoordsRef.current.delete(id);

            const location = locationsRef.current.find((item) => item.id === id);
            const feature = byId.get(id);

            if (location && feature) {
                feature.getGeometry().setCoordinates([location.x, location.y]);
            }

            if (draggingIdRef.current === id) {
                draggingIdRef.current = null;
            }

            layer?.changed();
        }

        const previous = prevSelectedIdRef.current;
        const next = selectedLocationId || null;
        const shouldLeaveEditContext = addMode || !editMode;

        if (previous && (previous !== next || shouldLeaveEditContext)) {
            rollbackPendingFor(previous);
        }

        prevSelectedIdRef.current = next;

        if (!map || !translateRef.current) {
            layer?.changed();
            return;
        }

        const { translate, features } = translateRef.current;
        features.clear();

        const canDrag =
            Boolean(editMode) &&
            Boolean(selectedLocationId) &&
            byId.has(selectedLocationId) &&
            !addMode;

        if (canDrag) {
            features.push(byId.get(selectedLocationId));
        }

        translate.setActive(canDrag);
        layer?.changed();
    }, [selectedLocationId, editMode, addMode, locationsRef]);

    useEffect(() => {
        const element = elRef.current;
        if (!element) return undefined;

        const resizeMap = () => mapRef.current?.updateSize();
        const observer = new ResizeObserver(resizeMap);
        observer.observe(element);

        const timeoutId = window.setTimeout(resizeMap, 0);
        window.addEventListener("resize", resizeMap);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", resizeMap);
            window.clearTimeout(timeoutId);
        };
    }, []);

    const animateZoomBy = (delta) => {
        const map = mapRef.current;
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom() ?? MIN_ZOOM;
        const targetZoom = Math.max(MIN_ZOOM, Math.min(maxZoom, currentZoom + delta));

        if (targetZoom === currentZoom) return;

        const center = view.getCenter();
        if (!center) return;

        const targetResolution = view.getResolutionForZoom(targetZoom);
        const constrainedCenter = view.getConstrainedCenter(center, targetResolution);

        view.animate(
            { zoom: targetZoom, center: constrainedCenter, duration: 180 },
            () => {
                const zoom = view.getZoom() ?? targetZoom;
                const resolution = view.getResolutionForZoom(zoom);
                const currentCenter = view.getCenter();

                if (currentCenter) {
                    view.setCenter(view.getConstrainedCenter(currentCenter, resolution));
                }

                map.renderSync();
            }
        );
    };

    return (
        <div className="relative h-full w-full">
            <div
                ref={elRef}
                className="h-full w-full"
                aria-label={t("map.ariaLabel")}
            />

            <div className="map-control-stack">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="map-control-btn"
                    title={t("map.zoomIn")}
                    aria-label={t("map.zoomIn")}
                    onClick={() => animateZoomBy(0.5)}
                >
                    <Plus className="h-4 w-4" strokeWidth={4} aria-hidden="true" />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="map-control-btn"
                    title={t("map.zoomOut")}
                    aria-label={t("map.zoomOut")}
                    onClick={() => animateZoomBy(-0.5)}
                >
                    <Minus className="h-4 w-4" strokeWidth={4} aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
