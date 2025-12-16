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
    const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

    const mapRef = useRef<L.Map | null>(null);
    const geoRef = useRef<L.GeoJSON | null>(null);
    const hoveredRef = useRef<L.Path | null>(null);
    const boundsFittedRef = useRef<boolean>(false);

    const clearHover = () => {
        if (hoveredRef.current) {
            try {
                geoRef.current?.resetStyle(hoveredRef.current as any);
                if ((hoveredRef.current as any).closeTooltip) {
                    (hoveredRef.current as any).closeTooltip();
                }
            } catch {
            }
            hoveredRef.current = null;
        }
    };

    useEffect(() => {
        const loadMapData = async () => {
            if (!stateName) return;

            setLoading(true);
            setError(null);
            boundsFittedRef.current = false; // Reset flag when loading new state

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

                const features = countyData.features.filter(
                    (feature: CountyFeature) =>
                        feature.properties.ste_name &&
                        feature.properties.ste_name.includes(stateName)
                );

                if (features.length === 0) {
                    throw new Error(`No county data found for ${stateName}`);
                }

                const featureCollection: FeatureCollection = {
                    type: "FeatureCollection",
                    features: features,
                };

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

    const equipmentLookup = useMemo(() => {
        return createCountyLookupMap(
            data,
            (item) => item.geographicUnit,
            (item) => item
        );
    }, [data]);

    const getFeatureStyle = (feature?: Feature) => {
        if (!feature || !feature.properties) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.9,
            };
        }

        const countyNameArray = feature.properties.coty_name_long ||
            feature.properties.coty_name ||
            [feature.properties.name] ||
            [feature.properties.NAME] ||
            [feature.properties.NAMELSAD] ||
            [""];
        const unitName = Array.isArray(countyNameArray) ? countyNameArray[0] : countyNameArray;

        const normalizedName = normalizeCountyName(unitName);
        const equipmentData = equipmentLookup.get(normalizedName);

        if (!equipmentData) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.9,
            };
        }

        const fillColor =
            EQUIPMENT_COLORS[equipmentData.primaryEquipmentType] || "#cccccc";

        return {
            fillColor,
            weight: 2,
            opacity: 1,
            color: "#ffffff",
            fillOpacity: 1.0,
        };
    };

    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        if (!feature.properties) return;

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

            if (equipmentData.primaryEquipmentType === "MIXED" && equipmentData.equipmentBreakdown) {
                const breakdown = equipmentData.equipmentBreakdown as any;

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

        bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;
                targetLayer.setStyle({
                    weight: 3,
                    fillOpacity: 1.0,
                });
                if ((targetLayer as any).bringToFront) {
                    (targetLayer as any).bringToFront();
                }

                if (!(targetLayer as any).isTooltipOpen()) {
                    (targetLayer as any).openTooltip();
                }
            },
            mouseout: (e) => {
                geoRef.current?.resetStyle(e.target as any);
                if (hoveredRef.current === e.target) hoveredRef.current = null;

                try {
                    (e.target as L.Path).closeTooltip();
                } catch {
                    /* ignore */
                }
            },
        });
    };

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

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

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
        <Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                Voting Equipment Types by Region
            </Typography>

            <Box sx={{ mb: 0.5, display: "flex", gap: 2, flexWrap: "wrap" }}>
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

            <Box sx={{ flex: 1, minHeight: 0, border: "1px solid #ccc", borderRadius: 1 }}>
                <MapContainer
                    key={stateName}
                    ref={(m) => {
                        mapRef.current = m;
                        if (m && mapBounds) {
                            setTimeout(() => {
                                m.fitBounds(mapBounds, { padding: [10, 10] });
                            }, 100);
                        }
                    }}
                    center={[39.8283, -98.5795]}
                    zoom={4}
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

            {/* Note about mixed equipment types 
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                <strong>Note:</strong> Mixed equipment types are shown when multiple equipment categories are used
                within a geographic region.
            </Typography>
            */}
        </Paper>
    );
};

export default VotingEquipmentTypeChoropleth;
