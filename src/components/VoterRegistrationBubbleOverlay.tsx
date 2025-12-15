import React, { useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { Paper, Typography, Box } from "@mui/material";
import type { BlockBubblePayload } from "../data/types";
import { CHART_HEIGHTS } from "../constants";
import L from "leaflet";

interface Props { 
    stateName: string; 
    payload: BlockBubblePayload; 
}

// Component to handle map bounds updates
const MapBoundsUpdater: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
    const map = useMap();
    
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [bounds, map]);
    
    return null;
};

const VoterRegistrationBubbleOverlay: React.FC<Props> = ({ stateName, payload }) => {
    const mapKey = useRef(Math.random()).current; // Force remount when switching views

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

    const bounds = useMemo(() => {
        if (!payload.points.length) return null;
        const bounds = new L.LatLngBounds([]);
        payload.points.forEach(pt => {
            bounds.extend([pt.lat, pt.lng]);
        });
        return bounds.pad(0.1);
    }, [payload.points]);

    console.log('VoterRegistrationBubbleOverlay:', {
        state: stateName,
        pointsCount: payload.points.length,
        center,
        bounds,
        samplePoint: payload.points[0]
    });

    if (!payload.points || payload.points.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center", height: "100%" }}>
                <Typography variant="body1" color="text.secondary">
                    No census block party data available for {stateName}.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: "0.85rem" }}>
                    Run preprocessing script 09_geocode_voters_to_census_blocks.py to generate this data.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem", mb: 1 }}>
                Party Affiliation by Census Block
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <MapContainer 
                    key={mapKey}
                    center={center} 
                    zoom={7} 
                    style={{ height: "100%", width: "100%", borderRadius: 8 }} 
                    scrollWheelZoom
                >
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" 
                        attribution='&copy; OpenStreetMap & CARTO' 
                    />
                    <MapBoundsUpdater bounds={bounds} />
                    {payload.points.map((pt, i) => {
                        const color = pt.dominantParty === 'R' ? '#ef5350' : '#42a5f5';
                        return (
                            <CircleMarker 
                                key={i} 
                                center={[pt.lat, pt.lng]} 
                                radius={radius} 
                                pathOptions={{ 
                                    fillColor: color,
                                    color: color,
                                    fillOpacity: 0.6,
                                    opacity: 0.8,
                                    weight: 1
                                }} 
                            />
                        );
                    })}
                </MapContainer>
            </Box>
        </Box>
    );
};

export default VoterRegistrationBubbleOverlay;