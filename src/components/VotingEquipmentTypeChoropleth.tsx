// GUI-10: Display type of voting equipment
// Shows EAVS geographic units colored by equipment type
// Categories: DRE no VVPAT, DRE with VVPAT, Ballot marking device, Scanner
// Mixed equipment shows stripe pattern or blended color

import React, { useMemo, useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";
import { createCountyLookupMap, normalizeCountyName } from "../utils/countyNameNormalizer";

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
}

type CountyFeature = Feature<
    Geometry,
    {
        ste_name: string[];
        coty_name: string[];
        coty_name_long: string[];
    }
>;

type CountyGeoJSONData = FeatureCollection<
    Geometry,
    {
        ste_name: string[];
        coty_name: string[];
        coty_name_long: string[];
    }
>;

const EQUIPMENT_COLORS: Record<string, string> = {
    DRE_NO_VVPAT: "#424242", // Dark gray - older technology
    DRE_WITH_VVPAT: "#757575", // Medium gray - improved DRE
    BALLOT_MARKING: "#9e9e9e", // Light gray - modern
    SCANNER: "#616161", // Gray - reliable
    MIXED: "#bdbdbd", // Lighter gray - mixed equipment
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
}) => {
    // State for boundary data loading
    const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

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

    // Load boundary data
    useEffect(() => {
        const loadMapData = async () => {
            if (!stateName) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    "/georef-united-states-of-america-county.geojson"
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch county data: ${response.statusText}`);
                }

                const countyData = (await response.json()) as CountyGeoJSONData;

                if (!countyData || !countyData.features) {
                    throw new Error("County GeoJSON data is invalid or empty");
                }

                // Filter counties by state name
                const features = countyData.features.filter(
                    (feature: CountyFeature) =>
                        feature.properties.ste_name &&
                        feature.properties.ste_name.includes(stateName)
                );

                if (features.length === 0) {
                    throw new Error(`No county data found for ${stateName}`);
                }

                // Create FeatureCollection for the map
                const featureCollection: FeatureCollection = {
                    type: "FeatureCollection",
                    features: features,
                };

                // Calculate bounds for the map
                const bounds = new L.LatLngBounds([]);
                features.forEach((feature) => {
                    if (feature.geometry.type === "Polygon") {
                        feature.geometry.coordinates[0].forEach((coord) => {
                            bounds.extend([coord[1], coord[0]]);
                        });
                    } else if (feature.geometry.type === "MultiPolygon") {
                        feature.geometry.coordinates.forEach((polygon) => {
                            polygon[0].forEach((coord) => {
                                bounds.extend([coord[1], coord[0]]);
                            });
                        });
                    }
                });

                setGeoData(featureCollection);
                setMapBounds(bounds.isValid() ? bounds : null);
                setLoading(false);
            } catch (err: any) {
                console.error("Error loading map data:", err);
                setError(err.message || "Failed to load map data");
                setLoading(false);
            }
        };

        loadMapData();
    }, [stateName]);

    // Create lookup map for equipment type by geographic unit
    // Uses centralized normalization to handle apostrophes, periods, etc.
    const equipmentLookup = useMemo(() => {
        return createCountyLookupMap(
            data,
            (item) => item.geographicUnit,
            (item) => item
        );
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

        // Get county name from GeoJSON properties
        // The georef-united-states-of-america-county.geojson uses coty_name_long
        const countyNameArray = feature.properties.coty_name_long ||
            feature.properties.coty_name ||
            [feature.properties.name] ||
            [feature.properties.NAME] ||
            [feature.properties.NAMELSAD] ||
            [""];
        const unitName = Array.isArray(countyNameArray) ? countyNameArray[0] : countyNameArray;

        // Use centralized normalization for consistent matching
        const normalizedName = normalizeCountyName(unitName);
        const equipmentData = equipmentLookup.get(normalizedName);

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

        // Get county name from GeoJSON properties
        const countyNameArray = feature.properties.coty_name_long ||
            feature.properties.coty_name ||
            [feature.properties.name] ||
            [feature.properties.NAME] ||
            [feature.properties.NAMELSAD] ||
            ["Unknown"];
        const unitName = Array.isArray(countyNameArray) ? countyNameArray[0] : countyNameArray;
        const displayName = unitName || "Unknown";

        const normalizedName = normalizeCountyName(unitName);
        const equipmentData = equipmentLookup.get(normalizedName);

        let tooltipContent = "";
        if (equipmentData) {
            tooltipContent = `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${displayName}</div>`;
            tooltipContent += `<div style="font-size: 12px;">Equipment: <strong>${EQUIPMENT_LABELS[equipmentData.primaryEquipmentType]}</strong></div>`;

            // If equipment type is MIXED, show breakdown with percentages
            if (equipmentData.primaryEquipmentType === "MIXED" && equipmentData.equipmentBreakdown) {
                const breakdown = equipmentData.equipmentBreakdown as any;

                // Check if we have equipmentTypeCounts (Rhode Island aggregated data)
                if (breakdown.equipmentTypeCounts) {
                    const counts = breakdown.equipmentTypeCounts;
                    const total = Object.values(counts).reduce((sum: number, val) => sum + (val as number), 0);

                    if (total > 0) {
                        tooltipContent += `<div style="font-size: 11px; margin-top: 4px; color: #ddd;">`;
                        Object.entries(counts).forEach(([type, count]) => {
                            const percentage = ((count as number / total) * 100).toFixed(0);
                            const label = EQUIPMENT_LABELS[type] || type;
                            tooltipContent += `<div>• ${label}: ${percentage}%</div>`;
                        });
                        tooltipContent += `</div>`;
                    }
                }
                // Check if we have markingMethod and tabulationMethod (Arkansas/Maryland data)
                else if (breakdown.markingMethod || breakdown.tabulationMethod) {
                    tooltipContent += `<div style="font-size: 11px; margin-top: 4px; color: #ddd;">`;
                    if (breakdown.markingMethod) {
                        tooltipContent += `<div>• Marking: ${breakdown.markingMethod}</div>`;
                    }
                    if (breakdown.tabulationMethod) {
                        tooltipContent += `<div>• Tabulation: ${breakdown.tabulationMethod}</div>`;
                    }
                    tooltipContent += `</div>`;
                }
            }
        } else {
            tooltipContent = `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${displayName}</div>
         <div style="font-size: 13px; color: #ff9800;">No equipment data available</div>`;
        }

        // Use responsive tooltip helper to avoid cutoff
        bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;
                targetLayer.setStyle({
                    weight: 3,
                    fillOpacity: 0.9,
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
    }, [geoData]);

    // Show loading state
    if (loading) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    Loading equipment type data...
                </Typography>
            </Paper>
        );
    }

    // Show error state
    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

    // Show no data message
    if (!geoData) {
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
                    ref={(m) => {
                        mapRef.current = m;
                        if (m && mapBounds) {
                            m.fitBounds(mapBounds, { padding: [20, 20] });
                        }
                    }}
                    bounds={mapBounds || undefined}
                    style={{ height: "100%", width: "100%", borderRadius: "4px" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                        ref={geoRef as any}
                        data={geoData}
                        style={getFeatureStyle}
                        onEachFeature={onEachFeature}
                    />
                </MapContainer>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                <strong>Note:</strong> Mixed equipment types are shown when multiple equipment categories are used
                within a geographic region.
            </Typography>
        </Paper>
    );
};

export default VotingEquipmentTypeChoropleth;
