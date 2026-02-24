import React, { useEffect, useMemo, useRef } from "react";
import Map from "ol/Map";
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
  markerIconUrl = "/marker.png",
  previewIconUrl = "/marker.png",
}) {
  const elRef = useRef(null);

  const mapRef = useRef(null);
  const markerSourceRef = useRef(null);

  const addModeRef = useRef(addMode);
  const locationsRef = useRef(locations);
  const onMapClickRef = useRef(onMapClick);
  const onSelectLocationRef = useRef(onSelectLocation);

  useEffect(() => { addModeRef.current = addMode; }, [addMode]);
  useEffect(() => { locationsRef.current = locations; }, [locations]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onSelectLocationRef.current = onSelectLocation; }, [onSelectLocation]);

  const extent = useMemo(() => {
    return [0, 0, width, height];
  }, [width, height]);

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
    });

    const view = new View({
      projection,
      center: [extent[2] / 2, extent[3] / 2],
      zoom: 0,
      minZoom: 0,
      maxZoom,
      extent,
      constrainOnlyCenter: false,
      smoothExtentConstraint: true,
      resolutions,
    });

    const map = new Map({
      target: elRef.current,
      controls: defaultControls(),
      interactions: defaultInteractions(),
      layers: [tiles, markerLayer],
      view,
    });

    view.fit(extent, { padding: [20, 20, 20, 20] });

    map.on("singleclick", (evt) => {
      let picked = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        picked = feature;
        return true;
      });

      if (picked) {
        const kind = picked.get("kind");
        if (kind === "location") {
          const id = picked.get("locationId");
          const loc = locationsRef.current.find((l) => l.id === id);
          if (loc) onSelectLocationRef.current?.(loc);
        }
        return;
      }

      if (!addModeRef.current) return;
      const [x, y] = evt.coordinate;
      onMapClickRef.current?.({ x, y });
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current = null;
    };
  }, [mapId, nginxUrl, extent, projection, resolutions, maxZoom]);

  const markerStyle = useMemo(() => {
    return new Style({
      image: new Icon({
        src: markerIconUrl,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        crossOrigin: "anonymous",
        scale: 0.1,
      }),
    });
  }, [markerIconUrl]);

  const previewStyle = useMemo(() => {
    return new Style({
      image: new Icon({
        src: previewIconUrl || markerIconUrl,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        opacity: 0.8,
        crossOrigin: "anonymous",
        scale: 0.1,
      }),
    });
  }, [previewIconUrl, markerIconUrl]);

  useEffect(() => {
    const source = markerSourceRef.current;
    if (!source) return;

    source.clear();

    for (const loc of locations) {
      const f = new Feature({
        geometry: new Point([loc.x, loc.y]),
        kind: "location",
        locationId: loc.id,
      });

      f.setStyle(markerStyle);

      source.addFeature(f);
    }

    if (previewCoord) {
      const f = new Feature({
        geometry: new Point([previewCoord.x, previewCoord.y]),
        kind: "preview",
      });

      f.setStyle(previewStyle);

      source.addFeature(f);
    }
  }, [locations, previewCoord, markerStyle, previewStyle]);

  return <div ref={elRef} style={{ width: "100%", height: "100%" }} />;
}