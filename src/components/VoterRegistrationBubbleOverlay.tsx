import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import type { BlockBubblePayload } from "../data/types";
import { CHART_HEIGHTS } from "../constants";


interface Props { stateName: string; payload: BlockBubblePayload; }


const VoterRegistrationBubbleOverlay: React.FC<Props> = ({ payload }) => {
    const radius = useMemo(() => {
        const n = Math.max(1, payload.points.length);
        return Math.max(1.5, Math.min(6, 80 / Math.sqrt(n)));
    }, [payload.points.length]);


    const center = useMemo(() => {
        if (!payload.points.length) return [37.5, -96.9] as [number, number];
        const lat = payload.points.reduce((s, p) => s + p.lat, 0) / payload.points.length;
        const lng = payload.points.reduce((s, p) => s + p.lng, 0) / payload.points.length;
        return [lat, lng] as [number, number];
    }, [payload.points]);


    return (
        <MapContainer center={center} zoom={6} style={{ height: CHART_HEIGHTS.STANDARD, width: "100%", borderRadius: 8 }} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap & CARTO' />
            {payload.points.map((pt, i) => (
                <CircleMarker key={i} center={[pt.lat, pt.lng]} radius={radius} pathOptions={{ color: pt.dominantParty === 'R' ? '#ef5350' : '#42a5f5', fillOpacity: 0.85 }} />
            ))}
        </MapContainer>
    );
};


export default VoterRegistrationBubbleOverlay;