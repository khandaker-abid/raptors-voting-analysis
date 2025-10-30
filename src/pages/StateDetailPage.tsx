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
	Button,
	CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Core state helpers
import {
	stateData,
	getStateCenter,
	isDetailState,
	getDetailStateDescription,
} from "../data/stateData";
import { getCountyCount } from "../data/stateShapes";

// Existing datasets/components
import {
	getProvisionalBallotData,
	getProvisionalBallotCategories,
	getChoroplethData,
} from "../data/provisionalBallotData";
import { getActiveVotersData } from "../data/activeVotersData";
import StateMap from "../components/StateMap";
import ProvisionalBallotBarChart from "../charts/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../tables/ProvisionalBallotTable";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import ActiveVotersBarChart from "../charts/ActiveVotersBarChart";
import ActiveVotersTable from "../tables/ActiveVotersTable";
import ActiveVotersChoroplethMap from "../components/ActiveVotersChoroplethMap";
import StateVotingEquipmentTable from "../tables/StateVotingEquipmentTable";
import StateVoterRegistrationTable from "../tables/StateVoterRegistrationTable";
import VoterRegistrationChloroplethMap from "../components/VoterRegistrationChloroplethMap";

// NEW (GUI-8/9/16/18)
import {
	fetchPollbookDeletions,
	fetchMailRejections,
	fetchRegistrationTrends,
	fetchBlockBubbles,
	fetchEquipmentVsRejected,
	fetchDropboxBubbles,
} from "../data/api";
import { calculatePowerRegression } from "../utils/regression";
import PollbookDeletionsBarChart from "../charts/PollbookDeletionsBarChart";
import PollbookDeletionsTable from "../tables/PollbookDeletionsTable";
import MailRejectionsBarChart from "../charts/MailRejectionsBarChart";
import MailRejectionsTable from "../tables/MailRejectionsTable";
import PercentChoropleth from "../components/PercentChoropleth";
import VoterRegistrationTrendChart from "../charts/VoterRegistrationTrendChart";
import VoterRegistrationBubbleOverlay from "../components/VoterRegistrationBubbleOverlay";
// New imports for GUI-25 to GUI-27
import EquipmentRejectedBubbleChart from "../charts/EquipmentRejectedBubbleChart";
import ResetButton from "../components/ResetButton";

