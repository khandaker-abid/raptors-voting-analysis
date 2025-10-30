// GUI-10: Display type of voting equipment
// Shows EAVS geographic units colored by equipment type
// Categories: DRE no VVPAT, DRE with VVPAT, Ballot marking device, Scanner
// Mixed equipment shows stripe pattern or blended color

import React, { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Paper, Typography } from "@mui/material";
import L from "leaflet";
import type { Feature, Geometry } from "geojson";

interface EquipmentTypeData {
    geographicUnit: string;
    primaryEquipmentType: "DRE_NO_VVPAT" | "DRE_WITH_VVPAT" | "BALLOT_MARKING" | "SCANNER" | "MIXED";
    // Optional: breakdown of equipment counts for mixed determination
    equipmentBreakdown?: {
        dreNoVVPAT: number;
        dreWithVVPAT: number;
        ballotMarking: number;
        scanner: number;
    };
}

interface Props {
    stateName: string;
    data: EquipmentTypeData[];
    geoJsonData?: any; // GeoJSON for the state's geographic units
}

const EQUIPMENT_COLORS: Record<string, string> = {
    DRE_NO_VVPAT: "#d32f2f", // Red - older technology
    DRE_WITH_VVPAT: "#f57c00", // Orange - improved DRE
    BALLOT_MARKING: "#1976d2", // Blue - modern
    SCANNER: "#388e3c", // Green - reliable
    MIXED: "#9c27b0", // Purple - mixed equipment
};

const EQUIPMENT_LABELS: Record<string, string> = {
    DRE_NO_VVPAT: "DRE without VVPAT",
    DRE_WITH_VVPAT: "DRE with VVPAT",
    BALLOT_MARKING: "Ballot Marking Device",
    SCANNER: "Scanner",
    MIXED: "Mixed Equipment Types",
};

const VotingEquipmentTypeChoropleth: React.FC<Props> = ({
    stateName,
    data,
    geoJsonData,
}) => {
    // Create lookup map for equipment type by geographic unit
    const equipmentLookup = useMemo(() => {
        const lookup = new Map<string, EquipmentTypeData>();
        data.forEach((item) => {
            lookup.set(item.geographicUnit.toLowerCase(), item);
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

        const unitName = (
            feature.properties.name ||
            feature.properties.NAME ||
            feature.properties.NAMELSAD ||
            ""
        ).toLowerCase();

        const equipmentData = equipmentLookup.get(unitName);

        if (!equipmentData) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.3,
            };
        }

        const fillColor =
            EQUIPMENT_COLORS[equipmentData.primaryEquipmentType] || "#cccccc";

        return {
            fillColor,
            weight: 2,
            opacity: 1,
            color: "#ffffff",
            fillOpacity: 0.7,
        };
    };

    // Event handlers for interactive features
    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        if (!feature.properties) return;

        const unitName = (
            feature.properties.name ||
            feature.properties.NAME ||
            feature.properties.NAMELSAD ||
            "Unknown"
        ).toLowerCase();

        const equipmentData = equipmentLookup.get(unitName);

        const tooltipContent = equipmentData
            ? `<strong>${feature.properties.name || feature.properties.NAME}</strong><br/>
         Equipment: ${EQUIPMENT_LABELS[equipmentData.primaryEquipmentType]}`
            : `<strong>${feature.properties.name || feature.properties.NAME}</strong><br/>
         No equipment data available`;

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
                    fillOpacity: 0.9,
                });
                targetLayer.bringToFront();
            },
            mouseout: (e) => {
                const targetLayer = e.target;
                targetLayer.setStyle({
                    weight: 2,
                    fillOpacity: 0.7,
                });
            },
        });
    };

    if (!geoJsonData) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    Geographic boundary data not available for {stateName}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Voting Equipment Types by Region
            </Typography>

            {/* Legend */}
            <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                    <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: EQUIPMENT_COLORS[key],
                                border: "1px solid #666",
                            }}
                        />
                        <Typography variant="body2">{label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Map */}
            <Box sx={{ height: 500, border: "1px solid #ccc", borderRadius: 1 }}>
                <MapContainer
                    center={[39.5, -96.0]}
                    zoom={6}
                    style={{ height: "100%", width: "100%", borderRadius: "4px" }}
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

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Mixed equipment types are shown when multiple equipment categories are used
                within a geographic region.
            </Typography>
        </Paper>
    );
};

export default VotingEquipmentTypeChoropleth;
