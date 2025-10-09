import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Chip, Alert } from "@mui/material";
import { lighten, darken } from "@mui/material/styles";
import theme from "../theme";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

interface ProvisionalBallotChoroplethMapProps {
	stateName: string;
	data: Array<{
		county: string;
		E1a: number;
		lat?: number;
		lng?: number;
	}>;
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

const ProvisionalBallotChoroplethMap: React.FC<
	ProvisionalBallotChoroplethMapProps
> = ({ stateName, data }) => {
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	// Derive palette from theme primary color so all choropleths match
	const COLOR_PALETTE = useMemo(() => {
		const main = theme.palette.primary.main;
		return [
			lighten(main, 0.6),
			lighten(main, 0.35),
			lighten(main, 0.15),
			main,
			darken(main, 0.08),
			darken(main, 0.24),
			darken(main, 0.45),
		];
	}, [theme.palette.primary.main]);

	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const values = data.map((d) => d.E1a);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);

		return (value: number) => {
			if (value === 0) return "#f5f5f5";
			if (maxValue === minValue) return COLOR_PALETTE[COLOR_PALETTE.length - 1];
			const ratio = (value - minValue) / (maxValue - minValue);
			const index = Math.floor(ratio * (COLOR_PALETTE.length - 1));
			return COLOR_PALETTE[Math.min(index, COLOR_PALETTE.length - 1)];
		};
	}, [data, COLOR_PALETTE]);

	// Create a data lookup map for efficient county data retrieval
	const dataLookup = useMemo(() => {
		const lookup = new Map<string, number>();
		data.forEach((item) => {
			// Normalize county names for better matching
			const normalizedCounty = item.county
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim();
			lookup.set(normalizedCounty, item.E1a);

			// Also add without "county" suffix for broader matching
			const withoutCounty = normalizedCounty.replace(/\s+county$/, "");
			if (withoutCounty !== normalizedCounty) {
				lookup.set(withoutCounty, item.E1a);
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
				console.log(`Loading county data for choropleth: ${stateName}`);
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
				console.error("Error loading choropleth map data:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load map data",
				);
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName]);

	// Style function for counties based on provisional ballot data
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
		let ballotCount = dataLookup.get(countyName);
		if (ballotCount === undefined) {
			// Try without "county" suffix
			const withoutCounty = countyName.replace(/\s+county$/, "");
			ballotCount = dataLookup.get(withoutCounty);
		}
		if (ballotCount === undefined) {
			// Try adding "county" suffix
			const withCounty = countyName.includes("county")
				? countyName
				: `${countyName} county`;
			ballotCount = dataLookup.get(withCounty);
		}
		ballotCount = ballotCount || 0;

		const fillColor = colorScale(ballotCount);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#ffffff",
			dashArray: "",
			fillOpacity: 0.8,
		};
	};

	// Event handlers for county features
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const displayCountyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const normalizedCountyName = displayCountyName
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim();

		const ballotCount = dataLookup.get(normalizedCountyName) || 0;

		// Create tooltip content
		const tooltipContent = `
			<div style="font-weight: bold; margin-bottom: 4px;">${displayCountyName}</div>
			<div>Provisional Ballots: <span style="color: #2196f3; font-weight: bold;">${ballotCount.toLocaleString()}</span></div>
			${
				ballotCount === 0
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
					color: "#333333",
					dashArray: "",
					fillOpacity: 1.0,
				});
				targetLayer.bringToFront();
			},
			mouseout: (e) => {
				const targetLayer = e.target;
				targetLayer.setStyle(getFeatureStyle(feature));
			},
		});
	};

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No provisional ballot choropleth data available for this state.
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

	const maxValue = Math.max(...data.map((d) => d.E1a));
	const minValue = Math.min(...data.map((d) => d.E1a));
	const totalBallots = data.reduce((sum, d) => sum + d.E1a, 0);

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Provisional Ballots Distribution - {stateName}
				</Typography>
			</Box>

			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 0,
					backgroundColor: "#fafafa",
					height: 400,
					width: "100%",
					margin: "0 auto",
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
					Color Scale (E1a - Total Provisional Ballots Cast)
				</Typography>
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="caption" sx={{ minWidth: 50 }}>
						{minValue}
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
						{maxValue}
					</Typography>
				</Box>
				<Typography
					variant="caption"
					color="text.secondary"
					display="block"
					mt={1}>
					Interactive choropleth map showing provisional ballot distribution
					across counties. Hover over counties for detailed information.
				</Typography>
			</Box>
		</Paper>
	);
};

export default ProvisionalBallotChoroplethMap;