// New component imports for integration (GUI-10, GUI-19, GUI-24, GUI-27, GUI-28, GUI-29)
import RegisteredVotersList from "../components/RegisteredVotersList";
import VotingEquipmentTypeChoropleth from "../components/VotingEquipmentTypeChoropleth";
import DropboxBubbleChart from "../charts/DropboxBubbleChart";
import GinglesChart from "../charts/GinglesChart";
import EIEquipmentChart from "../charts/EIEquipmentChart";
import EIRejectedBallotsChart from "../charts/EIRejectedBallotsChart";
// Types
import type {
	PollbookDeletionRow,
	MailRejectionRow,
	RegistrationTrendPayload,
	BlockBubblePayload,
} from "../data/types";


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
			{...other}
		>
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

	// Check if this is a preclearance state (for VRA analysis)
	const isPreclearance = useMemo(() => {
		return decodedStateName === "Maryland";
	}, [decodedStateName]);

	// Check if this is a party state (Republican or Democratic dominated)
	const isPartyState = useMemo(() => {
		return decodedStateName === "Arkansas" || decodedStateName === "Maryland";
	}, [decodedStateName]);

	// Get provisional ballot data
	const provisionalData = useMemo(() => {
		return getProvisionalBallotData(decodedStateName);
	}, [decodedStateName]);

	// Get choropleth data (shared with Registration tab)
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

	// -------------------------------
	// GUI-8/9/16/18: data state + fetches
	// Use `undefined` = loading, `[]` = loaded but empty/error, plus error strings for alerts.
	// -------------------------------
	const [pollbookRows, setPollbookRows] = React.useState<
		PollbookDeletionRow[] | undefined
	>(undefined);
	const [pollbookErr, setPollbookErr] = React.useState<string | null>(null);

	const [mailRows, setMailRows] = React.useState<MailRejectionRow[] | undefined>(
		undefined
	);
	const [mailErr, setMailErr] = React.useState<string | null>(null);

	const [regTrends, setRegTrends] =
		React.useState<RegistrationTrendPayload | null>(null);

	const [blockBubbles, setBlockBubbles] =
		React.useState<BlockBubblePayload | null>(null);
	const [showBubbles, setShowBubbles] = React.useState(false);

	// State for RegisteredVotersList dialog (GUI-19)
	const [selectedRegion, setSelectedRegion] = React.useState<string | null>(null);

	// State for GUI-25: Equipment vs Rejected Ballots
	const [equipVsRejectedData, setEquipVsRejectedData] = React.useState<any[]>([]);
	const [equipVsRejectedLoading, setEquipVsRejectedLoading] = React.useState(false);

	// State for GUI-24: Dropbox Bubble Chart
	const [dropboxBubbleData, setDropboxBubbleData] = React.useState<any[]>([]);
	const [dropboxBubbleLoading, setDropboxBubbleLoading] = React.useState(false);

	React.useEffect(() => {
		if (!decodedStateName) return;

		// reset to loading on state change
		setPollbookRows(undefined);
		setMailRows(undefined);
		setPollbookErr(null);
		setMailErr(null);
		setRegTrends(null);
		setBlockBubbles(null);
		setShowBubbles(false);
		setEquipVsRejectedData([]);
		setEquipVsRejectedLoading(true);
		setDropboxBubbleData([]);
		setDropboxBubbleLoading(true);

		let alive = true;
		(async () => {
			try {
				const rows = await fetchPollbookDeletions(decodedStateName);
				if (alive) setPollbookRows(rows);
			} catch (e: any) {
				if (alive) {
					setPollbookErr(e?.message || "Failed to fetch pollbook deletions.");
					setPollbookRows([]); // stop infinite loading
				}
			}

			try {
				const rows = await fetchMailRejections(decodedStateName);
				if (alive) setMailRows(rows);
			} catch (e: any) {
				if (alive) {
					setMailErr(e?.message || "Failed to fetch mail rejections.");
					setMailRows([]); // stop infinite loading
				}
			}

			try {
				const trends = await fetchRegistrationTrends(decodedStateName);
				if (alive) setRegTrends(trends);
			} catch {
				if (alive) setRegTrends(null);
			}

			try {
				const bubbles = await fetchBlockBubbles(decodedStateName);
				if (alive) setBlockBubbles(bubbles);
			} catch {
				if (alive) setBlockBubbles(null);
			}

			// GUI-25: Fetch equipment vs rejected ballots
			try {
				const equipData = await fetchEquipmentVsRejected(decodedStateName);
				if (alive) {
					setEquipVsRejectedData(equipData);
					setEquipVsRejectedLoading(false);
				}
			} catch (e) {
				if (alive) {
					setEquipVsRejectedData([]);
					setEquipVsRejectedLoading(false);
				}
			}

			// GUI-24: Fetch dropbox bubble data (for Arkansas & Maryland)
			if (decodedStateName === "Arkansas" || decodedStateName === "Maryland") {
				try {
					const dropboxData = await fetchDropboxBubbles(decodedStateName);
					if (alive) {
						setDropboxBubbleData(dropboxData);
						setDropboxBubbleLoading(false);
					}
				} catch (e) {
					if (alive) {
						setDropboxBubbleData([]);
						setDropboxBubbleLoading(false);
					}
				}
			} else {
				if (alive) setDropboxBubbleLoading(false);
			}
		})();

		return () => {
			alive = false;
		};
	}, [decodedStateName]);

	if (!stateInfo) {
		return (
			<Box sx={{ py: 0, px: 0 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					State "{decodedStateName}" not found. Please select a valid state.
				</Alert>
			</Box>
		);
	}

	// Robust tab indexing
	let idx = 0;
	const IDX_OVERVIEW = idx++;
	const IDX_PROVISIONAL = isDetail ? idx++ : -1;
	const IDX_ACTIVE = isDetail ? idx++ : -1;
	const IDX_POLLBOOK = isDetail ? idx++ : -1;
	const IDX_MAIL = isDetail ? idx++ : -1;
	const IDX_EQUIPMENT = idx++;
	const IDX_EQUIPMENT_TYPES = isDetail ? idx++ : -1; // NEW - GUI-10
	const IDX_REG = isDetail ? idx++ : -1;
	const IDX_DROPBOX = isPartyState ? idx++ : -1; // NEW - GUI-24
	const IDX_GINGLES = isPreclearance ? idx++ : -1; // NEW - GUI-27
	const IDX_EI_EQUIPMENT = isPreclearance ? idx++ : -1; // NEW - GUI-28
	const IDX_EI_REJECTED = isPreclearance ? idx++ : -1; // NEW - GUI-29

	return (
		<Box sx={{ py: 0, px: 0, width: "100%", margin: 0 }}>
			{/* Organized Content with Category Groups */}
			<Paper sx={{ width: "100%", mb: 0 }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						aria-label="state data tabs">
						<Tab label="State Map" />
						{isDetail && <Tab label="Provisional Ballot" />}
						{isDetail && <Tab label="Active Voters" />}
						{isDetail && <Tab label="Pollbook Deletions" />}
						{isDetail && <Tab label="Mail Rejections" />}
						<Tab label="Voting Equipment" />
						{isDetail && <Tab label="Equipment Types" />}
						{isDetail && <Tab label="Voter Registration" />}
						{isPartyState && <Tab label="Drop Box Analysis" />}
						{isPreclearance && <Tab label="Gingles Analysis" />}
						{isPreclearance && <Tab label="EI Equipment" />}
						{isPreclearance && <Tab label="EI Rejected" />}
					</Tabs>
				</Box>

				{/* Overview Tab */}
				<TabPanel value={tabValue} index={IDX_OVERVIEW}>
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
												sx={{ mt: 1 }}
											>
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
				<TabPanel value={tabValue} index={4}>
					{(() => {
						// Calculate regression lines for equipment vs rejected
						const equipRegressionLines = React.useMemo(() => {
							if (equipVsRejectedData.length === 0) return [];

							// Separate data by party
							const demData = equipVsRejectedData.filter((d: any) => d.party === "D");
							const repData = equipVsRejectedData.filter((d: any) => d.party === "R");

							const lines = [];

							// Calculate regression for Democrats
							if (demData.length >= 3) {
								const demPoints = demData.map((d: any) => ({
									x: d.equipmentQuality,
									y: d.rejectedPct,
								}));
								const demRegression = calculatePowerRegression(demPoints);
								if (demRegression) {
									lines.push({
										party: "D" as const,
										coefficients: { a: demRegression.a, b: demRegression.b },
									});
								}
							}

							// Calculate regression for Republicans
							if (repData.length >= 3) {
								const repPoints = repData.map((d: any) => ({
									x: d.equipmentQuality,
									y: d.rejectedPct,
								}));
								const repRegression = calculatePowerRegression(repPoints);
								if (repRegression) {
									lines.push({
										party: "R" as const,
										coefficients: { a: repRegression.a, b: repRegression.b },
									});
								}
							}

							return lines;
						}, [equipVsRejectedData]);

						return (
							<>
								{equipVsRejectedLoading && (
									<Box display="flex" justifyContent="center" p={4}>
										<CircularProgress />
									</Box>
								)}
								{!equipVsRejectedLoading && equipVsRejectedData.length === 0 && (
									<Alert severity="info">
										No equipment vs rejected ballot data available for this state.
									</Alert>
								)}
								{!equipVsRejectedLoading && equipVsRejectedData.length > 0 && (
									<EquipmentRejectedBubbleChart
										data={equipVsRejectedData}
										regressionLines={equipRegressionLines}
									/>
								)}
							</>
						);
					})()}
				</TabPanel>
				{/* Provisional Ballots Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_PROVISIONAL}>
						<Box sx={{ p: 0 }}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									mb: 4,
								}}
							>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}
								>
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
									}}
								>
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
				{/* Active Voters Tab (keeps your teammate's layout; no scrolling) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_ACTIVE}>
						<Box sx={{ p: 0 }}>
							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="h6">Charts & Maps</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Box
										sx={{
											display: "flex",
											gap: 2,
											flexDirection: { xs: "column", md: "row" },
											alignItems: "stretch",
											justifyContent: "space-between",
										}}
									>
										<Box
											sx={{
												flex: 1,
												minWidth: { xs: "100%", md: "calc(50% - 8px)" },
												maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											}}
										>
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
											}}
										>
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
									<Typography variant="h6">Data Table</Typography>
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

				{/* Pollbook Deletions Tab (GUI-8) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_POLLBOOK}>
						{pollbookRows === undefined ? (
							<Alert severity="info">Loading pollbook deletions…</Alert>
						) : pollbookErr ? (
							<Alert severity="warning">{pollbookErr}</Alert>
						) : pollbookRows.length === 0 ? (
							<Alert severity="warning">No pollbook deletions found for 2024.</Alert>
						) : (
							<>
								<Box display="flex" gap={2} flexDirection={{ xs: "column", md: "row" }}>
									<Box sx={{ flex: 1 }}>
										<PollbookDeletionsBarChart
											stateName={decodedStateName}
											data={pollbookRows}
										/>
									</Box>
									<Box sx={{ flex: 1 }}>
										<PercentChoropleth
											stateName={decodedStateName}
											data={pollbookRows.map((r) => ({
												geographicUnit: r.geographicUnit,
												percentOfTotal: r.deletionPercentage,
											}))}
										/>
									</Box>
								</Box>
								<Box sx={{ mt: 2 }}>
									<PollbookDeletionsTable data={pollbookRows} />
								</Box>
							</>
						)}
					</TabPanel>
				)}

				{/* Mail Rejections Tab (GUI-9) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_MAIL}>
						{mailRows === undefined ? (
							<Alert severity="info">Loading mail rejections…</Alert>
						) : mailErr ? (
							<Alert severity="warning">{mailErr}</Alert>
						) : mailRows.length === 0 ? (
							<Alert severity="warning">No mail ballot rejections found for 2024.</Alert>
						) : (
							<>
								<Box display="flex" gap={2} flexDirection={{ xs: "column", md: "row" }}>
									<Box sx={{ flex: 1 }}>
										<MailRejectionsBarChart
											stateName={decodedStateName}
											data={mailRows}
										/>
									</Box>
									<Box sx={{ flex: 1 }}>
										<PercentChoropleth
											stateName={decodedStateName}
											data={mailRows.map((r) => ({
												geographicUnit: r.geographicUnit,
												percentOfTotal: r.rejectionPercentage,
											}))}
										/>
									</Box>
								</Box>
								<Box sx={{ mt: 2 }}>
									<MailRejectionsTable data={mailRows} />
								</Box>
							</>
						)}
					</TabPanel>
				)}

				{/* Voting Equipment Tab */}
				<TabPanel value={tabValue} index={IDX_EQUIPMENT}>
					<Box sx={{ p: 0 }}>
						<StateVotingEquipmentTable stateName={stateName ? stateName : ""} />
					</Box>
				</TabPanel>

				{/* Voter Registration Data Tab (GUI-16 & GUI-18) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_REG}>
						<Box sx={{ p: 0 }}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									mb: 4,
								}}
							>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}
								>
									<StateVoterRegistrationTable
										stateName={stateName ? stateName : ""}
									/>
								</Box>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
									}}
								>
									{/* Default map; bubble overlay toggled below if available */}
									<VoterRegistrationChloroplethMap
										stateName={decodedStateName}
										data={choroplethData || []}
									/>
								</Box>
							</Box>

							{/* Trends (2016/2020/2024) */}
							{regTrends && (
								<Box sx={{ my: 3 }}>
									<VoterRegistrationTrendChart trends={regTrends} />
								</Box>
							)}

							{/* Action buttons for Registration tab */}
							<Box sx={{ my: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
								{/* View Registered Voters button (GUI-19) */}
								<Button
									variant="contained"
									color="primary"
									onClick={() => setSelectedRegion(decodedStateName)}
								>
									View Registered Voters
								</Button>

								{/* Bubble overlay toggle (only if payload present) */}
								{blockBubbles && (
									<Button
										variant="outlined"
										onClick={() => setShowBubbles((s) => !s)}
									>
										{showBubbles ? "Hide" : "Show"} Party Bubble Overlay
									</Button>
								)}
							</Box>

							{/* Bubble overlay map (only if toggled on) */}
							{showBubbles && blockBubbles && (
								<Box sx={{ mt: 2 }}>
									<VoterRegistrationBubbleOverlay
										stateName={decodedStateName}
										payload={blockBubbles}
									/>
								</Box>
							)}
						</Box>
					</TabPanel>
				)}

				{/* NEW: Equipment Types Tab - GUI-10 */}
				{isDetail && IDX_EQUIPMENT_TYPES >= 0 && (
					<TabPanel value={tabValue} index={IDX_EQUIPMENT_TYPES}>
						<Box sx={{ p: 3 }}>
							<Alert severity="info" sx={{ mb: 3 }}>
								This map shows voting equipment types by county. Different colors
								represent different equipment types used for voting.
							</Alert>
							<VotingEquipmentTypeChoropleth
								stateName={decodedStateName}
								data={[]}
							/>
							{/* Color Legend */}
							<Box sx={{ mt: 2, p: 2, bgcolor: "background.paper" }}>
								<Typography variant="subtitle2" gutterBottom>
									Equipment Type Legend:
								</Typography>
								<Box display="flex" gap={2} flexWrap="wrap">
									<Box display="flex" alignItems="center" gap={1}>
										<Box sx={{ width: 20, height: 20, bgcolor: "#1976d2" }} />
										<Typography variant="body2">Optical Scan</Typography>
									</Box>
									<Box display="flex" alignItems="center" gap={1}>
										<Box sx={{ width: 20, height: 20, bgcolor: "#dc004e" }} />
										<Typography variant="body2">DRE</Typography>
									</Box>
									<Box display="flex" alignItems="center" gap={1}>
										<Box sx={{ width: 20, height: 20, bgcolor: "#ff9800" }} />
										<Typography variant="body2">BMD</Typography>
									</Box>
									<Box display="flex" alignItems="center" gap={1}>
										<Box sx={{ width: 20, height: 20, bgcolor: "#4caf50" }} />
										<Typography variant="body2">Paper Ballot</Typography>
									</Box>
									<Box display="flex" alignItems="center" gap={1}>
										<Box sx={{ width: 20, height: 20, bgcolor: "#9c27b0" }} />
										<Typography variant="body2">Mixed</Typography>
									</Box>
								</Box>
							</Box>
						</Box>
					</TabPanel>
				)}

				{/* NEW: Drop Box Analysis Tab - GUI-24 (Arkansas & Maryland) */}
				{isPartyState && IDX_DROPBOX >= 0 && (
					<TabPanel value={tabValue} index={IDX_DROPBOX}>
						<Box sx={{ p: 3 }}>
							<Alert severity="info" sx={{ mb: 3 }}>
								<strong>Drop Box Voting Analysis</strong> - This bubble chart shows
								the relationship between Republican vote percentage and drop box
								voting usage in each county. Each bubble represents one county,
								colored red for Republican majority or blue for Democratic majority.
							</Alert>
							{dropboxBubbleLoading ? (
								<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
									<CircularProgress />
								</Box>
							) : (
								<DropboxBubbleChart
									data={dropboxBubbleData}
									stateName={decodedStateName}
								/>
							)}
						</Box>
					</TabPanel>
				)}

				{/* NEW: Gingles Analysis Tab - GUI-27 (Maryland only) */}
				{isPreclearance && IDX_GINGLES >= 0 && (
					<TabPanel value={tabValue} index={IDX_GINGLES}>
						<Box sx={{ p: 3 }}>
							<Alert severity="info" sx={{ mb: 3 }}>
								<strong>Gingles Analysis</strong> - This chart shows the three
								preconditions for vote dilution under the Voting Rights Act:
								<br />
								1. Minority group is sufficiently large and geographically compact
								<br />
								2. Minority group is politically cohesive
								<br />
								3. Majority votes as a bloc to usually defeat minority-preferred
								candidates
							</Alert>
							<GinglesChart
								stateName={decodedStateName}
								data={[]}
							/>
						</Box>
					</TabPanel>
				)}

				{/* NEW: EI Equipment Tab - GUI-28 (Maryland only) */}
				{isPreclearance && IDX_EI_EQUIPMENT >= 0 && (
					<TabPanel value={tabValue} index={IDX_EI_EQUIPMENT}>
						<Box sx={{ p: 3 }}>
							<Alert severity="info" sx={{ mb: 3 }}>
								<strong>Ecological Inference - Equipment Quality</strong> - This
								analysis examines whether different demographic groups have equal
								access to high-quality voting equipment. The probability curves
								show the distribution of equipment quality scores across
								demographics.
							</Alert>
							<EIEquipmentChart stateName={decodedStateName} />
						</Box>
					</TabPanel>
				)}

				{/* NEW: EI Rejected Ballots Tab - GUI-29 (Maryland only) */}
				{isPreclearance && IDX_EI_REJECTED >= 0 && (
					<TabPanel value={tabValue} index={IDX_EI_REJECTED}>
						<Box sx={{ p: 3 }}>
							<Alert severity="warning" sx={{ mb: 3 }}>
								<strong>Ecological Inference - Ballot Rejections</strong> - This
								analysis examines whether ballot rejection rates differ across
								demographic groups. Higher rejection rates for certain groups may
								indicate barriers to voting.
							</Alert>
							<EIRejectedBallotsChart stateName={decodedStateName} />
						</Box>
					</TabPanel>
				)}

				{/* RegisteredVotersList Dialog - GUI-19 */}
				{selectedRegion && (
					<RegisteredVotersList
						open={!!selectedRegion}
						stateName={decodedStateName}
						geographicUnit={selectedRegion}
						onClose={() => setSelectedRegion(null)}
					/>
				)}
			</Paper>
			<ResetButton />
		</Box>
	);
};

export default StateDetailPage;
