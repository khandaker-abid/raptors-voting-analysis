import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Paper, Typography, Button } from "@mui/material";
import L from "leaflet";
import type { Feature } from "geojson";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";

interface StateEquipmentAge {
    state: string;
    averageAge: number;
}

interface Props {
    data: StateEquipmentAge[];
    geoJsonData?: any;
    onClose?: () => void;
}
// Dynamic bins and color scale
const COLOR_SCALE = [
    "#f5f5f5", "#e0e0e0", "#bdbdbd", "#9e9e9e",
    "#757575", "#616161", "#424242", "#212121"
];

function getDynamicBins(min: number, max: number, n: number) {
    const bins = [];
    const step = (max - min) / n;
    for (let i = 0; i < n; i++) {
        const binMin = min + i * step;
        const binMax = i === n - 1 ? max : min + (i + 1) * step;
        bins.push({
            min: binMin,
            max: binMax,
            color: COLOR_SCALE[i],
            label: `${binMin.toFixed(1)} - ${binMax.toFixed(1)} yrs`
        });
    }
    return bins;
}

const EquipmentAgeChoropleth: React.FC<Props> = ({
    data,
    geoJsonData,
    onClose,
}) => {
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
            }
            hoveredRef.current = null;
        }
    };

    // Compute min/max and bins
    const ages = data.map((d) => d.averageAge).filter((a) => typeof a === "number" && !isNaN(a));
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const BINS = getDynamicBins(minAge, maxAge, 8);

    const ageLookup = useMemo(() => {
        const lookup = new Map<string, number>();
        data.forEach((item) => {
            lookup.set(item.state.toLowerCase(), item.averageAge);
        });
        return lookup;
    }, [data]);

    const getColorForAge = (age: number): string => {
        for (const bin of BINS) {
            if (age <= bin.max) return bin.color;
        }
        return BINS[BINS.length - 1].color;
    };


    const abbrToName: Record<string, string> = {
        AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
        CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
        HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
        KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
        MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
        MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
        NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
        OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
        SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
        VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
        DC: "District of Columbia",
    };

    const resolveStateName = (properties: any): string => {
        const rawName = properties?.name || properties?.NAME || properties?.STATE_NAME || properties?.state_name;
        if (typeof rawName === "string" && rawName.trim().length > 0) {
            return rawName.trim();
        }
        const abbr = properties?.STUSPS || properties?.stusps || properties?.STATE_ABBR || properties?.abbr;
        if (typeof abbr === "string" && abbrToName[abbr.toUpperCase()]) {
            return abbrToName[abbr.toUpperCase()];
        }
        return "";
    };

    const getFeatureStyle = useCallback((feature?: Feature) => {
        if (!feature || !feature.properties) {
            return {
                fillColor: "#cccccc",
                weight: 1,
                opacity: 1,
                color: "#666666",
                fillOpacity: 0.5,
            };
        }

        const stateName = resolveStateName(feature.properties).toLowerCase();
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
    }, [ageLookup, getColorForAge, resolveStateName]);

    const onEachFeature = (feature: Feature, layer: L.Layer) => {

        if (!feature.properties) return;

        const resolved = resolveStateName(feature.properties);
        const stateName = (resolved || "Unknown").toLowerCase();
        const age = ageLookup.get(stateName);

        let binLabel = "No data";
        let binColor = "#cccccc";
        if (age !== undefined) {
            for (const bin of BINS) {
                if (age <= bin.max) {
                    binLabel = bin.label;
                    binColor = bin.color;
                    break;
                }
            }
        }

        const tooltipContent =
            age !== undefined
                ? `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${resolved || feature.properties.name || feature.properties.NAME}</div>
                   <div style="font-size: 13px;">Average Equipment Age: <strong>${age.toFixed(1)} years</strong></div>
                   <div style="font-size: 13px; display: flex; align-items: center; gap: 6px;">Category: <span style="display:inline-block;width:14px;height:14px;background:${binColor};border:1px solid #666;margin-right:4px;"></span><strong>${binLabel}</strong></div>`
                : `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${resolved || feature.properties.name || feature.properties.NAME}</div>
                   <div style="font-size: 13px; color: #ff9800;">No equipment age data available</div>`;

        bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;
                // Get the correct fillColor for this feature
                let featureAge = undefined;
                const feature = (targetLayer as any).feature;
                if (feature && feature.properties) {
                    const resolved = resolveStateName(feature.properties);
                    const stateName = (resolved || "Unknown").toLowerCase();
                    featureAge = ageLookup.get(stateName);
                }
                let fillColor = "#cccccc";
                if (typeof featureAge === "number") {
                    for (const bin of BINS) {
                        if (featureAge <= bin.max) {
                            fillColor = bin.color;
                            break;
                        }
                    }
                }
                targetLayer.setStyle({
                    weight: 3,
                    color: '#1976d2',
                    fillOpacity: 1.0,
                    fillColor,
                });
                if ((targetLayer as any).bringToFront) {
                    (targetLayer as any).bringToFront();
                }

                if (!(targetLayer as any).isTooltipOpen()) {
                    (targetLayer as any).openTooltip();
                }
            },
            mouseout: (e) => {
                const targetLayer = e.target as L.Path;
                // Restore the correct fillColor for this feature
                let featureAge = undefined;
                const feature = (targetLayer as any).feature;
                if (feature && feature.properties) {
                    const resolved = resolveStateName(feature.properties);
                    const stateName = (resolved || "Unknown").toLowerCase();
                    featureAge = ageLookup.get(stateName);
                }
                let fillColor = "#cccccc";
                if (typeof featureAge === "number") {
                    for (const bin of BINS) {
                        if (featureAge <= bin.max) {
                            fillColor = bin.color;
                            break;
                        }
                    }
                }
                targetLayer.setStyle({
                    weight: 2,
                    color: '#ffffff',
                    fillOpacity: 0.8,
                    fillColor,
                });
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
            {onClose && (
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 180,
                        zIndex: 1000,
                    }}
                >
                    Back to State Map
                </Button>
            )}

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
                    {BINS.map((bin, index) => (
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
