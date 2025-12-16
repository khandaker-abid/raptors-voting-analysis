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
    DRE_WITH_VVPAT: "#f78888ff", // Medium gray - improved DRE
    BALLOT_MARKING: "#b6f47cff", // Light gray - modern
    SCANNER: "#fff676ff", // Gray - reliable
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
                // ignore reset/tooltip errors from Leaflet during rapid hover changes
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
                console.log('[EquipChoropleth] loaded geo features', featureCollection.features.length, 'for state', stateName);
                setMapBounds(bounds.isValid() ? bounds : null);
                setLoading(false);
            } catch (err: any) {
                console.log("Error loading map data:", err);
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

    useEffect(() => {
        console.log('[EquipChoropleth] equipment data items', data ? data.length : 0, 'lookup size', equipmentLookup.size);

        // Cross-check geoData against equipment lookup when both are available
        if (geoData && equipmentLookup) {
            try {
                const mixedCountList: string[] = [];
                geoData.features.forEach((f: any) => {
                    const countyNameArray = f.properties?.coty_name_long || f.properties?.coty_name || [f.properties?.name] || [''];
                    const unitName = Array.isArray(countyNameArray) ? countyNameArray[0] : countyNameArray;
                    const normalized = normalizeCountyName(unitName);
                    const eq = equipmentLookup.get(normalized);
                    if (eq && eq.primaryEquipmentType === 'MIXED') mixedCountList.push(normalized);
                });

                // Note: visible debug badge has been removed for production use

                // FORCE-APPLY patterns to any MIXED counties to verify rendering (temporary)
                setTimeout(() => {
                    try {
                        const mapLayers: any = geoRef.current;
                        if (!mapLayers || !(mapLayers as any).getLayers) return;

                        (mapLayers as any).getLayers().forEach((layer: any) => {
                            try {
                                const feat = layer.feature;
                                if (!feat || !feat.properties) return;
                                const countyNameArray = feat.properties?.coty_name_long || feat.properties?.coty_name || [feat.properties?.name] || [''];
                                const unitName = Array.isArray(countyNameArray) ? countyNameArray[0] : countyNameArray;
                                const normalized = normalizeCountyName(unitName);
                                const eq = equipmentLookup.get(normalized);
                                if (eq && eq.primaryEquipmentType === 'MIXED' && eq.equipmentBreakdown) {
                                    const breakdown: any = eq.equipmentBreakdown;
                                    const counts = breakdown.equipmentTypeCounts || {};
                                    let types = Object.entries(counts)
                                        .filter(([, v]) => (v as number) > 0)
                                        .map(([k, v]) => ({ type: k, count: v as number }));

                                    // if no counts, try inference
                                    if (types.length === 0) {
                                        const marking = (breakdown.markingMethod || '').toUpperCase();
                                        const tabulation = (breakdown.tabulationMethod || '').toUpperCase();
                                        const inferred: any = [];
                                        if (marking.includes('BALLOT MARKING') || marking.includes('BMD')) inferred.push({ type: 'BALLOT_MARKING', count: 1 });
                                        if (tabulation.includes('SCAN') || tabulation.includes('SCANN')) inferred.push({ type: 'SCANNER', count: 1 });
                                        types = inferred;
                                    }

                                    if (types.length > 0) {
                                        types = types.sort((a, b) => b.count - a.count);
                                        const orderedTypes = types.map((t: any) => t.type);
                                        const patternId = 'equip-pattern-' + orderedTypes.join('-');
                                        const colors = orderedTypes.map((t: any) => (EQUIPMENT_COLORS[t] || '#cccccc'));

                                        console.log('[EquipChoropleth] FORCE-APPLY pattern', patternId, 'for', unitName);
                                        const pathEl: SVGElement | null = (layer as any).getElement && (layer as any).getElement ? (layer as any).getElement() : (layer as any)._path || null;
                                        createStripedPattern(patternId, colors, pathEl ?? undefined);
                                        if (pathEl) {
                                            try {
                                                pathEl.setAttribute('fill', `url(#${patternId})`);
                                                pathEl.setAttribute('fill-opacity', '1');
                                                pathEl.setAttribute('stroke', '#ffffff');
                                                console.log('[EquipChoropleth] FORCE applied pattern to', unitName);
                                            } catch (err) {
                                                console.log('[EquipChoropleth] FORCE pattern setAttribute failed for', unitName, err);
                                            }
                                        } else {
                                            try {
                                                if (layer.setStyle) {
                                                    layer.setStyle({ fill: `url(#${patternId})`, fillOpacity: 1 } as any);
                                                }
                                                console.log('[EquipChoropleth] FORCE setStyle applied for', unitName);
                                            } catch (err) {
                                                console.log('[EquipChoropleth] FORCE setStyle failed for', unitName, err);
                                            }
                                        }
                                    }
                                }
                            } catch {
                                /* ignore per-layer errors */
                            }
                        });
                        // summary pass: count mixed layers and those with applied pattern fills
                        try {
                            let totalMixed = 0;
                            let withAttr = 0;
                            let withStyle = 0;
                            (mapLayers as any).getLayers().forEach((layer: any) => {
                                try {
                                    const feat = layer.feature; if (!feat || !feat.properties) return;
                                    const unitName = Array.isArray(feat.properties?.coty_name_long || feat.properties?.coty_name || [feat.properties?.name]) ? (feat.properties?.coty_name_long || feat.properties?.coty_name || [feat.properties?.name])[0] : feat.properties?.name;
                                    const normalized = normalizeCountyName(unitName);
                                    const eq = equipmentLookup.get(normalized);
                                    if (eq && eq.primaryEquipmentType === 'MIXED') {
                                        totalMixed += 1;
                                        const p = (layer as any)._path;
                                        if (p && p.getAttribute && (p.getAttribute('fill') || '').startsWith('url(#')) withAttr += 1;
                                        if ((layer as any).options && ((layer as any).options.fill || '').startsWith('url(#')) withStyle += 1;
                                    }
                                } catch {
                                    // ignore per-layer errors
                                }
                            });
                            console.log('[EquipChoropleth] FORCE-APPLY summary: mixed total=', totalMixed, 'withAttr=', withAttr, 'withStyle=', withStyle);
                        } catch (err) {
                            console.log('[EquipChoropleth] FORCE-APPLY summary failed', err);
                        }
                    } catch (err) {
                        console.log('[EquipChoropleth] FORCE-APPLY loop failed', err);
                    }
                }, 300);
            } catch (err) {
                console.log('[EquipChoropleth] cross-check debug failed', err);
            }
        }

        return () => {
            // no-op cleanup
        };
    }, [geoData, equipmentLookup]);

    // Ensure an SVG <defs> block exists to hold our patterns (uses the layer's owner SVG when available)
    const ensureSvgDefs = (pathEl?: SVGElement) => {
        try {
            let svgRoot: SVGElement | null = null;
            if (pathEl && (pathEl as any).ownerSVGElement) {
                svgRoot = (pathEl as any).ownerSVGElement as SVGElement;
            } else {
                svgRoot = document.querySelector('.leaflet-overlay-pane svg');
            }
            if (!svgRoot) return null;

            let defs = svgRoot.querySelector('defs#equipment-pattern-defs') as SVGDefsElement | null;
            if (!defs) {
                console.log('[EquipChoropleth] ensureSvgDefs: creating defs element');
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs') as SVGDefsElement;
                defs.setAttribute('id', 'equipment-pattern-defs');
                svgRoot.insertBefore(defs, svgRoot.firstChild);
            }
            return defs;
        } catch (err) {
            console.log('[EquipChoropleth] Could not ensure SVG defs for patterns', err);
            return null;
        }
    };

    function createStripedPattern(patternId: string, colors: string[], pathEl?: SVGElement) {
        // Attempt to create the pattern, retrying a few times if the svg defs are not yet present
        const attemptCreate = (attempt = 0) => {
            try {
                const defs = ensureSvgDefs(pathEl);
                if (!defs) {
                    if (attempt < 5) {
                        // wait and retry
                        setTimeout(() => attemptCreate(attempt + 1), 60 * (attempt + 1));
                        return;
                    }
                    console.log('[EquipChoropleth] could not find <defs> to create pattern', patternId);
                    return;
                }

                if (defs.querySelector(`#${patternId}`)) return; // already exists

                console.log('[EquipChoropleth] creating pattern', patternId, colors);

                const stripeWidth = 8;
                const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                pattern.setAttribute('id', patternId);
                pattern.setAttribute('patternUnits', 'userSpaceOnUse');
                pattern.setAttribute('width', String(stripeWidth * colors.length));
                pattern.setAttribute('height', String(stripeWidth));
                // diagonal stripes
                pattern.setAttribute('patternTransform', 'rotate(45)');

                // background for contrast
                const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bg.setAttribute('x', '0');
                bg.setAttribute('y', '0');
                bg.setAttribute('width', String(stripeWidth * colors.length));
                bg.setAttribute('height', String(stripeWidth));
                bg.setAttribute('fill', '#ffffff');
                pattern.appendChild(bg);

                // stripes
                for (let i = 0; i < colors.length; i++) {
                    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    r.setAttribute('x', String(i * stripeWidth));
                    r.setAttribute('y', '0');
                    r.setAttribute('width', String(stripeWidth));
                    r.setAttribute('height', String(stripeWidth));
                    r.setAttribute('fill', colors[i]);
                    pattern.appendChild(r);
                }

                defs.appendChild(pattern);
                console.log('[EquipChoropleth] pattern created', patternId);
            } catch (err) {
                if (attempt < 5) {
                    setTimeout(() => attemptCreate(attempt + 1), 60 * (attempt + 1));
                } else {
                    console.log('[EquipChoropleth] Failed to create pattern after retries', patternId, err);
                }
            }
        };

        attemptCreate();
    }

    // Blend helper: blends hex colors using integer weights and returns hex
    const blendHexColors = (hexColors: string[], weights: number[]) => {
        const toRgb = (hex: string) => {
            const c = hex.replace('#', '');
            const normalized = c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c;
            const bigint = parseInt(normalized, 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
        };
        const total = weights.reduce((s, w) => s + w, 0) || 1;
        const rgbSum = [0, 0, 0];
        for (let i = 0; i < hexColors.length; i++) {
            const rgb = toRgb(hexColors[i] || '#cccccc');
            const w = weights[i] || 0;
            rgbSum[0] += rgb[0] * w;
            rgbSum[1] += rgb[1] * w;
            rgbSum[2] += rgb[2] * w;
        }
        const blended = rgbSum.map((v) => Math.round(v / total));
        return '#' + blended.map((v) => v.toString(16).padStart(2, '0')).join('');
    };

    // Apply style for features. If a pattern fill was previously applied to the layer, prefer that (keeps pattern after resetStyle)
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
            [''];
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

        // If the layer already has a pattern fill stored in options (set when applied), use that so resetStyle preserves it
        const existingFill = (feature as any).properties?.__appliedPatternFill;
        if (existingFill) {
            return {
                fill: existingFill,
                weight: 2,
                opacity: 1,
                color: "#ffffff",
                fillOpacity: 1.0,
            } as any;
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
        console.log('[EquipChoropleth] onEachFeature start', unitName, equipmentData ? equipmentData.primaryEquipmentType : 'NO_DATA');

        // Removed temporary Pulaski debug highlight and test code

        // If MIXED and we have breakdown details, create stripe pattern ordered by prevalence and attach to the path element
        if (equipmentData && equipmentData.primaryEquipmentType === 'MIXED' && equipmentData.equipmentBreakdown) {
            console.log('[EquipChoropleth] MIXED feature details', unitName, equipmentData.equipmentBreakdown);
            const breakdown: any = equipmentData.equipmentBreakdown;
            const counts = breakdown.equipmentTypeCounts || {};

            // Normalize counts if present; otherwise try to infer types from marking/tabulation methods
            let types: { type: string; count: number }[] = [];
            const hasCounts = counts && Object.keys(counts).length > 0;

            if (hasCounts) {
                types = Object.entries(counts)
                    .filter(([, v]) => (v as number) > 0)
                    .map(([k, v]) => ({ type: k, count: v as number }));
            } else {
                // Infer from markingMethod and tabulationMethod
                const inferred: Map<string, number> = new Map();
                const marking = (breakdown.markingMethod || '').toUpperCase();
                const tabulation = (breakdown.tabulationMethod || '').toUpperCase();

                if (marking.includes('BALLOT MARKING') || marking.includes('BMD')) {
                    inferred.set('BALLOT_MARKING', (inferred.get('BALLOT_MARKING') || 0) + 1);
                }
                if (marking.includes('DRE')) {
                    if (marking.includes('VVPAT') || tabulation.includes('VVPAT')) {
                        inferred.set('DRE_WITH_VVPAT', (inferred.get('DRE_WITH_VVPAT') || 0) + 1);
                    } else {
                        inferred.set('DRE_NO_VVPAT', (inferred.get('DRE_NO_VVPAT') || 0) + 1);
                    }
                }
                // Scanning/tabulation devices indicate Scanner presence
                if (tabulation.includes('SCAN') || tabulation.includes('SCANN')) {
                    inferred.set('SCANNER', (inferred.get('SCANNER') || 0) + 1);
                }

                // If nothing inferred, try to fall back: if marking mentions HAND, assume SCANNER if tabulation mentions scanning
                if (inferred.size === 0 && marking.includes('HAND') && (tabulation.includes('SCAN') || tabulation.includes('SCANN'))) {
                    inferred.set('SCANNER', 1);
                }

                if (inferred.size > 0) {
                    types = Array.from(inferred.entries()).map(([type, count]) => ({ type, count }));
                    console.log('[EquipChoropleth] inferred types for', unitName, types);
                }
            }

            if (types.length > 0) {
                types = types.sort((a, b) => b.count - a.count); // most prevalent first
                const orderedTypes = types.map((t: any) => t.type);
                const patternId = 'equip-pattern-' + orderedTypes.join('-');
                const colors = orderedTypes.map((t: any) => (EQUIPMENT_COLORS[t] || '#cccccc'));

                console.log('[EquipChoropleth] MIXED county', unitName, 'types=', types, 'orderedTypes=', orderedTypes, 'pattern=', patternId);

                // Apply provisional blended fill with dashed stroke so mixed counties are immediately noticeable
                const colorsForBlend = orderedTypes.map((t: any) => (EQUIPMENT_COLORS[t] || '#cccccc'));
                const weights = types.map((t: any) => t.count);
                const provisionalBlend = blendHexColors(colorsForBlend, weights);
                try {
                    if ((layer as any).setStyle) {
                        (layer as any).setStyle({
                            fillColor: provisionalBlend,
                            fillOpacity: 1,
                            color: '#ffffff',
                            dashArray: '4,6',
                        } as any);
                    }
                    console.log('[EquipChoropleth] provisional blended fill applied', provisionalBlend, 'to', unitName);
                } catch (err) {
                    console.log('[EquipChoropleth] failed to apply provisional fill to', unitName, err);
                }

                const hasOverlaySvg = !!document.querySelector('.leaflet-overlay-pane svg');
                console.log('[EquipChoropleth] overlay svg present=', hasOverlaySvg);

                const pathEl: SVGElement | null = (layer as any).getElement && (layer as any).getElement ? (layer as any).getElement() : (layer as any)._path || null;
                createStripedPattern(patternId, colors, pathEl ?? undefined);

                // try to apply immediately, or retry a few times if DOM element isn't ready
                const applyPattern = (attempt = 0) => {
                    try {
                        const el = (layer as any).getElement && (layer as any).getElement ? (layer as any).getElement() : (layer as any)._path || null;
                        if (el) {
                            try {
                                el.setAttribute('fill', `url(#${patternId})`);
                                el.setAttribute('fill-opacity', '1');
                                el.setAttribute('stroke', '#ffffff');
                            } catch {
                                // attribute set may fail on non-SVG renderers
                            }

                            // Also set layer.options and feature property so resetStyle keeps the pattern
                            try {
                                (layer as any).options = (layer as any).options || {};
                                (layer as any).options.fill = `url(#${patternId})`;
                                (layer as any).options.fillOpacity = 1;
                                if ((layer as any).feature) (layer as any).feature.properties = (layer as any).feature.properties || {};
                                (layer as any).feature.properties.__appliedPatternFill = `url(#${patternId})`;
                            } catch {
                                /* ignore */
                            }

                            // remove dashed stroke
                            if ((layer as any).setStyle) {
                                (layer as any).setStyle({ dashArray: null } as any);
                            }
                            console.log('[EquipChoropleth] applied pattern', patternId, 'to', unitName);
                            return;
                        }
                    } catch {
                        // ignore and retry
                    }
                    if (attempt < 5) setTimeout(() => applyPattern(attempt + 1), 60 * (attempt + 1));
                    else console.log('[EquipChoropleth] could not apply pattern', patternId, 'to', unitName);
                };
                applyPattern();
            }
        }

        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target as L.Path;
                hoveredRef.current = targetLayer;

                // Compute the intended style for the feature and apply a hover style that preserves fill or pattern
                try {
                    const baseStyle: any = getFeatureStyle((targetLayer as any).feature);
                    // If feature uses a pattern (fill), preserve it; otherwise use fillColor
                    const hoverStyle: any = {
                        weight: 3,
                        fillOpacity: 1.0,
                    };
                    if (baseStyle && (baseStyle as any).fill) hoverStyle.fill = (baseStyle as any).fill;
                    else if (baseStyle && (baseStyle as any).fillColor) hoverStyle.fillColor = (baseStyle as any).fillColor;

                    targetLayer.setStyle(hoverStyle as any);
                } catch {
                    // fallback
                    targetLayer.setStyle({
                        weight: 3,
                        fillOpacity: 1.0,
                    } as any);
                }

                if ((targetLayer as any).bringToFront) {
                    (targetLayer as any).bringToFront();
                }

                if (!(targetLayer as any).isTooltipOpen()) {
                    (targetLayer as any).openTooltip();
                }
            },
            mouseout: (e) => {
                const target = e.target as any;
                // Reset style to base and explicitly re-apply expected fill (pattern or color) to avoid defaulting to black
                try {
                    // Reset to base style
                    geoRef.current?.resetStyle(target);

                    // Compute expected style and re-apply it to ensure fill is explicit
                    try {
                        const expected: any = getFeatureStyle(target.feature);
                        if (expected) {
                            // Determine explicit fill (pattern URL or explicit color) and apply it to prevent fallback to black
                            const styleApply: any = {};
                            const explicitFill = expected.fill || expected.fillColor || '#cccccc';
                            styleApply.fill = explicitFill; // set explicit fill (pattern URL or hex color)
                            styleApply.fillOpacity = expected.fillOpacity ?? 1;
                            styleApply.color = expected.color ?? '#ffffff';
                            styleApply.weight = expected.weight ?? 2;
                            if (target.setStyle) {
                                target.setStyle(styleApply as any);
                            }

                            // Also set DOM fill attribute so the visual is immediate and doesn't rely on CSS defaults
                            if (target._path) {
                                try {
                                    if (target._path.setAttribute) {
                                        target._path.setAttribute('fill', explicitFill);
                                        target._path.setAttribute('fill-opacity', String(styleApply.fillOpacity));
                                    }
                                } catch {
                                    /* ignore */
                                }
                            }
                        }
                    } catch {
                        /* ignore */
                    }
                } catch {
                    geoRef.current?.resetStyle(e.target as any);
                }

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

        // Re-apply patterns after zoom or layer changes (helps when renderer rebuilds SVG)
        const reapplyPatterns = () => {
            try {
                const mapLayers: any = geoRef.current;
                if (!mapLayers || !(mapLayers as any).getLayers) return;
                (mapLayers as any).getLayers().forEach((layer: any) => {
                    try {
                        const feat = layer.feature;
                        if (!feat || !feat.properties) return;
                        const unitName = Array.isArray(feat.properties?.coty_name_long || feat.properties?.coty_name || [feat.properties?.name]) ? (feat.properties?.coty_name_long || feat.properties?.coty_name || [feat.properties?.name])[0] : feat.properties?.name;
                        const normalized = normalizeCountyName(unitName);
                        const eq = equipmentLookup.get(normalized);
                        if (eq && eq.primaryEquipmentType === 'MIXED' && eq.equipmentBreakdown) {
                            // Duplicate logic from apply to ensure pattern exists and applied
                            const breakdown: any = eq.equipmentBreakdown;
                            const counts = breakdown.equipmentTypeCounts || {};
                            let types = Object.entries(counts)
                                .filter(([, v]) => (v as number) > 0)
                                .map(([k, v]) => ({ type: k, count: v as number }));
                            if (types.length === 0) {
                                const marking = (breakdown.markingMethod || '').toUpperCase();
                                const tabulation = (breakdown.tabulationMethod || '').toUpperCase();
                                if (marking.includes('BALLOT MARKING') || marking.includes('BMD')) types.push({ type: 'BALLOT_MARKING', count: 1 });
                                if (tabulation.includes('SCAN') || tabulation.includes('SCANN')) types.push({ type: 'SCANNER', count: 1 });
                            }
                            if (types.length > 0) {
                                types = types.sort((a, b) => b.count - a.count);
                                const orderedTypes = types.map((t: any) => t.type);
                                const patternId = 'equip-pattern-' + orderedTypes.join('-');
                                const colors = orderedTypes.map((t: any) => (EQUIPMENT_COLORS[t] || '#cccccc'));
                                const pathEl: SVGElement | null = (layer as any).getElement && (layer as any).getElement ? (layer as any).getElement() : (layer as any)._path || null;
                                createStripedPattern(patternId, colors, pathEl ?? undefined);
                                try {
                                    if (pathEl) {
                                        pathEl.setAttribute('fill', `url(#${patternId})`);
                                        pathEl.setAttribute('fill-opacity', '1');
                                        // set in options for resetStyle
                                        layer.options = layer.options || {};
                                        layer.options.fill = `url(#${patternId})`;
                                        layer.options.fillOpacity = 1;
                                        if (layer.feature) layer.feature.properties = layer.feature.properties || {};
                                        layer.feature.properties.__appliedPatternFill = `url(#${patternId})`;
                                        console.log('[EquipChoropleth] reapplied pattern', patternId, 'to', unitName);
                                    }
                                } catch {
                                    // ignore per-layer
                                }
                            }
                        }
                    } catch {
                        // ignore per-layer
                    }
                });
            } catch (err) {
                console.log('[EquipChoropleth] reapplyPatterns failed', err);
            }
        };

        map.on('zoomend', reapplyPatterns);
        map.on('layeradd', reapplyPatterns);
        map.on('moveend', reapplyPatterns);
        map.on('viewreset', reapplyPatterns);

        // Ensure we create defs as early as possible when map is initialized
        try {
            map.whenReady(() => {
                try {
                    ensureSvgDefs();
                    console.log('[EquipChoropleth] map.whenReady ensured SVG defs');
                } catch {
                    /* ignore */
                }
            });
        } catch {
            // older map implementations may not have whenReady
        }

        return () => {
            node.removeEventListener("mouseleave", handleLeave);
            map.off('zoomend', reapplyPatterns);
            map.off('layeradd', reapplyPatterns);
            map.off('moveend', reapplyPatterns);
            map.off('viewreset', reapplyPatterns);
        };
    }, [geoData, equipmentLookup]);

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
                        // @ts-expect-error - pass renderer through to underlying Leaflet geoJSON layer (react-leaflet typings don't expose this prop)
                        renderer={L.svg() as any}
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
