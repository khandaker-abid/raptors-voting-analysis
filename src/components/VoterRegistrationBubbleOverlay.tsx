// GUI - 18
import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import type { BlockBubblePayload } from "../data/types";


interface Props { stateName: string; payload: BlockBubblePayload; }


const VoterRegistrationBubbleOverlay: React.FC<Props> = ({ stateName, payload }) => {
    // auto radius selection to reduce overlap: proportional to inverse sqrt of density
    const radius = useMemo(() => {
        const n = Math.max(1, payload.points.length);
        // simple heuristic tuned for state-level: tweak multiplier as needed
        return Math.max(1.5, Math.min(6, 80 / Math.sqrt(n)));
    }, [payload.points.length]);


    // center on mean of points (fallback handled by parent)
    const center = useMemo(() => {
        if (!payload.points.length) return [37.5, -96.9] as [number, number];
        const lat = payload.points.reduce((s, p) => s + p.lat, 0) / payload.points.length;
        const lng = payload.points.reduce((s, p) => s + p.lng, 0) / payload.points.length;
        return [lat, lng] as [number, number];
    }, [payload.points]);


    return (
        <MapContainer center={center} zoom={6} style={{ height: 500, width: "100%", borderRadius: 8 }} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap & CARTO' />
            {payload.points.map((pt, i) => (
                <CircleMarker key={i} center={[pt.lat, pt.lng]} radius={radius} pathOptions={{ color: pt.dominantParty === 'R' ? '#ef5350' : '#42a5f5', fillOpacity: 0.85 }} />
            ))}
        </MapContainer>
    );
};


export default VoterRegistrationBubbleOverlay;