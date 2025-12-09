import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Alert, Chip } from "@mui/material";
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
	/** Optional: change value (e.g., flip 0/1) when your dialog closes to force-clear hover */
	resetHoverKey?: number;
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

	// Harmonise common abbreviations so "Saint" and "St" map together, likewise "Ft" -> "Fort".
	cleaned = cleaned
		.replace(/\bsaint\b/g, "st")
		.replace(/\bft\b/g, "fort");

	// Drop standard geographic suffixes so "County", "Parish", etc. do not break matches.
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
> = ({ stateName, resetHoverKey }) => {
	const [data, setData] = useState<StateVoterRegistrationData[]>([]);
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	// Refs to manage hover state and reset styles reliably
	const mapRef = useRef<L.Map | null>(null);
	const geoRef = useRef<L.GeoJSON | null>(null);
	const hoveredRef = useRef<L.Path | null>(null);

	const clearHover = () => {
		if (hoveredRef.current) {
			// resetStyle needs the same layer reference used by GeoJSON
			try {
				geoRef.current?.resetStyle(hoveredRef.current as any);
			} catch {
				// no-op if layer isn't part of current GeoJSON
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

	// Calculate color scale for registered voters (5 bins for compact legend)
	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const values = data.map((d) => d.registeredVoterCount);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);

		// Grayscale palette with 5 bins for compact display (NO BLUE - blue is reserved for Democratic party only)
		const range = [
			"#e0e0e0",
			"#9e9e9e",
			"#757575",
			"#616161",
			"#424242",
		];

		return (value: number) => {
			if (value === 0) return "#f5f5f5";
			const ratio = (value - minValue) / (maxValue - minValue || 1);
			const index = Math.floor(ratio * (range.length - 1));
			return range[Math.min(index, range.length - 1)];
		};
	}, [data]);

	// Create a data lookup map for efficient county data retrieval
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

				// Filter counties by state name
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

				// Calculate bounds for the map
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

	// Style function for counties based on registered voter data
	const getFeatureStyle = (feature?: Feature) => {
		if (!feature || !colorScale) {
			return {
				fillColor: "#f5f5f5",
				weight: 1,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.7,
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
			fillOpacity: 0.8,
		};
	};

	// Event handlers for county features — now with robust hover reset
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

		// Bind tooltip directly - no need to check mapRef.current
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
				// Ensure tooltip opens
				if (!targetLayer.isTooltipOpen()) {
					targetLayer.openTooltip();
				}
			},
			mouseout: (e: any) => {
				// Reset just this layer's style
				geoRef.current?.resetStyle(e.target as any);
				if (hoveredRef.current === e.target) hoveredRef.current = null;
				// Ensure tooltip closes
				try {
					(e.target as L.Path).closeTooltip();
				} catch {
					/* ignore */
				}
			},
			click: () => {
				// Opening your dialog typically prevents mouseout from firing; clear highlight proactively
				clearHover();
			},
		});
	};

	// Clear hover when the cursor leaves the map container (e.g., a dialog pops up)
	useEffect(() => {
		const node = mapRef.current?.getContainer();
		if (!node) return;
		const handler = () => clearHover();
		node.addEventListener("mouseleave", handler);
		return () => node.removeEventListener("mouseleave", handler);
	}, [mapRef.current]);

	// Optional: allow parent to force-clear when the dialog closes
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

	// Check if all data is zero (no data reported)
	const allZero = data.every((d) => d.registeredVoterCount === 0);

	// Note: Rhode Island data is now aggregated to county level by the backend,
	// so we no longer need to show the town-level warning
	const isRhodeIslandTownData = false;

	return (
		<Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={1}>
				<Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
					Registered Voters Distribution
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

			{/* Color Legend - Gradient style matching other tabs */}
			<Box>
				<Typography variant="body2" gutterBottom fontWeight={600} fontSize="0.85rem">
					Color Scale (Total Registered Voters)
				</Typography>
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="caption" sx={{ minWidth: 45, fontSize: "0.75rem" }}>
						{minValue.toLocaleString()}
					</Typography>
					<Box
						display="flex"
						height={24}
						flex={1}
						border="1px solid #e0e0e0"
						borderRadius={1}
						overflow="hidden"
					>
						{[
							"#e0e0e0",
							"#9e9e9e",
							"#757575",
							"#616161",
							"#424242",
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
					<Typography variant="caption" sx={{ minWidth: 45, textAlign: "right", fontSize: "0.75rem" }}>
						{maxValue.toLocaleString()}
					</Typography>
				</Box>
				{/*
				<Typography variant="caption" color="text.secondary" display="block" mt={0.5} fontSize="0.7rem">
					Interactive choropleth map showing voter registration distribution across counties. Hover over counties for detailed information.
				</Typography>
				*/}
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

export default VoterRegistrationChloroplethMap;
