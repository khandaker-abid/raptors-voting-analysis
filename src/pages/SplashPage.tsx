import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import USMap from "../components/USMap";
import QuickAccessWidget from "../components/QuickAccessWidget";
import EquipmentAgeChoropleth from "../components/EquipmentAgeChoropleth";
import {
	Box,
	ToggleButton,
	ToggleButtonGroup,
	Button,
	Paper,
	Typography,
	CircularProgress
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TableChartIcon from "@mui/icons-material/TableChart";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
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
				fetch("/us-state-boundaries.geojson").then(r => r.json()).catch(() => null)
			])
				.then(async ([ageData, geoJson]) => {
					const transformedData = Array.isArray(ageData)
						? ageData.map((item: any) => ({
							state: item.state || item.stateName || "",
							averageAge: item.averageAge || item.avgAge || item.age || 0
						}))
						: [];

					// Fallback: if local GeoJSON is missing or has no features, load a public states GeoJSON
					let resolvedGeo = geoJson;
					if (!resolvedGeo || !Array.isArray(resolvedGeo.features) || resolvedGeo.features.length === 0) {
						try {
							const resp = await fetch("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json");
							if (resp.ok) {
								resolvedGeo = await resp.json();
							}
						} catch {
							// ignore, will show map data not available inside choropleth
						}
					}
					setEquipmentAgeData(transformedData);
					setGeoJsonData(resolvedGeo);
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
	// GUI-30: Reset page to default state
	const handleReset = () => {
		setViewMode("states");
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
			{/* Control panel for map view toggle and navigation */}
			<Paper
				elevation={2}
				sx={{
					position: "absolute",
					bottom: 20,
					right: 12,
					zIndex: 1000,
					p: 1,
					borderRadius: 1.5,
					backgroundColor: "rgba(255, 255, 255, 0.9)",
					backdropFilter: "blur(8px)",
					minWidth: 340,
					width: 360,
					minHeight: 200,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: 1,
				}}
			>
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25, fontWeight: 600, fontSize: 14 }}>
					Map View
				</Typography>
				<ToggleButtonGroup
					value={viewMode}
					exclusive
					onChange={handleViewChange}
					size="small"
					sx={{ mb: 1.25, gap: 1, width: "100%" }}
				>
					<ToggleButton value="states" sx={{ px: 2, py: 0.75, fontSize: 14, flex: 1, justifyContent: "center", whiteSpace: "nowrap" }}>
						<MapIcon sx={{ mr: 0.75 }} fontSize="small" />
						States
					</ToggleButton>
					<ToggleButton value="equipmentAge" sx={{ px: 2, py: 0.75, fontSize: 14, flex: 1, justifyContent: "center", whiteSpace: "nowrap" }}>
						<AccessTimeIcon sx={{ mr: 0.75 }} fontSize="small" />
						Equipment Age
					</ToggleButton>
				</ToggleButtonGroup>

				<Button
					variant="outlined"
					size="small"
					fullWidth
					startIcon={<TableChartIcon />}
					onClick={() => navigate("/per-state-voting-equipment")}
					sx={{ textTransform: "none", fontWeight: 600, mb: 1, fontSize: 14, py: 0.9 }}
				>
					Per-State Equipment Table
				</Button>

				{/* GUI-30: Reset Button */}
				<Button
					variant="contained"
					color="error"
					size="small"
					fullWidth
					startIcon={<RestartAltIcon />}
					onClick={handleReset}
					disabled={viewMode === "states"}
					sx={{ textTransform: "none", fontWeight: 600, fontSize: 14, py: 0.9 }}
				>
					Reset View
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
