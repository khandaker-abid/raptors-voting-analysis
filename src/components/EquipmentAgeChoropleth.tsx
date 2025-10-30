// GUI-11: Display relative age of voting equipment
// Choropleth map on splash page showing average equipment age by state
// Bins: 1-10 years + "older than 10 years"
// Monochromatic colors with increasing saturation for older devices

import React, { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Paper, Typography, Button } from "@mui/material";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";

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
    { max: 1, label: "0-1 years", color: "#e3f2fd" },
    { max: 2, label: "1-2 years", color: "#bbdefb" },
    { max: 3, label: "2-3 years", color: "#90caf9" },
    { max: 4, label: "3-4 years", color: "#64b5f6" },
    { max: 5, label: "4-5 years", color: "#42a5f5" },
    { max: 6, label: "5-6 years", color: "#2196f3" },
    { max: 7, label: "6-7 years", color: "#1e88e5" },
    { max: 8, label: "7-8 years", color: "#1976d2" },
    { max: 9, label: "8-9 years", color: "#1565c0" },
    { max: 10, label: "9-10 years", color: "#0d47a1" },
    { max: Infinity, label: "Older than 10 years", color: "#01579b" },
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
                ? `<strong>${feature.properties.name || feature.properties.NAME}</strong><br/>
         Average Equipment Age: ${age.toFixed(1)} years<br/>
         Category: ${getBinLabel(age)}`
                : `<strong>${feature.properties.name || feature.properties.NAME}</strong><br/>
         No equipment age data available`;

        layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: "auto",
            sticky: true,
        });

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target;
                targetLayer.setStyle({
                    weight: 3,
                    fillOpacity: 1.0,
                });
                targetLayer.bringToFront();
            },
            mouseout: (e) => {
                const targetLayer = e.target;
                targetLayer.setStyle({
                    weight: 2,
                    fillOpacity: 0.8,
                });
            },
        });
    };

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

            {/* Legend */}
            <Paper
                sx={{
                    position: "absolute",
                    top: 16,
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
                    data={geoJsonData}
                    style={getFeatureStyle}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
        </Box>
    );
};

export default EquipmentAgeChoropleth;
