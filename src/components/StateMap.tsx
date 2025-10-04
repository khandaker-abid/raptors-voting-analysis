import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Box, Typography, Paper, Alert } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type CountyFeature = Feature<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;
type StateFeature = Feature<Geometry, { name: string }>;
type CountyGeoJSONData = FeatureCollection<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;
type StateGeoJSONData = FeatureCollection<Geometry, { name: string }>;

interface StateMapProps {
	stateName: string;
	center: [number, number];
	isDetailState: boolean;
}

// Detail states that have county data - moved outside component to avoid dependency issues
const detailStates = ["Rhode Island", "Maryland", "Arkansas"];

const StateMap: React.FC<StateMapProps> = ({
	stateName,
	center,
	isDetailState,
}) => {
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	useEffect(() => {
		const loadMapData = async () => {
			if (!stateName) return;

			setLoading(true);
			setError(null);

			try {
				let features: (CountyFeature | StateFeature)[];

				if (isDetailState && detailStates.includes(stateName)) {
					// Load county data for detail states from data folder
					console.log(`Loading county data for detail state: ${stateName}`);
					const response = await fetch(
						"/src/data/georef-united-states-of-america-county.geojson",
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
					features = countyData.features.filter(
						(feature: CountyFeature) =>
							feature.properties.ste_name &&
							feature.properties.ste_name.includes(stateName),
					);
					console.log(`Found ${features.length} counties for ${stateName}`);
				} else {
					// Load state boundary data for non-detail states from data folder
					console.log(`Loading state boundary data for: ${stateName}`);
					const response = await fetch("/src/data/us-state-boundaries.geojson");

					if (!response.ok) {
						throw new Error(
							`Failed to fetch state data: ${response.statusText}`,
						);
					}

					const stateData = (await response.json()) as StateGeoJSONData;

					if (!stateData || !stateData.features) {
						throw new Error("State GeoJSON data is invalid or empty");
					}

					// Filter to get the specific state
					features = stateData.features.filter(
						(feature: StateFeature) => feature.properties.name === stateName,
					);
					console.log(
						`Found ${features.length} state boundary for ${stateName}`,
					);
				}

				if (features.length === 0) {
					throw new Error(
						`No ${
							isDetailState ? "county" : "state"
						} data found for ${stateName}`,
					);
				}

				// Create FeatureCollection for the map
				const featureCollection: FeatureCollection = {
					type: "FeatureCollection",
					features: features,
				};

				// Calculate bounds for pan constraints
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

				// Add some padding to the bounds
				const paddedBounds = bounds.pad(0.1);
				setMapBounds(paddedBounds);

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading map data:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load map data",
				);
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName, isDetailState]);

	// Style function for map features
	const getFeatureStyle = (feature?: Feature) => {
		if (!feature) return {};

		if (isDetailState && detailStates.includes(stateName)) {
			// County styling for detail states
			return {
				fillColor: "#2196F3",
				weight: 1,
				opacity: 1,
				color: "#1565C0",
				dashArray: "",
				fillOpacity: 0.3,
			};
		} else {
			// State boundary styling for non-detail states
			return {
				fillColor: "#e0e0e0",
				weight: 2,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.2,
			};
		}
	};

	// Event handlers for map features
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		if (isDetailState && detailStates.includes(stateName)) {
			// County feature handling
			const countyFeature = feature as CountyFeature;
			const countyName =
				countyFeature.properties.coty_name_long?.[0] ||
				countyFeature.properties.coty_name?.[0] ||
				"Unknown County";

			layer.bindTooltip(countyName, {
				permanent: false,
				direction: "center",
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e) => {
					const targetLayer = e.target;
					targetLayer.setStyle({
						weight: 2,
						color: "#0d47a1",
						dashArray: "",
						fillOpacity: 0.6,
					});
					targetLayer.bringToFront();
				},
				mouseout: (e) => {
					const targetLayer = e.target;
					targetLayer.setStyle(getFeatureStyle(feature));
				},
			});
		} else {
			// State feature handling
			layer.bindTooltip(stateName, {
				permanent: false,
				direction: "center",
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e) => {
					const targetLayer = e.target;
					targetLayer.setStyle({
						weight: 3,
						color: "#757575",
						dashArray: "",
						fillOpacity: 0.4,
					});
					targetLayer.bringToFront();
				},
				mouseout: (e) => {
					const targetLayer = e.target;
					targetLayer.setStyle(getFeatureStyle(feature));
				},
			});
		}
	};

	if (!stateName) {
		return <Alert severity="warning">No state selected</Alert>;
	}

	if (loading) {
		return (
			<Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
				<Typography>
					Loading {isDetailState ? "county" : "state"} map data...
				</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper elevation={2} sx={{ p: 3 }}>
				<Alert severity="error">{error}</Alert>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper elevation={2} sx={{ p: 3 }}>
				<Alert severity="info">No map data available</Alert>
			</Paper>
		);
	}

	return (
		<Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
			<Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
				{stateName} Geographic View
			</Typography>
			{isDetailState && detailStates.includes(stateName) && (
				<Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
					County boundaries with detailed data
				</Typography>
			)}
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 1,
					backgroundColor: "#fafafa",
					height: 500,
					width: "100%",
					margin: "0 auto",
				}}>
				<MapContainer
					center={[center[1], center[0]]} // Note: Leaflet uses [lat, lng]
					zoom={7}
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
		</Paper>
	);
};

export default StateMap;
