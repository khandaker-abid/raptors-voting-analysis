import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
	Typography,
	Box,
	Paper,
	Tabs,
	Tab,
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	stateData,
	getStateCenter,
	isDetailState,
	getDetailStateDescription,
} from "../data/stateData";
import { getCountyCount } from "../data/stateShapes";
import {
	getProvisionalBallotData,
	getProvisionalBallotCategories,
	getChoroplethData,
} from "../data/provisionalBallotData";
import { getActiveVotersData } from "../data/activeVotersData";
import StateMap from "../components/StateMap";
import ProvisionalBallotBarChart from "../components/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../components/ProvisionalBallotTable";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import ActiveVotersBarChart from "../components/ActiveVotersBarChart";
import ActiveVotersTable from "../components/ActiveVotersTable";
import ActiveVotersChoroplethMap from "../components/ActiveVotersChoroplethMap";
import StateVotingEquipmentTable from "../components/StateVotingEquipmentTable";
import StateVoterRegistrationTable from "../components/StateVoterRegistrationTable";
import VoterRegistrationChloroplethMap from "../components/VoterRegistrationChloroplethMap";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<Box
			component="div"
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}>
			{value === index && <Box sx={{ p: 0 }}>{children}</Box>}
		</Box>
	);
}

const StateDetailPage: React.FC = () => {
	const { stateName } = useParams<{ stateName: string }>();
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

	// Get active voters data for detail states
	const activeVotersData = useMemo(() => {
		return isDetail ? getActiveVotersData(decodedStateName) : null;
	}, [decodedStateName, isDetail]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	if (!stateInfo) {
		return (
			<Box sx={{ py: 0, px: 0 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					State "{decodedStateName}" not found. Please select a valid state.
				</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ py: 0, px: 0, width: "100%", margin: 0 }}>
			{/* Organized Content with Category Groups */}
			<Paper sx={{ width: "100%", mb: 0 }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						aria-label="state data tabs"
						variant="scrollable"
						scrollButtons="auto"
						sx={{
							"& .MuiTab-root": {
								"fontSize": "0.95rem",
								"fontWeight": 600,
								"textTransform": "none",
								"minHeight": 48,
								"&.Mui-selected": {
									background:
										"linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)",
								},
							},
						}}>
						<Tab
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<span>📍</span>
									<span>Overview</span>
								</Box>
							}
						/>
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>🗳️</span>
										<span>Provisional Ballots</span>
									</Box>
								}
							/>
						)}
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>👥</span>
										<span>Active Voters</span>
									</Box>
								}
							/>
						)}
						<Tab
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<span>📟</span>
									<span>Voting Equipment</span>
								</Box>
							}
						/>
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>📥</span>
										<span>Voter Registration Data</span>
									</Box>
								}
							/>
						)}
					</Tabs>
				</Box>

				{/* Overview Tab */}
				<TabPanel value={tabValue} index={0}>
					<Box sx={{ p: 0 }}>
						{/* Map and State Info Side by Side */}
						<Box display="flex" gap={3} alignItems="flex-start" flexWrap="wrap">
							{/* Map Section */}
							<Box sx={{ flex: 1, minWidth: 400 }}>
								<StateMap
									stateName={decodedStateName}
									center={stateCenter}
									isDetailState={isDetail}
								/>
							</Box>

							{/* State Overview Cards */}
							<Box sx={{ flex: 0, minWidth: 300, maxWidth: 400 }}>
								<Box display="flex" flexDirection="column" gap={2}>
									<Paper sx={{ p: 2 }}>
										<Typography variant="subtitle2" color="text.secondary">
											State Type
										</Typography>
										<Typography variant="h6">
											{isDetail ? "Detailed Analysis Available" : "Basic View"}
										</Typography>
										{isDetail && (
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mt: 1 }}>
												{getDetailStateDescription(decodedStateName)}
											</Typography>
										)}
									</Paper>
									{stateInfo.cvapPercentage && (
										<Paper sx={{ p: 2 }}>
											<Typography variant="subtitle2" color="text.secondary">
												CVAP %
											</Typography>
											<Typography variant="h6">
												{stateInfo.cvapPercentage}%
											</Typography>
										</Paper>
									)}
									{isDetail && (
										<Paper sx={{ p: 2 }}>
											<Typography variant="subtitle2" color="text.secondary">
												Counties/Towns
											</Typography>
											<Typography variant="h6">
												{getCountyCount(decodedStateName)}
											</Typography>
										</Paper>
									)}
								</Box>
							</Box>
						</Box>
					</Box>
				</TabPanel>

				{/* Provisional Ballots Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={1}>
						<Box sx={{ p: 0 }}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									mb: 4,
								}}>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}>
									<ProvisionalBallotBarChart
										data={provisionalData || []}
										categories={getProvisionalBallotCategories()}
									/>
								</Box>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}>
									<ProvisionalBallotChoroplethMap
										stateName={decodedStateName}
										data={choroplethData || []}
									/>
								</Box>
							</Box>

							<ProvisionalBallotTable data={provisionalData || []} />
						</Box>
					</TabPanel>
				)}

				{/* Active Voters Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={2}>
						<Box sx={{ p: 0 }}>
							<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
								👥 Active Voters Analysis
							</Typography>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">📊 Charts & Maps</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{
											display: "flex",
											gap: 2,
											flexDirection: { xs: "column", md: "row" },
											alignItems: "stretch",
											justifyContent: "space-between",
										}}>
										<Box
											sx={{
												flex: 1,
												minWidth: { xs: "100%", md: "calc(50% - 8px)" },
												maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											}}>
											<ActiveVotersBarChart
												data={activeVotersData || []}
												stateName={decodedStateName}
											/>
										</Box>
										<Box
											sx={{
												flex: 1,
												minWidth: { xs: "100%", md: "calc(50% - 8px)" },
												maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											}}>
											<ActiveVotersChoroplethMap
												stateName={decodedStateName}
												data={activeVotersData || []}
											/>
										</Box>
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">📋 Data Table</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<ActiveVotersTable
										data={activeVotersData || []}
										stateName={decodedStateName}
									/>
								</AccordionDetails>
							</Accordion>
						</Box>
					</TabPanel>
				)}

				{/* Voting Equipment Tab */}
				<TabPanel value={tabValue} index={isDetail ? 3 : 1}>
					<Box sx={{ p: 0}}>
						<StateVotingEquipmentTable stateName={stateName ? stateName : ""} />
					</Box>
				</TabPanel>

				{/* Voter Registration Data Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={4}>
						<Box sx={{ p: 0 }}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									mb: 4,
								}}>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}>
									<StateVoterRegistrationTable stateName={stateName ? stateName : ""}/>
								</Box>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}>
									<VoterRegistrationChloroplethMap
										stateName={decodedStateName}
										data={choroplethData || []}
									/>
								</Box>
							</Box>
						</Box>
					</TabPanel>
				)}
			</Paper>
		</Box>
	);
};

export default StateDetailPage;

									// <Paper sx={{ p: 2 }}>
									// 	<Typography variant="subtitle2" color="text.secondary">
									// 		Counties/Towns
									// 	</Typography>
									// 	<StateVotingEquipmentTable stateName={stateName ? stateName : ""} />
									// </Paper>