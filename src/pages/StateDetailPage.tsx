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
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { getEquipmentData } from "../data/equipmentData";
import { getActiveVotersData } from "../data/activeVotersData";
import { getPollbookDeletionData } from "../data/pollbookDeletionData";
import { generateMailBallotRejectionData } from "../data/mailBallotRejectionData";
import StateMap from "../components/StateMap";
import ProvisionalBallotBarChart from "../components/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../components/ProvisionalBallotTable";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import EquipmentSummary from "../components/EquipmentSummary";
import ActiveVotersBarChart from "../components/ActiveVotersBarChart";
import ActiveVotersTable from "../components/ActiveVotersTable";
import ActiveVotersChoroplethMap from "../components/ActiveVotersChoroplethMap";
import PollbookDeletionBarChart from "../components/PollbookDeletionBarChart";
import PollbookDeletionTable from "../components/PollbookDeletionTable";
import PollbookDeletionChoroplethMap from "../components/PollbookDeletionChoroplethMap";
import MailBallotRejectionBarChart from "../components/MailBallotRejectionBarChart";
import MailBallotRejectionTable from "../components/MailBallotRejectionTable";
import MailBallotRejectionChoroplethMap from "../components/MailBallotRejectionChoroplethMap";
import VotingEquipmentChoroplethMap from "../components/VotingEquipmentChoroplethMap";
import VotingEquipmentAgeChoroplethMap from "../components/VotingEquipmentAgeChoroplethMap";
import VotingEquipmentRegionalTable from "../components/VotingEquipmentRegionalTable";
import USVotingEquipmentSummary from "../components/USVotingEquipmentSummary";
import StateEquipmentHistoryBarChart from "../components/StateEquipmentHistoryBarChart";
import PartyComparisonTable from "../components/PartyComparisonTable";
import VoterRegistrationLineChart from "../components/VoterRegistrationLineChart";
import VoterRegistrationChoroplethMap from "../components/VoterRegistrationChoroplethMap";
import VoterRegistrationTable from "../components/VoterRegistrationTable";
import VoterRegistrationBubbleChart from "../components/VoterRegistrationBubbleChart";
import RegisteredVotersDisplay from "../components/RegisteredVotersDisplay";
import EAVSVotingRegionsMap from "../components/EAVSVotingRegionsMap";

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

	// Get equipment data for detail states
	const equipmentData = useMemo(() => {
		return isDetail ? getEquipmentData(decodedStateName) : null;
	}, [decodedStateName, isDetail]);

	// Get active voters data for detail states
	const activeVotersData = useMemo(() => {
		return isDetail ? getActiveVotersData(decodedStateName) : null;
	}, [decodedStateName, isDetail]);

	// Get pollbook deletion data for detail states
	const pollbookDeletionData = useMemo(() => {
		return isDetail ? getPollbookDeletionData(decodedStateName) : null;
	}, [decodedStateName, isDetail]);

	// Get mail ballot rejection data for detail states
	const mailBallotRejectionData = useMemo(() => {
		return isDetail ? generateMailBallotRejectionData(decodedStateName) : null;
	}, [decodedStateName, isDetail]);

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
					{isDetail && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							{getDetailStateDescription(decodedStateName)}
						</Typography>
					)}
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

			{/* Organized Content with Category Groups */}
			<Paper sx={{ width: "100%", mb: 2 }}>
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
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>📊</span>
										<span>Voter Registration</span>
									</Box>
								}
							/>
						)}
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>🖥️</span>
										<span>Equipment Analysis</span>
									</Box>
								}
							/>
						)}
						{isDetail && (
							<Tab
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<span>⚠️</span>
										<span>Data Issues</span>
									</Box>
								}
							/>
						)}
						<Tab
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<span>📈</span>
									<span>Comparisons</span>
								</Box>
							}
						/>
					</Tabs>
				</Box>

				{/* Overview Tab */}
				<TabPanel value={tabValue} index={0}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
							📍 {decodedStateName} Overview
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							Geographic view and general information about {decodedStateName}'s
							voting infrastructure and administrative boundaries.
						</Typography>
						<Box sx={{ width: "60%", maxWidth: 600, mx: "auto" }}>
							<StateMap
								stateName={decodedStateName}
								center={stateCenter}
								isDetailState={isDetail}
							/>
						</Box>
					</Box>
				</TabPanel>

				{/* Provisional Ballots Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={1}>
						<Box sx={{ p: 2 }}>
							<Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
								🗳️ Provisional Ballot Analysis
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
								Comprehensive analysis of provisional ballots including
								acceptance rates, rejection reasons, and county-level
								variations.
							</Typography>

							<Accordion
								defaultExpanded
								sx={{
									"& .MuiAccordionSummary-root": {
										"backgroundColor": "rgba(33, 150, 243, 0.05)",
										"&:hover": { backgroundColor: "rgba(33, 150, 243, 0.1)" },
									},
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon />}
									sx={{ "& .MuiTypography-root": { fontWeight: 600 } }}>
									<Typography variant="h6">
										📊 Charts & Visualizations
									</Typography>
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
								</AccordionDetails>
							</Accordion>

							<Accordion
								sx={{
									"& .MuiAccordionSummary-root": {
										"backgroundColor": "rgba(76, 175, 80, 0.05)",
										"&:hover": { backgroundColor: "rgba(76, 175, 80, 0.1)" },
									},
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon />}
									sx={{ "& .MuiTypography-root": { fontWeight: 600 } }}>
									<Typography variant="h6">📋 Data Tables</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<ProvisionalBallotTable data={provisionalData || []} />
								</AccordionDetails>
							</Accordion>
						</Box>
					</TabPanel>
				)}

				{/* Active Voters Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={2}>
						<Box sx={{ p: 2 }}>
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

				{/* Voter Registration Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={3}>
						<Box sx={{ p: 2 }}>
							<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
								📊 Voter Registration Analysis
							</Typography>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">📈 Trends & Overview</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
										<VoterRegistrationLineChart
											selectedStates={[decodedStateName]}
										/>
										<RegisteredVotersDisplay stateName={decodedStateName} />
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">🗺️ Geographic Analysis</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: 3,
										}}>
										<Box sx={{ width: "100%" }}>
											<VoterRegistrationChoroplethMap
												stateName={decodedStateName}
											/>
										</Box>
										<Box sx={{ width: "100%" }}>
											<VoterRegistrationBubbleChart
												stateName={decodedStateName}
											/>
										</Box>
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">
										📋 Detailed Data & EAVS Regions
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: 3,
										}}>
										<Box sx={{ width: "100%" }}>
											<VoterRegistrationTable stateName={decodedStateName} />
										</Box>
										<Box sx={{ width: "100%" }}>
											<EAVSVotingRegionsMap stateName={decodedStateName} />
										</Box>
									</Box>
								</AccordionDetails>
							</Accordion>
						</Box>
					</TabPanel>
				)}

				{/* Equipment Analysis Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={4}>
						<Box sx={{ p: 2 }}>
							<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
								🖥️ Equipment Analysis
							</Typography>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">📊 Equipment Overview</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
										<EquipmentSummary
											data={equipmentData || []}
											stateName={decodedStateName}
										/>
										<StateEquipmentHistoryBarChart
											stateName={decodedStateName}
										/>
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">
										🗺️ Equipment Distribution & Age
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: 3,
										}}>
										<Box sx={{ width: "100%" }}>
											<VotingEquipmentChoroplethMap
												stateName={decodedStateName}
												data={equipmentData || []}
											/>
										</Box>
										<Box sx={{ width: "100%" }}>
											<VotingEquipmentAgeChoroplethMap
												stateName={decodedStateName}
											/>
										</Box>
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">
										📋 Regional Equipment Data
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<VotingEquipmentRegionalTable stateName={decodedStateName} />
								</AccordionDetails>
							</Accordion>
						</Box>
					</TabPanel>
				)}

				{/* Data Issues Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={5}>
						<Box sx={{ p: 2 }}>
							<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
								⚠️ Data Quality & Issues
							</Typography>

							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">📚 Pollbook Deletions</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
										<Box sx={{ width: "100%" }}>
											<PollbookDeletionBarChart
												data={pollbookDeletionData || []}
												stateName={decodedStateName}
											/>
										</Box>
										<Box sx={{ width: "100%" }}>
											<PollbookDeletionChoroplethMap
												stateName={decodedStateName}
												data={pollbookDeletionData || []}
											/>
										</Box>
										<PollbookDeletionTable data={pollbookDeletionData || []} />
									</Box>
								</AccordionDetails>
							</Accordion>

							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">
										✉️ Mail Ballot Rejections
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
										<Box sx={{ width: "100%", mb: 2 }}>
											<MailBallotRejectionBarChart
												data={mailBallotRejectionData || []}
											/>
										</Box>
										<Box sx={{ width: "100%", mt: 3 }}>
											<MailBallotRejectionChoroplethMap
												stateName={decodedStateName}
												data={mailBallotRejectionData || []}
											/>
										</Box>
										<MailBallotRejectionTable
											data={mailBallotRejectionData || []}
											stateName={decodedStateName}
										/>
									</Box>
								</AccordionDetails>
							</Accordion>
						</Box>
					</TabPanel>
				)}

				{/* Comparisons Tab */}
				<TabPanel value={tabValue} index={isDetail ? 6 : 1}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
							📈 National Comparisons
						</Typography>

						<Accordion defaultExpanded>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant="h6">🇺🇸 US Equipment Summary</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<USVotingEquipmentSummary />
							</AccordionDetails>
						</Accordion>

						<Accordion>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant="h6">🏛️ Party Comparison</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<PartyComparisonTable />
							</AccordionDetails>
						</Accordion>
					</Box>
				</TabPanel>
			</Paper>
		</Container>
	);
};

export default StateDetailPage;
