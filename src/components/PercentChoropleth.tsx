// Reusable Leaflet choropleth for GUI‑8/9. Expects percentOfTotal 0..100.
import React, { useEffect, useMemo, useState } from "react";
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


    if (!geoData) return null;


    return (
        <MapContainer bounds={bounds || undefined} style={{ height: 400, width: "100%", borderRadius: 8 }} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap & CARTO' />
            <GeoJSON data={geoData} style={styleFor} />
        </MapContainer>
    );
};


export default PercentChoropleth;