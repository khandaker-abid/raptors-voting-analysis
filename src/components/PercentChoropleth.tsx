// Reusable Leaflet choropleth for GUI‑8/9. Expects percentOfTotal 0..100.
import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import theme from "../theme";
import { lighten, darken } from "@mui/material/styles";
import type { Feature, FeatureCollection, Geometry } from "geojson";


interface Props {
    stateName: string;
    // [{ geographicUnit, percentOfTotal }]
    data: { geographicUnit: string; percentOfTotal: number }[];
}


type CountyFeature = Feature<Geometry, { ste_name: string[]; coty_name: string[]; coty_name_long: string[]; }>


type CountyGeoJSONData = FeatureCollection<Geometry, { ste_name: string[]; coty_name: string[]; coty_name_long: string[]; }>


const PercentChoropleth: React.FC<Props> = ({ stateName, data }) => {
    const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

    // Track map + GeoJSON + hovered layer for proper highlight clearing
    const mapRef = useRef<L.Map | null>(null);
    const geoRef = useRef<L.GeoJSON | null>(null);
    const hoveredRef = useRef<L.Path | null>(null);

    const clearHover = () => {
        if (hoveredRef.current) {
            try {
                geoRef.current?.resetStyle(hoveredRef.current as any);
                // Close tooltip
                if ((hoveredRef.current as any).closeTooltip) {
                    (hoveredRef.current as any).closeTooltip();
                }
            } catch {
                // layer might be detached; ignore
            }
            hoveredRef.current = null;
        }
    };


    const lookup = useMemo(() => {
        const m = new Map<string, number>();
        data.forEach(d => m.set(d.geographicUnit.toLowerCase().replace(/\s+county$/, "").trim(), d.percentOfTotal));
        return m;
    }, [data]);


    const COLOR_PALETTE = useMemo(() => {
        const main = theme.palette.primary.main;
        return [
            lighten(main, 0.6),
            lighten(main, 0.35),
            lighten(main, 0.15),
            main,
            darken(main, 0.08),
            darken(main, 0.24),
            darken(main, 0.45),
        ];
    }, [theme.palette.primary.main]);

    const color = (p: number) => {
        const stops = COLOR_PALETTE;
        const idx = Math.max(0, Math.min(stops.length - 1, Math.floor((p / 100) * stops.length)));
        return stops[idx];
    };


    const styleFor = (feature?: Feature) => {
        if (!feature) return { weight: 1, color: "#fff", fillOpacity: .7 } as L.PathOptions;
        const f = feature as CountyFeature;
        const raw = (f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "").toLowerCase();
        const key = raw.replace(/\s+county$/, "").trim();
        const p = lookup.get(key) ?? 0;
        return { fillColor: color(p), weight: 1, color: "#fff", fillOpacity: .75 } as L.PathOptions;
    };

    // Add event handlers to each feature
    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        const f = feature as CountyFeature;
        const displayName = f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "Unknown";
        const raw = displayName.toLowerCase();
        const key = raw.replace(/\s+county$/, "").trim();
        const p = lookup.get(key) ?? 0;

        const tooltipContent = `
            <div style="font-weight: bold; margin-bottom: 4px;">${displayName}</div>
            <div>Percentage: <span style="color: #2196f3; font-weight: bold;">${p.toFixed(1)}%</span></div>
        `;

        (layer as any).bindTooltip(tooltipContent, {
            permanent: false,
            direction: "center",
            className: "custom-tooltip",
        });

        layer.on({
            mouseover: (e: any) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;
                targetLayer.setStyle({
                    weight: 3,
                    color: "#333",
                    dashArray: "",
                    fillOpacity: 0.9,
                });
                if ((targetLayer as any).bringToFront) {
                    (targetLayer as any).bringToFront();
                }
                // Ensure tooltip opens
                if (!targetLayer.isTooltipOpen()) {
                    targetLayer.openTooltip();
                }
            },
            mouseout: (e: any) => {
                geoRef.current?.resetStyle(e.target as any);
                if (hoveredRef.current === e.target) hoveredRef.current = null;
                // Ensure tooltip closes
                try {
                    (e.target as L.Path).closeTooltip();
                } catch {
                    /* ignore */
                }
            },
            click: () => {
                // Clear highlight proactively if a dialog opens on click
                clearHover();
            },
        });
    };


    useEffect(() => {
        (async () => {
            const res = await fetch("/georef-united-states-of-america-county.geojson");
            const counties = (await res.json()) as CountyGeoJSONData;
            const feats = counties.features.filter(f => f.properties.ste_name?.includes(stateName));
            const fb = new L.LatLngBounds([]);
            feats.forEach((feature) => {
                if (feature.geometry.type === "Polygon") {
                    (feature.geometry.coordinates[0] as any[]).forEach(([x, y]) => fb.extend([y, x]));
                } else if (feature.geometry.type === "MultiPolygon") {
                    (feature.geometry.coordinates as any[]).forEach(poly => poly[0].forEach(([x, y]: any[]) => fb.extend([y, x])));
                }
            });
            setBounds(fb.pad(0.1));
            setGeoData({ type: "FeatureCollection", features: feats });
        })();
    }, [stateName]);

    // Clear hover when cursor leaves the map container
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const node = map.getContainer();
        const handleLeave = () => clearHover();

        node.addEventListener("mouseleave", handleLeave);

        return () => {
            node.removeEventListener("mouseleave", handleLeave);
        };
    }, [geoData]);
    if (!geoData) return null;


    return (
        <MapContainer
            ref={(m) => { mapRef.current = m; }}
            bounds={bounds || undefined}
            style={{ height: 400, width: "100%", borderRadius: 8 }}
            scrollWheelZoom
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap & CARTO' />
            <GeoJSON
                ref={geoRef as any}
                data={geoData}
                style={styleFor}
                onEachFeature={onEachFeature}
            />
        </MapContainer>
    );
};


export default PercentChoropleth;