import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Alert, Button } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { StateVoterRegistrationData } from "../data/stateVoterRegistrationData";
import { fetchStateRegisteredVoters } from "../data/api";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";

interface VoterRegistrationChloroplethMapProps {
	stateName: string;
	data: Array<{
		county: string;
		E1a: number;
		lat?: number;
		lng?: number;
	}>;
	resetHoverKey?: number;
	onCountyClick?: (countyName: string) => void;
	blockBubbles?: any;
	showBubbles?: boolean;
	setShowBubbles?: (show: boolean) => void;
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

const canonicalizeCountyName = (raw?: string | null): string => {
	if (!raw) return "";

	const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

	let cleaned = normalizeWhitespace(
		raw
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/&/g, " and ")
			.replace(/["'’`]/g, "")
			.replace(/\./g, " ")
	);

	cleaned = cleaned
		.replace(/\bsaint\b/g, "st")
		.replace(/\bft\b/g, "fort");

	const suffixes = [
		"county",
		"parish",
		"borough",
		"census area",
		"municipality",
		"municipio",
		"district",
		"city",
	];
	for (const suffix of suffixes) {
		if (cleaned.endsWith(` ${suffix}`)) {
			cleaned = cleaned.slice(0, -(suffix.length + 1));
			cleaned = normalizeWhitespace(cleaned);
			break;
		}
	}

	return cleaned.replace(/[^a-z0-9]/g, "");
};

const VoterRegistrationChloroplethMap: React.FC<
	VoterRegistrationChloroplethMapProps
> = ({
	stateName,
	resetHoverKey,
	onCountyClick,
	blockBubbles,
	showBubbles,
	setShowBubbles,
}) => {
	const [data, setData] = useState<StateVoterRegistrationData[]>([]);
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	const mapRef = useRef<L.Map | null>(null);
	const geoRef = useRef<L.GeoJSON | null>(null);
	const hoveredRef = useRef<L.Path | null>(null);

	const clearHover = () => {
		if (hoveredRef.current) {
			try {
				geoRef.current?.resetStyle(hoveredRef.current as any);
			} catch {
			}
			hoveredRef.current = null;
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await fetchStateRegisteredVoters(stateName);
				setData(Array.isArray(result) ? result : []);
			} catch (error) {
				console.error(`Error fetching voter registration data for ${stateName}:`, error);
			}
		};
		fetchData();
	}, [stateName]);

	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const values = data.map((d) => d.registeredVoterCount);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);

		const range = [
			"#e8e8e8",
			"#d0d0d0",
			"#b8b8b8",
			"#a0a0a0",
			"#888888",
			"#707070",
			"#585858",
		];

		return (value: number) => {
			if (value === 0) return "#f5f5f5";
			if (maxValue === minValue) return range[range.length - 1];
			const ratio = (value - minValue) / (maxValue - minValue || 1);
			const index = Math.floor(ratio * (range.length - 1));
			return range[Math.min(index, range.length - 1)];
		};
	}, [data]);

	const dataLookup = useMemo(() => {
		const lookup = new Map<string, number>();

		data.forEach((item) => {
			const candidateKeys = new Set<string>();
			candidateKeys.add(canonicalizeCountyName(item.regionName));
			candidateKeys.add(canonicalizeCountyName(`${item.regionName} county`));
			candidateKeys.add(canonicalizeCountyName(`${item.regionName} parish`));

			candidateKeys.forEach((key) => {
				if (key) {
					lookup.set(key, item.registeredVoterCount);
				}
			});
		});

		return lookup;
	}, [data]);

	const resolveVoterCount = (names: Array<string | null | undefined>) => {
		for (const name of names) {
			const key = canonicalizeCountyName(name);
			if (!key) continue;
			const found = dataLookup.get(key);
			if (found !== undefined) {
				return found;
			}
		}
		return 0;
	};

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
							bounds.extend([coord[1], coord[0]]); // [lat, lng]
						});
					} else if (feature.geometry.type === "MultiPolygon") {
						feature.geometry.coordinates.forEach((polygon) => {
							polygon[0].forEach((coord) => {
								bounds.extend([coord[1], coord[0]]);
							});
						});
					}
				});

				const paddedBounds = bounds.pad(0.1);
				setMapBounds(paddedBounds);

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading choropleth map data:", err);
				setError(err instanceof Error ? err.message : "Failed to load map data");
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName]);

	const getFeatureStyle = (feature?: Feature) => {
		if (!feature || !colorScale) {
			return {
				fillColor: "#f5f5f5",
				weight: 1,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.9,
			};
		}

		const countyFeature = feature as CountyFeature;
		const voterCount = resolveVoterCount([
			countyFeature.properties.coty_name_long?.[0],
			countyFeature.properties.coty_name?.[0],
			countyFeature.properties.coty_name?.[0]
				? `${countyFeature.properties.coty_name?.[0]} County`
				: undefined,
			countyFeature.properties.coty_name?.[0]
				? `${countyFeature.properties.coty_name?.[0]} Parish`
				: undefined,
		]);

		const fillColor = colorScale(voterCount);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#ffffff",
			dashArray: "",
			fillOpacity: 1.0,
		};
	};

	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const displayCountyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const voterCount = resolveVoterCount([
			displayCountyName,
			countyFeature.properties.coty_name_long?.[0],
			countyFeature.properties.coty_name?.[0],
			countyFeature.properties.coty_name?.[0]
				? `${countyFeature.properties.coty_name?.[0]} County`
				: undefined,
			countyFeature.properties.coty_name?.[0]
				? `${countyFeature.properties.coty_name?.[0]} Parish`
				: undefined,
		]);

		const tooltipContent = `
      <div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${displayCountyName}</div>
      <div style="font-size: 13px;">Registered Voters: <strong>${voterCount.toLocaleString()}</strong></div>
      ${voterCount === 0
				? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">⚠️ No data available</div>'
				: ""
			}
    `;

		bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

		layer.on({
			mouseover: (e: any) => {
				const targetLayer = e.target as L.Path;
				hoveredRef.current = targetLayer;
				targetLayer.setStyle({
					weight: 3,
					color: "#333333",
					dashArray: "",
					fillOpacity: 1.0,
				});
				if ((targetLayer as any).bringToFront) {
					(targetLayer as any).bringToFront();
				}
				if (!targetLayer.isTooltipOpen()) {
					targetLayer.openTooltip();
				}
			},
			mouseout: (e: any) => {
				geoRef.current?.resetStyle(e.target as any);
				if (hoveredRef.current === e.target) hoveredRef.current = null;
				try {
					(e.target as L.Path).closeTooltip();
				} catch {
				}
			},
			click: () => {
				clearHover();
				if (onCountyClick) {
					// Strip "County", "Parish", etc. suffixes to match MongoDB field format
					const cleanCountyName = displayCountyName
						.replace(/\s+(County|Parish|Borough|Census Area|Municipality|Municipio)$/i, '')
						.trim();
					onCountyClick(cleanCountyName);
				}
			},
		});
	};

	useEffect(() => {
		const node = mapRef.current?.getContainer();
		if (!node) return;
		const handler = () => clearHover();
		node.addEventListener("mouseleave", handler);
		return () => node.removeEventListener("mouseleave", handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [geoData]); // Re-run when geoData changes (map is re-rendered)

	useEffect(() => {
		clearHover();
	}, [resetHoverKey]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No voter registration choropleth data available for this state.
				</Typography>
			</Paper>
		);
	}

	if (loading) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography>Loading choropleth map data...</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="error">{error}</Alert>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="info">No map data available</Alert>
			</Paper>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.registeredVoterCount));
	const minValue = Math.min(...data.map((d) => d.registeredVoterCount));

	return (
		<Paper sx={{ p: 0.5, px: 2, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={0.5} display="flex" alignItems="center" gap={1}>
				<Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem", mb: 0 }}>
					Registered Voters Distribution
				</Typography>
				{blockBubbles && setShowBubbles && typeof showBubbles !== 'undefined' && (
					<Button
						variant="outlined"
						size="small"
						sx={{
							ml: 1,
							px: 1.2,
							py: 0.2,
							minWidth: 0,
							fontSize: '0.70rem',
							height: 24,
							lineHeight: 1,
							fontWeight: 600,
						}}
						onClick={() => setShowBubbles(!showBubbles)}
					>
						{showBubbles ? "Hide" : "Show"} Party Bubble Overlay
					</Button>
				)}
			</Box>

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
					bounds={mapBounds || undefined}
					zoom={8}
					zoomSnap={0.1}
					minZoom={6}
					maxZoom={12}
					maxBounds={mapBounds || undefined}
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
						style={getFeatureStyle}
						onEachFeature={onEachFeature}
					/>
				</MapContainer>
			</Box>

			<Box>
				<Typography variant="body2" gutterBottom fontWeight={600} fontSize="0.85rem">
					Color Scale (Total Registered Voters)
				</Typography>
				<Box sx={{ position: "relative", width: "100%" }}>
					<Box display="flex" height={24} border="1px solid #e0e0e0" borderRadius={1} overflow="hidden" mb={0.5}>
						{[
							"#e8e8e8",
							"#d0d0d0",
							"#b8b8b8",
							"#a0a0a0",
							"#888888",
							"#707070",
							"#585858",
						].map((color, index) => (
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
					{/* Tick labels at each color boundary */}
					<Box sx={{ position: "relative", height: "1.5rem" }}>
						{Array.from({ length: 8 }, (_, i) => {
							const ratio = i / 7;
							const value = minValue === maxValue ? minValue : Math.round(minValue + ratio * (maxValue - minValue));
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
									{value.toLocaleString()}
								</Typography>
							);
						})}
					</Box>
				</Box>
				{(stateName === "Rhode Island" || stateName === "Vermont" || stateName === "Connecticut" || stateName === "Massachusetts") && (
					<Typography variant="caption" color="primary.main" display="block" mt={0.5} fontSize="0.7rem" fontStyle="italic">
						Note: {stateName} reports data at the town level. Values shown have been aggregated to county level for map display consistency.
					</Typography>
				)}
			</Box>
		</Paper>
	);
};

export default VoterRegistrationChloroplethMap;
