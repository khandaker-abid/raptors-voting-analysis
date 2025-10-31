// Reusable Leaflet choropleth for GUI‑8/9. Expects percentOfTotal 0..100.
import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Chip } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";


interface Props {
    stateName: string;
    // [{ geographicUnit, percentOfTotal }]
    data: { geographicUnit: string; percentOfTotal: number }[];
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


    const lookup = useMemo(() => {
        const m = new Map<string, number>();
        data.forEach(d => m.set(d.geographicUnit.toLowerCase().replace(/\s+county$/, "").trim(), d.percentOfTotal));
        return m;
    }, [data]);


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

    // Calculate min and max percentages from the data
    const { minPercent, maxPercent } = useMemo(() => {
        if (data.length === 0) return { minPercent: 0, maxPercent: 100 };
        const percentages = data.map(d => d.percentOfTotal);
        return {
            minPercent: Math.min(...percentages),
            maxPercent: Math.max(...percentages)
        };
    }, [data]);

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
        const raw = (f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "").toLowerCase();
        const key = raw.replace(/\s+county$/, "").trim();
        const p = lookup.get(key) ?? 0;
        return { fillColor: color(p), weight: 1, color: "#fff", fillOpacity: .75 } as L.PathOptions;
    };

    // Add event handlers to each feature
    const onEachFeature = (feature: Feature, layer: L.Layer) => {
        const f = feature as CountyFeature;
        const displayName = f.properties.coty_name_long?.[0] || f.properties.coty_name?.[0] || "Unknown";
        const raw = displayName.toLowerCase();
        const key = raw.replace(/\s+county$/, "").trim();
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

    const percentages = data.map((d) => d.percentOfTotal);
    const maxPercentage = percentages.length > 0 ? Math.max(...percentages) : 0;
    const minPercentage = percentages.length > 0 ? Math.min(...percentages) : 0;
    const avgPercentage = percentages.length > 0 ? data.reduce((sum, d) => sum + d.percentOfTotal, 0) / data.length : 0;

    // Check if all data is zero (no data reported)
    const allZero = percentages.every(p => p === 0);

    // Check if this is Rhode Island with town-level data that can't be mapped to counties
    const isRhodeIslandTownData = stateName === "Rhode Island" &&
        data.length > 5 &&
        data.some(d => d.geographicUnit.toLowerCase().includes('town') || d.geographicUnit.toLowerCase().includes('city'));

    // Debug logging
    console.log('PercentChoropleth Debug:', {
        stateName,
        dataCount: data.length,
        sampleData: data.slice(0, 3),
        percentages: percentages.slice(0, 5),
        allZero,
        maxPercentage,
        avgPercentage,
        lookupEntries: Array.from(lookup.entries()).slice(0, 5),
        isRhodeIslandTownData
    });

    // Use custom title/description or defaults
    const displayTitle = title || `Pollbook Deletions Distribution - ${stateName}`;
    const displayDescription = description || "Interactive choropleth map showing pollbook deletion distribution across counties. Hover over counties for detailed information.";

    return (
        <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    {displayTitle}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    <Chip label={`Average: ${isNaN(avgPercentage) ? '0.0' : avgPercentage.toFixed(1)}%`} size="small" />
                    <Chip
                        label={`Range: ${isNaN(minPercentage) ? '0.0' : minPercentage.toFixed(1)}% – ${isNaN(maxPercentage) ? '0.0' : maxPercentage.toFixed(1)}%`}
                        size="small"
                    />
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
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" sx={{ minWidth: 45, fontSize: "0.75rem" }}>
                        {isNaN(minPercentage) ? '0.0' : minPercentage.toFixed(1)}%
                    </Typography>
                    <Box
                        display="flex"
                        height={24}
                        flex={1}
                        border="1px solid #e0e0e0"
                        borderRadius={1}
                        overflow="hidden"
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
                    <Typography variant="caption" sx={{ minWidth: 45, textAlign: "right", fontSize: "0.75rem" }}>
                        {isNaN(maxPercentage) ? '0.0' : maxPercentage.toFixed(1)}%
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5} fontSize="0.7rem">
                    {displayDescription}
                </Typography>
            </Box>
        </Paper>
    );
};


export default PercentChoropleth;