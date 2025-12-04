// Reusable Leaflet choropleth for GUI‑8/9. Expects percentOfTotal 0..100.
import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Chip } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";
import { createCountyLookupMap, normalizeCountyName } from "../utils/countyNameNormalizer";


interface Props {
    stateName: string;
    // Accept either simplified format or full row data (PollbookDeletionRow or MailRejectionRow)
    data: Array<{ geographicUnit: string; percentOfTotal: number }>
        | Array<{ geographicUnit: string; deletionPercentage?: number; rejectionPercentage?: number; [key: string]: any }>;
    title?: string;
    description?: string;
}


type CountyFeature = Feature<Geometry, { ste_name: string[]; coty_name: string[]; coty_name_long: string[]; }>


type CountyGeoJSONData = FeatureCollection<Geometry, { ste_name: string[]; coty_name: string[]; coty_name_long: string[]; }>


const PercentChoropleth: React.FC<Props> = ({ stateName, data, title, description }) => {
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


    // Calculate percentages early so we can use them in the lookup
    const calculatedPercentages = useMemo(() => {
        const percentages = data.map((d) => {
            if ('percentOfTotal' in d && d.percentOfTotal !== undefined) return d.percentOfTotal;
            if ('deletionPercentage' in d && d.deletionPercentage !== undefined) return d.deletionPercentage;
            if ('rejectionPercentage' in d && d.rejectionPercentage !== undefined) {
                const hasTotal = 'total' in d && typeof d.total === 'number';
                if (d.rejectionPercentage === 0 && hasTotal) {
                    return -1; // marker for recalculation
                }
                return d.rejectionPercentage;
            }
            return 0;
        });
        
        // Recalculate if all are 0 but totals exist
        const needsRecalc = percentages.every(p => p === 0 || p === -1) && 
                            data.every(d => 'total' in d);
        
        if (needsRecalc) {
            const stateTotal = data.reduce((sum, d) => {
                const total = 'total' in d && typeof d.total === 'number' ? d.total : 0;
                return sum + total;
            }, 0);
            
            if (stateTotal > 0) {
                return data.map(d => {
                    const total = 'total' in d && typeof d.total === 'number' ? d.total : 0;
                    return Math.round((total / stateTotal) * 1000) / 10;
                });
            }
        }
        
        return percentages;
    }, [data]);

    // Uses centralized normalization to handle apostrophes, periods, etc.
    // Create enriched data with calculated percentages for lookup
    const lookup = useMemo(() => {
        const enrichedData = data.map((item, index) => ({
            ...item,
            _calculatedPercentage: calculatedPercentages[index]
        }));
        
        return createCountyLookupMap<any, number>(
            enrichedData,
            (item) => item.geographicUnit,
            (item) => item._calculatedPercentage
        );
    }, [data, calculatedPercentages]);


    // Gray color palette for visual consistency
    const COLOR_PALETTE = useMemo(() => {
        return [
            "#e8e8e8", // Very light gray
            "#d0d0d0", // Light gray
            "#b8b8b8", // Medium-light gray
            "#a0a0a0", // Medium gray
            "#888888", // Medium-dark gray
            "#707070", // Dark gray
            "#585858", // Very dark gray
        ];
    }, []);

    // Calculate min and max from calculatedPercentages (not original data)
    const { minPercent, maxPercent } = useMemo(() => {
        if (calculatedPercentages.length === 0) return { minPercent: 0, maxPercent: 100 };
        return {
            minPercent: Math.min(...calculatedPercentages),
            maxPercent: Math.max(...calculatedPercentages)
        };
    }, [calculatedPercentages]);

    // Color function that maps actual data range to color palette
    const color = (p: number) => {
        const stops = COLOR_PALETTE;

        // Handle edge cases
        if (p === 0 || maxPercent === minPercent) {
            return stops[0]; // Lightest gray for no data or uniform data
        }

        // Map the percentage to the color palette based on actual data range
        const normalized = (p - minPercent) / (maxPercent - minPercent);
        const idx = Math.max(0, Math.min(stops.length - 1, Math.floor(normalized * stops.length)));
        return stops[idx];
    };


    const styleFor = (feature?: Feature) => {
        if (!feature) return { weight: 1, color: "#fff", fillOpacity: .7 } as L.PathOptions;
        const f = feature as CountyFeature;
        const raw = f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "";

        // Use centralized normalization for consistent matching
        const key = normalizeCountyName(raw);
        const p = lookup.get(key) ?? 0;
        return { fillColor: color(p), weight: 1, color: "#fff", fillOpacity: .75 } as L.PathOptions;
    };

    // Add event handlers to each feature
    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        const f = feature as CountyFeature;
        const displayName = f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "Unknown";

        // Use centralized normalization for consistent matching
        const key = normalizeCountyName(displayName);
        const hasData = lookup.has(key);
        const p = lookup.get(key) ?? 0;

        const tooltipContent = `
            <div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${displayName}</div>
            <div style="font-size: 13px;">Percentage: <strong>${p.toFixed(1)}%</strong></div>
            ${!hasData ? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">No data available</div>' : ''}
        `;

        // Bind tooltip directly - no need to check mapRef.current
        bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

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
        });
    };


    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/georef-united-states-of-america-county.geojson");
                const counties = (await res.json()) as CountyGeoJSONData;
                const feats = counties.features.filter(f => f.properties.ste_name?.includes(stateName));

                if (feats.length === 0) {
                    console.warn(`No geographic features found for state: ${stateName}`);
                    setGeoData({ type: "FeatureCollection", features: [] });
                    return;
                }

                const fb = new L.LatLngBounds([]);
                feats.forEach((feature) => {
                    if (feature.geometry.type === "Polygon") {
                        (feature.geometry.coordinates[0] as any[]).forEach(([x, y]) => fb.extend([y, x]));
                    } else if (feature.geometry.type === "MultiPolygon") {
                        (feature.geometry.coordinates as any[]).forEach(poly => poly[0].forEach(([x, y]: any[]) => fb.extend([y, x])));
                    }
                });

                if (!fb.isValid()) {
                    console.error(`Invalid bounds for state: ${stateName}`);
                    return;
                }

                // Increase padding to 0.25 (25%) to give more space for tooltips at edges
                setBounds(fb.pad(0.25));
                setGeoData({ type: "FeatureCollection", features: feats });
            } catch (error) {
                console.error(`Error loading GeoJSON for ${stateName}:`, error);
            }
        })();
    }, [stateName]);
    
    // Force GeoJSON to re-render when data changes by adding a key based on data length
    const geoJsonKey = useMemo(() => `geojson-${stateName}-${data.length}`, [stateName, data.length]);

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
    if (!geoData || !bounds) {
        return (
            <Paper sx={{ p: 3, textAlign: "center", height: "100%" }}>
                <Typography variant="body1" color="text.secondary">
                    {!geoData ? "Loading map data..." : "No geographic boundaries available for this state"}
                </Typography>
            </Paper>
        );
    }

    const maxPercentage = calculatedPercentages.length > 0 ? Math.max(...calculatedPercentages) : 0;
    const minPercentage = calculatedPercentages.length > 0 ? Math.min(...calculatedPercentages) : 0;
    const avgPercentage = calculatedPercentages.length > 0 ? calculatedPercentages.reduce((sum, p) => sum + p, 0) / calculatedPercentages.length : 0;

    // Check if all data is zero (no data reported) - but only if we have data
    const allZero = calculatedPercentages.length > 0 && calculatedPercentages.every(p => p === 0);

    // Note: Rhode Island data is now aggregated to county level by the backend,
    // so we no longer need to show the town-level warning
    const isRhodeIslandTownData = false;

    // Detect data type and set appropriate title
    const dataType = data.length > 0 
        ? ('deletionPercentage' in data[0] ? 'pollbook' : 'rejection')
        : 'pollbook';
    
    // Use custom title/description or defaults (without state name suffix - user already knows the state)
    const displayTitle = title || (dataType === 'pollbook' 
        ? `Pollbook Deletions Distribution`
        : `Mail Rejections Distribution`);

    return (
        <Paper sx={{ pb: 0.5, px: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                    {displayTitle}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    {allZero && (
                        <Chip
                            label="⚠️ No data reported for 2024"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                    {isRhodeIslandTownData && (
                        <Chip
                            label="ℹ️ Data reported at town level (39 towns) - county map shows 5 counties only"
                            size="small"
                            color="info"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </Box>
            </Box>

            {/* Map Container */}
            <Box
                sx={{
                    flex: 1,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                    minHeight: 0,
                    mb: 1,
                }}
            >
                <MapContainer
                    ref={(m) => { mapRef.current = m; }}
                    bounds={bounds}
                    zoom={8}
                    zoomSnap={0.1}
                    minZoom={6}
                    maxZoom={12}
                    maxBounds={bounds}
                    maxBoundsViscosity={1.0}
                    style={{ height: "100%", width: "100%", borderRadius: "8px" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                        key={geoJsonKey}
                        ref={geoRef as any}
                        data={geoData}
                        style={styleFor}
                        onEachFeature={onEachFeature}
                    />
                </MapContainer>
            </Box>

            {/* Color Legend */}
            <Box>
                <Typography variant="body2" gutterBottom fontWeight={600} fontSize="0.85rem">
                    Color Scale (Percentage)
                </Typography>
                <Box>
                    {/* Color bar */}
                    <Box
                        display="flex"
                        height={24}
                        border="1px solid #e0e0e0"
                        borderRadius={1}
                        overflow="hidden"
                        mb={0.5}
                    >
                        {COLOR_PALETTE.map((color, index) => (
                            <Box
                                key={index}
                                sx={{
                                    flex: 1,
                                    backgroundColor: color,
                                    height: "100%",
                                }}
                            />
                        ))}
                    </Box>

                    {/* Boundary values at dividing lines between segments */}
                    <Box sx={{ position: "relative", height: "1.5rem" }}>
                        {Array.from({ length: COLOR_PALETTE.length + 1 }, (_, i) => {
                            const ratio = i / COLOR_PALETTE.length;
                            const minVal = isNaN(minPercentage) ? 0 : minPercentage;
                            const maxVal = isNaN(maxPercentage) ? 0 : maxPercentage;
                            const value = minVal === maxVal ? minVal : minVal + ratio * (maxVal - minVal);
                            const percentPosition = ratio * 100;
                            return (
                                <Typography
                                    key={i}
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        left: `${percentPosition}%`,
                                        transform: "translateX(-50%)",
                                        fontSize: "0.7rem",
                                        color: "text.secondary",
                                        fontWeight: 500,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {value.toFixed(1)}%
                                </Typography>
                            );
                        })}
                    </Box>
                </Box>
                {/* Note for states that use town-level data */}
                {(stateName === "Rhode Island" || stateName === "Vermont" || stateName === "Connecticut" || stateName === "Massachusetts") && (
                    <Typography variant="caption" color="primary.main" display="block" mt={0.5} fontSize="0.7rem" fontStyle="italic">
                        Note: {stateName} reports data at the town level. Values shown have been aggregated to county level for map display consistency.
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};


export default PercentChoropleth;