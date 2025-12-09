import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import USMap from "../components/USMap";
import QuickAccessWidget from "../components/QuickAccessWidget";
import EquipmentAgeChoropleth from "../components/EquipmentAgeChoropleth";
import { Box, ToggleButton, ToggleButtonGroup, Button, Paper, Typography, CircularProgress } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TableChartIcon from "@mui/icons-material/TableChart";
import { fetchEquipmentAgeAllStates } from "../data/api";

interface StateEquipmentAge {
	state: string;
	averageAge: number;
}

const SplashPage: React.FC = () => {
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"states" | "equipmentAge">("states");
	const [equipmentAgeData, setEquipmentAgeData] = useState<StateEquipmentAge[]>([]);
	const [geoJsonData, setGeoJsonData] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (viewMode === "equipmentAge" && equipmentAgeData.length === 0) {
			setLoading(true);

			Promise.all([
				fetchEquipmentAgeAllStates(),
				fetch("/us-state-boundaries.geojson").then(r => r.json())
			])
				.then(([ageData, geoJson]) => {
					const transformedData = Array.isArray(ageData)
						? ageData.map((item: any) => ({
							state: item.state || item.stateName || "",
							averageAge: item.averageAge || item.avgAge || item.age || 0
						}))
						: [];
					setEquipmentAgeData(transformedData);
					setGeoJsonData(geoJson);
					setLoading(false);
				})
				.catch(err => {
					console.error("Error loading equipment age data:", err);
					setLoading(false);
				});
		}
	}, [viewMode, equipmentAgeData.length]);

	const handleViewChange = (
		_event: React.MouseEvent<HTMLElement>,
		newView: "states" | "equipmentAge" | null,
	) => {
		if (newView !== null) {
			setViewMode(newView);
		}
	};

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
				position: "relative",
			}}
		>
			<Paper
				elevation={3}
				sx={{
					position: "absolute",
					bottom: 100,
					right: 20,
					zIndex: 1000,
					p: 1.5,
					borderRadius: 2,
					backgroundColor: "rgba(255, 255, 255, 0.95)",
					backdropFilter: "blur(10px)",
				}}
			>
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
					Map View
				</Typography>
				<ToggleButtonGroup
					value={viewMode}
					exclusive
					onChange={handleViewChange}
					size="small"
					sx={{ mb: 1.5 }}
				>
					<ToggleButton value="states" sx={{ px: 2 }}>
						<MapIcon sx={{ mr: 0.5 }} fontSize="small" />
						States
					</ToggleButton>
					<ToggleButton value="equipmentAge" sx={{ px: 2 }}>
						<AccessTimeIcon sx={{ mr: 0.5 }} fontSize="small" />
						Equipment Age
					</ToggleButton>
				</ToggleButtonGroup>

				<Button
					variant="outlined"
					size="small"
					fullWidth
					startIcon={<TableChartIcon />}
					onClick={() => navigate("/per-state-voting-equipment")}
					sx={{ textTransform: "none", fontWeight: 600 }}
				>
					Per-State Equipment Table
				</Button>
			</Paper>

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
				) : loading ? (
					<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
						<CircularProgress />
						<Typography color="text.secondary">Loading equipment age data...</Typography>
					</Box>
				) : (
					<EquipmentAgeChoropleth
						data={equipmentAgeData}
						geoJsonData={geoJsonData}
						onClose={() => setViewMode("states")}
					/>
				)}
			</Box>

			<QuickAccessWidget />
		</Box>
	);
};

export default SplashPage;
