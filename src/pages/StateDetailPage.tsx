import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Container,
	Typography,
	Box,
	Button,
	Paper,
	Tabs,
	Tab,
	Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { stateData, getStateCenter, isDetailState } from "../data/stateData";
import { getCountyCount } from "../data/stateShapes";
import {
	getProvisionalBallotData,
	getProvisionalBallotCategories,
	getChoroplethData,
} from "../data/provisionalBallotData";
import StateMap from "../components/StateMap";
import ProvisionalBallotBarChart from "../components/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../components/ProvisionalBallotTable";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";

// New imports for GUI-25 to GUI-27
import EquipmentRejectedBubbleChart from "../components/EquipmentRejectedBubbleChart";
import ResetButton from "../components/ResetButton";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

const StateDetailPage: React.FC = () => {
	const { stateName } = useParams<{ stateName: string }>();
	const navigate = useNavigate();
	const [tabValue, setTabValue] = React.useState(0);

	// Decode the state name from URL
	const decodedStateName = decodeURIComponent(stateName || "");

	// Get state data
	const stateInfo = useMemo(() => {
		return stateData.find((s) => s.name === decodedStateName);
	}, [decodedStateName]);

	// Get state center for map
	const stateCenter = useMemo(() => {
		return getStateCenter(decodedStateName);
	}, [decodedStateName]);

	// Check if this is a detail state
	const isDetail = useMemo(() => {
		return isDetailState(decodedStateName);
	}, [decodedStateName]);

	// Get provisional ballot data
	const provisionalData = useMemo(() => {
		return getProvisionalBallotData(decodedStateName);
	}, [decodedStateName]);

	// Get choropleth data
	const choroplethData = useMemo(() => {
		return getChoroplethData(decodedStateName);
	}, [decodedStateName]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	if (!stateInfo) {
		return (
			<Container sx={{ py: 4 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					State "{decodedStateName}" not found. Please select a valid state.
				</Alert>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate("/")}
					variant="contained">
					Back to Map
				</Button>
			</Container>
		);
	}

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			<Box display="flex" alignItems="center" gap={2} mb={4}>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate("/")}
					variant="outlined">
					Back to Map
				</Button>
				<Typography
					variant="h4"
					component="h1"
					sx={{
						background: isDetail
							? "linear-gradient(90deg, #2196F3 0%, #1976D2 100%)"
							: "inherit",
						WebkitBackgroundClip: isDetail ? "text" : "unset",
						WebkitTextFillColor: isDetail ? "transparent" : "inherit",
						fontWeight: "bold",
					}}>
					{stateInfo.name} Voting Analysis
				</Typography>
			</Box>

			{/* State Overview Cards */}
			<Box display="flex" gap={2} mb={4} flexWrap="wrap">
				<Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
					<Typography variant="subtitle2" color="text.secondary">
						State Type
					</Typography>
					<Typography variant="h6">
						{isDetail ? "Detailed Analysis Available" : "Basic View"}
					</Typography>
				</Paper>
				{stateInfo.cvapPercentage && (
					<Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
						<Typography variant="subtitle2" color="text.secondary">
							CVAP %
						</Typography>
						<Typography variant="h6">{stateInfo.cvapPercentage}%</Typography>
					</Paper>
				)}
				{isDetail && (
					<Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Counties/Towns
						</Typography>
						<Typography variant="h6">
							{getCountyCount(decodedStateName)}
						</Typography>
					</Paper>
				)}
			</Box>

			{/* Tabs for different views */}
			<Paper sx={{ width: "100%", mb: 2 }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						aria-label="state data tabs">
						<Tab label="State Map" />
						{isDetail && <Tab label="Provisional Ballot Chart" />}
						{isDetail && <Tab label="Provisional Ballot Table" />}
						{isDetail && <Tab label="Choropleth Map" />}
						{isDetail && <Tab label="Equipment vs Rejected Ballots" />}
					</Tabs>
				</Box>

				<TabPanel value={tabValue} index={0}>
					<StateMap
						stateName={decodedStateName}
						center={stateCenter}
						isDetailState={isDetail}
					/>
				</TabPanel>

				{isDetail && (
					<>
						<TabPanel value={tabValue} index={1}>
							<ProvisionalBallotBarChart
								data={provisionalData || []}
								categories={getProvisionalBallotCategories()}
							/>
						</TabPanel>

						<TabPanel value={tabValue} index={2}>
							<ProvisionalBallotTable data={provisionalData || []} />
						</TabPanel>

						<TabPanel value={tabValue} index={3}>
							<ProvisionalBallotChoroplethMap
								stateName={decodedStateName}
								data={choroplethData || []}
							/>
						</TabPanel>

						<TabPanel value={tabValue} index={4}>
							<EquipmentRejectedBubbleChart
								data={[
									{ county: "Travis", equipmentQuality: 85, rejectedPct: 2, party: "D" },
									{ county: "Orange", equipmentQuality: 70, rejectedPct: 5, party: "R" },
								]}
								regressionLines={[
									{ party: "D", coefficients: { a: 0.5, b: 1.2 } },
									{ party: "R", coefficients: { a: 0.7, b: 1.0 } },
								]}
							/>
						</TabPanel>
					</>
				)}
			</Paper>

			{/* GUI-27: Reset Button */}
			<ResetButton />
		</Container>
	);
};

export default StateDetailPage;
