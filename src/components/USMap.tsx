import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import L from "leaflet";
import type { Feature, Geometry, GeoJsonObject } from "geojson";
import { getDetailStateDescription } from "../data/stateData";
import theme from "../theme";

type StateFeature = Feature<Geometry, { name: string; abbreviation: string }>;

const USMap: React.FC = () => {
	const navigate = useNavigate();
	const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);
	const detailStates = useMemo(
		() => ["Rhode Island", "Maryland", "Arkansas"],
		[],
	);

	// Load GeoJSON data
	useEffect(() => {
		fetch("/us-state-boundaries.geojson")
			.then((response) => response.json())
			.then((data) => setGeoData(data))
			.catch((error) => console.error("Error loading GeoJSON:", error));
	}, []);

	// Style function for GeoJSON features
	const getFeatureStyle = (feature?: Feature) => {
		if (!feature) return {};
		const stateFeature = feature as StateFeature;
		const isDetailState = detailStates.includes(stateFeature.properties.name);
		return {
			fillColor: isDetailState ? theme.palette.primary.main : "#e0e0e0",
			weight: isDetailState ? 3 : 1,
			opacity: 1,
			color: isDetailState ? theme.palette.primary.main : "#bdbdbd",
			dashArray: "",
			fillOpacity: isDetailState ? 0.5 : 0.2,
		};
	};

	// Event handlers for GeoJSON features
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const stateFeature = feature as StateFeature;
		const isDetailState = detailStates.includes(stateFeature.properties.name);

		const tooltipContent = isDetailState
			? `${
					stateFeature.properties.name
			  } (Detailed Data Available)<br/>${getDetailStateDescription(
					stateFeature.properties.name,
			  )}`
			: stateFeature.properties.name;

		layer.bindTooltip(tooltipContent, {
			permanent: false,
			direction: "auto",
			className: "custom-tooltip",
			offset: [0, 0],
			sticky: true,
		});

		layer.on({
			mouseover: (e) => {
				const targetLayer = e.target;
				targetLayer.setStyle({
					weight: isDetailState ? 4 : 2,
					color: isDetailState ? "#0d47a1" : "#757575",
					dashArray: "",
					fillOpacity: isDetailState ? 0.7 : 0.3,
				});
				targetLayer.bringToFront();
			},
			mouseout: (e) => {
				const targetLayer = e.target;
				targetLayer.setStyle({
					fillColor: isDetailState ? "#2196F3" : "#e0e0e0",
					weight: isDetailState ? 3 : 1,
					opacity: 1,
					color: isDetailState ? "#1565C0" : "#bdbdbd",
					dashArray: "",
					fillOpacity: isDetailState ? 0.5 : 0.2,
				});
			},
			click: () => {
				navigate(`/state/${encodeURIComponent(stateFeature.properties.name)}`);
			},
		});
	};

	if (!geoData) {
		return (
			<Box sx={{ textAlign: "center", p: 4 }}>
				<Typography>Loading map data...</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				textAlign: "center",
				width: "100%",
				height: "100%",
				margin: "0",
				padding: "0",
				minHeight: "500px", // Ensure minimum height for map rendering
			}}>
			<Box
				className="us-map-container"
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 0,
					backgroundColor: "#fafafa",
					height: "100%",
					width: "100%",
					overflow: "visible",
					minHeight: "500px", // Ensure minimum height for map rendering
				}}>
				<MapContainer
					center={[39.5, -96.0]} // Adjusted center to better show Florida and Maine
					zoom={4.8}
					zoomSnap={0.25}
					minZoom={4.0}
					maxZoom={7}
					maxBounds={[
						[20, -130], // Southwest corner (roughly covers US territory)
						[50, -60], // Northeast corner
					]}
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
		</Box>
	);
};

export default USMap;
