import React, { useState, useEffect } from "react";
import USMap from "../components/USMap";
import EquipmentAgeChoropleth from "../components/EquipmentAgeChoropleth";
import { Box, Button, ButtonGroup } from "@mui/material";

const SplashPage: React.FC = () => {
	const [viewMode, setViewMode] = useState<"states" | "equipment-age">("states");
	const [geoData, setGeoData] = useState<any>(null);

	// Load GeoJSON data for equipment age view
	useEffect(() => {
		fetch("/us-state-boundaries.geojson")
			.then((response) => response.json())
			.then((data) => setGeoData(data))
			.catch((error) => console.error("Error loading GeoJSON:", error));
	}, []);

	// Mock equipment age data - TODO: Replace with API call
	const mockEquipmentAgeData = [
		{ state: "Alabama", averageAge: 7.2 },
		{ state: "Arizona", averageAge: 4.5 },
		{ state: "Arkansas", averageAge: 6.8 },
		{ state: "California", averageAge: 5.1 },
		{ state: "Colorado", averageAge: 3.2 },
		{ state: "Connecticut", averageAge: 8.9 },
		{ state: "Delaware", averageAge: 6.5 },
		{ state: "Florida", averageAge: 5.7 },
		{ state: "Georgia", averageAge: 4.8 },
		{ state: "Idaho", averageAge: 9.2 },
		{ state: "Illinois", averageAge: 7.5 },
		{ state: "Indiana", averageAge: 8.1 },
		{ state: "Iowa", averageAge: 6.9 },
		{ state: "Kansas", averageAge: 7.8 },
		{ state: "Kentucky", averageAge: 9.5 },
		{ state: "Louisiana", averageAge: 10.2 },
		{ state: "Maine", averageAge: 5.5 },
		{ state: "Maryland", averageAge: 4.2 },
		{ state: "Massachusetts", averageAge: 6.1 },
		{ state: "Michigan", averageAge: 7.3 },
		{ state: "Minnesota", averageAge: 5.9 },
		{ state: "Mississippi", averageAge: 11.5 },
		{ state: "Missouri", averageAge: 8.7 },
		{ state: "Montana", averageAge: 9.8 },
		{ state: "Nebraska", averageAge: 7.1 },
		{ state: "Nevada", averageAge: 4.9 },
		{ state: "New Hampshire", averageAge: 6.3 },
		{ state: "New Jersey", averageAge: 5.4 },
		{ state: "New Mexico", averageAge: 8.2 },
		{ state: "New York", averageAge: 6.7 },
		{ state: "North Carolina", averageAge: 5.8 },
		{ state: "North Dakota", averageAge: 10.1 },
		{ state: "Ohio", averageAge: 7.9 },
		{ state: "Oklahoma", averageAge: 9.3 },
		{ state: "Oregon", averageAge: 4.7 },
		{ state: "Pennsylvania", averageAge: 7.6 },
		{ state: "Rhode Island", averageAge: 3.8 },
		{ state: "South Carolina", averageAge: 8.4 },
		{ state: "South Dakota", averageAge: 9.9 },
		{ state: "Tennessee", averageAge: 8.8 },
		{ state: "Texas", averageAge: 6.2 },
		{ state: "Utah", averageAge: 4.1 },
		{ state: "Vermont", averageAge: 7.4 },
		{ state: "Virginia", averageAge: 5.3 },
		{ state: "Washington", averageAge: 4.6 },
		{ state: "West Virginia", averageAge: 10.8 },
		{ state: "Wisconsin", averageAge: 6.4 },
		{ state: "Wyoming", averageAge: 11.2 },
	];

	return (
		<Box
			sx={{
				height: "calc(100vh - 90px)",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				padding: 0,
				margin: 0,
				overflow: "hidden",
			}}
		>
			{/* View Toggle Buttons */}
			<Box
				sx={{
					position: "absolute",
					top: 110,
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 1000,
				}}
			>
				<ButtonGroup variant="contained" size="small">
					<Button
						onClick={() => setViewMode("states")}
						variant={viewMode === "states" ? "contained" : "outlined"}
					>
						State Map
					</Button>
					<Button
						onClick={() => setViewMode("equipment-age")}
						variant={viewMode === "equipment-age" ? "contained" : "outlined"}
					>
						Equipment Age
					</Button>
				</ButtonGroup>
			</Box>

			{/* Map Content */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{viewMode === "states" ? (
					<USMap />
				) : (
					<EquipmentAgeChoropleth
						data={mockEquipmentAgeData}
						geoJsonData={geoData}
						onClose={() => setViewMode("states")}
					/>
				)}
			</Box>
		</Box>
	);
};

export default SplashPage;
