// GUI-11: Display relative age of voting equipment
// Choropleth map on splash page showing average equipment age by state
// Bins: 1-10 years + "older than 10 years"
// Monochromatic colors with increasing saturation for older devices

import React, { useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Paper, Typography, Button } from "@mui/material";
import L from "leaflet";
import type { Feature } from "geojson";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";

interface StateEquipmentAge {
    state: string;
    averageAge: number; // Average age of all equipment in years
}

interface Props {
    data: StateEquipmentAge[];
    geoJsonData?: any; // US states GeoJSON
    onClose?: () => void; // Callback to return to normal map view
}

// Age bins and corresponding colors (monochromatic blue with increasing saturation)
const AGE_BINS = [
    { max: 1, label: "0-1 years", color: "#f5f5f5" },
    { max: 2, label: "1-2 years", color: "#e0e0e0" },
    { max: 3, label: "2-3 years", color: "#bdbdbd" },
    { max: 4, label: "3-4 years", color: "#9e9e9e" },
    { max: 5, label: "4-5 years", color: "#757575" },
    { max: 6, label: "5-6 years", color: "#616161" },
    { max: 7, label: "6-7 years", color: "#424242" },
    { max: 8, label: "7-8 years", color: "#424242" },
    { max: 9, label: "8-9 years", color: "#212121" },
    { max: 10, label: "9-10 years", color: "#212121" },
    { max: Infinity, label: "Older than 10 years", color: "#000000" },
];

const getColorForAge = (age: number): string => {
    for (const bin of AGE_BINS) {
        if (age <= bin.max) {
            return bin.color;
        }
    }
    return "#cccccc";
};

const getBinLabel = (age: number): string => {
    for (const bin of AGE_BINS) {
        if (age <= bin.max) {
            return bin.label;
        }
    }
    return "No data";
};

const EquipmentAgeChoropleth: React.FC<Props> = ({
    data,
    geoJsonData,
    onClose,
}) => {
    // Track map + GeoJSON + hovered layer for proper highlight clearing
    const mapRef = useRef<L.Map | null>(null);
    const geoRef = useRef<L.GeoJSON | null>(null);
    const hoveredRef = useRef<L.Path | null>(null);

    const clearHover = () => {
        if (hoveredRef.current) {
            try {
                geoRef.current?.resetStyle(hoveredRef.current as any);
                if ((hoveredRef.current as any).closeTooltip) {
                    (hoveredRef.current as any).closeTooltip();
                }
            } catch {
                // ignore if layer is detached
            }
            hoveredRef.current = null;
        }
    };

    // Create lookup map for equipment age by state
    const ageLookup = useMemo(() => {
        const lookup = new Map<string, number>();
        data.forEach((item) => {
            lookup.set(item.state.toLowerCase(), item.averageAge);
        });
        return lookup;
    }, [data]);

    // Style function for GeoJSON features
    const getFeatureStyle = (feature?: Feature) => {
        if (!feature || !feature.properties) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.5,
            };
        }

        const stateName = (
            feature.properties.name ||
            feature.properties.NAME ||
            ""
        ).toLowerCase();

        const age = ageLookup.get(stateName);

        if (age === undefined) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.3,
            };
        }

        return {
            fillColor: getColorForAge(age),
            weight: 2,
            opacity: 1,
            color: "#ffffff",
            fillOpacity: 0.8,
        };
    };

    // Event handlers for interactive features
    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        if (!feature.properties) return;

        const stateName = (
            feature.properties.name ||
            feature.properties.NAME ||
            "Unknown"
        ).toLowerCase();

        const age = ageLookup.get(stateName);

        const tooltipContent =
            age !== undefined
                ? `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${feature.properties.name || feature.properties.NAME}</div>
         <div style="font-size: 13px;">Average Equipment Age: <strong>${age.toFixed(1)} years</strong></div>
         <div style="font-size: 13px;">Category: <strong>${getBinLabel(age)}</strong></div>`
                : `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${feature.properties.name || feature.properties.NAME}</div>
         <div style="font-size: 13px; color: #ff9800;">No equipment age data available</div>`;

        // Use responsive tooltip helper to avoid cutoff
        bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;
                targetLayer.setStyle({
                    weight: 3,
                    color: '#1976d2',
                    fillOpacity: 1.0,
                });
                if ((targetLayer as any).bringToFront) {
                    (targetLayer as any).bringToFront();
                }

                // Open tooltip
                if (!(targetLayer as any).isTooltipOpen()) {
                    (targetLayer as any).openTooltip();
                }
            },
            mouseout: (e) => {
                geoRef.current?.resetStyle(e.target as any);
                if (hoveredRef.current === e.target) hoveredRef.current = null;

                // Close tooltip
                try {
                    (e.target as L.Path).closeTooltip();
                } catch {
                    /* ignore */
                }
            },
        });
    };

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
    }, [geoJsonData]);

    if (!geoJsonData) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    Map data not available
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
            {/* Close button to return to normal view */}
            {onClose && (
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        zIndex: 1000,
                    }}
                >
                    Back to State Map
                </Button>
            )}

            {/* Legend - repositioned to bottom-left to avoid zoom controls */}
            <Paper
                sx={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    zIndex: 1000,
                    p: 2,
                    maxWidth: 250,
                }}
            >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Average Equipment Age (years)
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {AGE_BINS.map((bin, index) => (
                        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: bin.color,
                                    border: "1px solid #666",
                                    flexShrink: 0,
                                }}
                            />
                            <Typography variant="caption">{bin.label}</Typography>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* Map */}
            <MapContainer
                ref={(m) => { mapRef.current = m; }}
                center={[39.5, -96.0]}
                zoom={4.8}
                zoomSnap={0.25}
                minZoom={4.0}
                maxZoom={7}
                maxBounds={[
                    [20, -130],
                    [50, -60],
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", borderRadius: "8px" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                />
                <GeoJSON
                    ref={geoRef as any}
                    data={geoJsonData}
                    style={getFeatureStyle}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
        </Box>
    );
};

export default EquipmentAgeChoropleth;
