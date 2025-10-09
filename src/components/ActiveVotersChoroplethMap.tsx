import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Chip, Alert } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { getCountyCount } from "../data/stateShapes";
import type { ActiveVotersData } from "../data/activeVotersData";

interface ActiveVotersChoroplethMapProps {
	stateName: string;
	data: ActiveVotersData[];
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

const ActiveVotersChoroplethMap: React.FC<ActiveVotersChoroplethMapProps> = ({
	stateName,
	data,
}) => {
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	// Calculate color scale for active voter percentage
	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const percentages = data.map((d) => d.activePercentage);
		const maxPercentage = Math.max(...percentages);
		const minPercentage = Math.min(...percentages);

		// Use the same blue color bins as the provisional ballot choropleth
		const range = [
			"#e3f2fd", // Very low
			"#bbdefb", // Low
			"#90caf9", // Below average
			"#64b5f6", // Average
			"#42a5f5", // Above average
			"#2196f3", // High
			"#1976d2", // Very high
		];

		return (value: number) => {
			if (value === 0) return "#f5f5f5"; // Special color for no data
			const ratio = (value - minPercentage) / (maxPercentage - minPercentage);
			const index = Math.floor(ratio * (range.length - 1));
			return range[Math.min(index, range.length - 1)];
		};
	}, [data]);

	// Create a data lookup map for efficient county data retrieval
	const dataLookup = useMemo(() => {
		const lookup = new Map<string, ActiveVotersData>();
		data.forEach((item) => {
			// Normalize county names for better matching
			const normalizedCounty = item.county
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim();
			lookup.set(normalizedCounty, item);

			// Also add without "county" suffix for broader matching
			const withoutCounty = normalizedCounty.replace(/\s+county$/, "");
			if (withoutCounty !== normalizedCounty) {
				lookup.set(withoutCounty, item);
			}
		});
		return lookup;
	}, [data]);

	useEffect(() => {
		const loadMapData = async () => {
			if (!stateName) return;

			setLoading(true);
			setError(null);

			try {
				console.log(
					`Loading county data for active voters choropleth: ${stateName}`,
				);
				const response = await fetch(
					"/georef-united-states-of-america-county.geojson",
				);

				if (!response.ok) {
					throw new Error(
						`Failed to fetch county data: ${response.statusText}`,
					);
				}

				const countyData = (await response.json()) as CountyGeoJSONData;

				if (!countyData || !countyData.features) {
					throw new Error("County GeoJSON data is invalid or empty");
				}

				// Filter counties by state name
				const features = countyData.features.filter(
					(feature: CountyFeature) =>
						feature.properties.ste_name &&
						feature.properties.ste_name.includes(stateName),
				);

				console.log(`Found ${features.length} counties for ${stateName}`);

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
							bounds.extend([coord[1], coord[0]]); // [lat, lng]
						});
					} else if (feature.geometry.type === "MultiPolygon") {
						feature.geometry.coordinates.forEach((polygon) => {
							polygon[0].forEach((coord) => {
								bounds.extend([coord[1], coord[0]]); // [lat, lng]
							});
						});
					}
				});

				// Add padding to the bounds
				const paddedBounds = bounds.pad(0.1);
				setMapBounds(paddedBounds);

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading county data:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName]);

	// Style function for counties based on active voters data
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
		const countyName = (
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County"
		)
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim();

		// Try multiple variations of the county name
		let countyData = dataLookup.get(countyName);
		if (!countyData) {
			// Try without "county" suffix
			const withoutCounty = countyName.replace(/\s+county$/, "");
			countyData = dataLookup.get(withoutCounty);
		}
		if (!countyData) {
			// Try adding "county" suffix
			const withCounty = countyName.includes("county")
				? countyName
				: `${countyName} county`;
			countyData = dataLookup.get(withCounty);
		}

		const activePercentage = countyData?.activePercentage || 0;
		const fillColor = colorScale(activePercentage);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#fff",
			dashArray: "",
			fillOpacity: 0.7,
		};
	};

	// Event handlers for GeoJSON features
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const countyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		// Get normalized name for data lookup
		const normalizedName = countyName.toLowerCase().replace(/\s+/g, " ").trim();
		let countyData = dataLookup.get(normalizedName);
		if (!countyData) {
			const withoutCounty = normalizedName.replace(/\s+county$/, "");
			countyData = dataLookup.get(withoutCounty);
		}
		if (!countyData) {
			const withCounty = normalizedName.includes("county")
				? normalizedName
				: `${normalizedName} county`;
			countyData = dataLookup.get(withCounty);
		}

		const activeVoters = countyData?.activeVoters || 0;
		const totalVoters = countyData?.totalVoters || 0;
		const activePercentage = countyData?.activePercentage || 0;

		const tooltipContent = `
			<div style="font-weight: bold; margin-bottom: 4px;">${countyName}</div>
			<div>Active Voters: <span style="color: #2196f3;">${activeVoters.toLocaleString()}</span></div>
			<div>Total Voters: <span style="color: #90caf9;">${totalVoters.toLocaleString()}</span></div>
			<div>Active Percentage: <span style="color: #1976d2; font-weight: bold;">${activePercentage.toFixed(
				1,
			)}%</span></div>
			${
				activePercentage === 0
					? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">No data available</div>'
					: ""
			}
		`;

		layer.bindTooltip(tooltipContent, {
			permanent: false,
			direction: "center",
			className: "custom-tooltip",
		});

		layer.on({
			mouseover: (e) => {
				const targetLayer = e.target;
				targetLayer.setStyle({
					weight: 3,
					color: "#333",
					dashArray: "",
					fillOpacity: 0.8,
				});
				targetLayer.bringToFront();
			},
			mouseout: (e) => {
				const targetLayer = e.target;
				targetLayer.setStyle(getFeatureStyle(feature));
			},
		});
	};

	if (loading) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1">Loading map data...</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="error">
					<Typography variant="body2">
						Failed to load county boundaries: {error}
					</Typography>
				</Alert>
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No active voters choropleth data available for this state.
				</Typography>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1">No geographic data available...</Typography>
			</Paper>
		);
	}

	const maxPercentage = Math.max(...data.map((d) => d.activePercentage));
	const minPercentage = Math.min(...data.map((d) => d.activePercentage));
	const avgPercentage =
		data.reduce((sum, d) => sum + d.activePercentage, 0) / data.length;

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Active Voter Percentage Distribution - {stateName}
				</Typography>
			</Box>

			{/* Map Container */}
			<Box
				sx={{
					height: 400,
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					overflow: "hidden",
					mb: 3,
				}}>
				<MapContainer
					bounds={mapBounds || undefined}
					zoom={8}
					zoomSnap={0.1}
					minZoom={6}
					maxZoom={12}
					maxBounds={mapBounds || undefined}
					maxBoundsViscosity={1.0}
					style={{ height: "100%", width: "100%", borderRadius: "8px" }}
					scrollWheelZoom={true}>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
					/>
					<GeoJSON
						data={geoData}
						style={getFeatureStyle}
						onEachFeature={onEachFeature}
					/>
				</MapContainer>
			</Box>

			{/* Color Legend */}
			<Box>
				<Typography variant="subtitle2" gutterBottom fontWeight={600}>
					Color Scale (Active Voter Percentage)
				</Typography>
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="caption" sx={{ minWidth: 50 }}>
						{minPercentage.toFixed(1)}%
					</Typography>
					<Box
						display="flex"
						height={30}
						flex={1}
						border="1px solid #e0e0e0"
						borderRadius={1}
						overflow="hidden">
						{colorScale &&
							[
								"#e3f2fd",
								"#bbdefb",
								"#90caf9",
								"#64b5f6",
								"#42a5f5",
								"#2196f3",
								"#1976d2",
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
					<Typography
						variant="caption"
						sx={{ minWidth: 50, textAlign: "right" }}>
						{maxPercentage.toFixed(1)}%
					</Typography>
				</Box>
				<Typography
					variant="caption"
					color="text.secondary"
					display="block"
					mt={1}>
					8-color scale showing percentage of active voters across
					counties/towns
				</Typography>
			</Box>
		</Paper>
	);
};

export default ActiveVotersChoroplethMap;
