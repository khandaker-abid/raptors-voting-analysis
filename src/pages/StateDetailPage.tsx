import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
	Typography,
	Box,
	Paper,
	Tabs,
	Tab,
	Alert,
	Button,
	CircularProgress,
} from "@mui/material";

// Core state helpers
import {
	stateData,
	getStateCenter,
	isDetailState,
} from "../data/stateData";
import { getCountyCount } from "../data/stateShapes";

// Existing datasets/components
import {
	getProvisionalBallotData,
	getProvisionalBallotCategories,
	getChoroplethData,
} from "../data/provisionalBallotData";
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
	fetchActiveVoters,
	fetchPollbookDeletions,
	fetchMailRejections,
	fetchRegistrationTrends,
	fetchBlockBubbles,
	fetchDropboxBubbles,
} from "../data/api";
import PollbookDeletionsBarChart from "../charts/PollbookDeletionsBarChart";
import PollbookDeletionsTable from "../tables/PollbookDeletionsTable";
import MailRejectionsBarChart from "../charts/MailRejectionsBarChart";
import MailRejectionsTable from "../tables/MailRejectionsTable";
import PercentChoropleth from "../components/PercentChoropleth";
import VoterRegistrationTrendChart from "../charts/VoterRegistrationTrendChart";
import VoterRegistrationBubbleOverlay from "../components/VoterRegistrationBubbleOverlay";
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
	ActiveVotersRow,
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

	// State for active voters data - will be fetched from API
	const [activeVotersData, setActiveVotersData] = React.useState<
		ActiveVotersRow[] | undefined
	>(undefined);
	const [activeVotersErr, setActiveVotersErr] = React.useState<string | null>(null);

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

	// State for GUI-24: Dropbox Bubble Chart
	const [dropboxBubbleData, setDropboxBubbleData] = React.useState<any[]>([]);
	const [dropboxBubbleLoading, setDropboxBubbleLoading] = React.useState(false);

	React.useEffect(() => {
		if (!decodedStateName) return;

		// reset to loading on state change
		setActiveVotersData(undefined);
		setActiveVotersErr(null);
		setPollbookRows(undefined);
		setMailRows(undefined);
		setPollbookErr(null);
		setMailErr(null);
		setRegTrends(null);
		setBlockBubbles(null);
		setShowBubbles(false);
		setDropboxBubbleData([]);
		setDropboxBubbleLoading(true);

		let alive = true;
		(async () => {
			// Fetch active voters data for detail states
			if (isDetail) {
				try {
					const rows = await fetchActiveVoters(decodedStateName);
					if (alive) setActiveVotersData(rows);
				} catch (e: any) {
					if (alive) {
						setActiveVotersErr(e?.message || "Failed to fetch active voters.");
						setActiveVotersData([]); // stop infinite loading
					}
				}
			}

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
	}, [decodedStateName, isDetail]);

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
		<Box sx={{ py: 0, px: 0, width: "100%", margin: 0, height: "100%" }}>
			{/* Organized Content with Category Groups */}
			<Paper sx={{ width: "100%", mb: 0, height: "100%" }}>
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
					<Box sx={{ p: 0, height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
						{/* Top Section: State Info Cards - Inline and Ultra Compact */}
						<Box sx={{ display: "flex", gap: 1, flexWrap: "nowrap", flexShrink: 0, mb: 0, px: 0.5, py: 0.5, bgcolor: "background.paper" }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
									State Type:
								</Typography>
								<Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
									{isDetail ? "Detailed Analysis" : "EAVS State"}
								</Typography>
							</Box>
							{stateInfo.cvapPercentage && (
								<>
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>|</Typography>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
											CVAP:
										</Typography>
										<Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
											{stateInfo.cvapPercentage}%
										</Typography>
									</Box>
								</>
							)}
							{isDetail && (
								<>
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>|</Typography>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
											Counties/Towns:
										</Typography>
										<Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
											{getCountyCount(decodedStateName)}
										</Typography>
									</Box>
								</>
							)}
						</Box>

						{/* Main Layout: Map + Data Visualization */}
						<Box
							sx={{
								display: "flex",
								gap: 0.5,
								flexDirection: { xs: "column", lg: "row" },
								alignItems: "stretch",
								flex: 1,
								minHeight: 0,
								height: "100%",
								overflow: "hidden",
								px: 0.5,
								pb: 0.5,
							}}
						>
							{/* Left Side: Map - Give it MUCH more space */}
							<Box sx={{
								flex: 7,
								minWidth: { xs: "100%", lg: "70%" },
								display: "flex",
								minHeight: 0,
								height: "100%",
							}}>
								<StateMap
									stateName={decodedStateName}
									center={stateCenter}
									isDetailState={isDetail}
								/>
							</Box>

							{/* Right Side: EAVS Data Visualization - Smaller sidebar */}
							<Box sx={{ flex: 3, minWidth: { xs: "100%", lg: "28%" }, display: "flex", minHeight: 0 }}>
								{isDetail ? (
									<Paper elevation={2} sx={{ p: 2, height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
										<Typography variant="h5" sx={{ mb: 1, fontSize: "1.15rem", fontWeight: 600 }}>
											EAVS Data Summary
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, fontSize: "0.9rem", lineHeight: 1.45 }}>
											Comprehensive EAVS data available
										</Typography>

										{/* Quick Stats */}
										<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, overflow: "auto" }}>
											{provisionalData && provisionalData.length > 0 && (
												<Paper variant="outlined" sx={{ p: 1.25, bgcolor: "rgba(25, 118, 210, 0.08)" }}>
													<Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
														Provisional Ballots (2024)
													</Typography>
													<Typography variant="h4" sx={{ my: 0.75, fontSize: "1.75rem", fontWeight: 700 }}>
														{provisionalData.reduce((sum, d) => sum + (d.E1a || 0), 0).toLocaleString()}
													</Typography>
													<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
														Total across all units
													</Typography>
												</Paper>
											)}
											{activeVotersData && activeVotersData.length > 0 && !activeVotersErr && (
												<Paper variant="outlined" sx={{ p: 1.25, bgcolor: "rgba(46, 125, 50, 0.08)" }}>
													<Typography variant="subtitle2" color="success.dark" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
														Active Registered Voters
													</Typography>
													<Typography variant="h4" sx={{ my: 0.75, fontSize: "1.75rem", fontWeight: 700 }}>
														{activeVotersData.reduce((sum, d) => sum + (d.activeVoters || 0), 0).toLocaleString()}
													</Typography>
													<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
														Currently active
													</Typography>
												</Paper>
											)}

											<Alert severity="info" icon={false} sx={{ py: 1, px: 1.25 }}>
												<Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: "0.85rem", display: "block", mb: 0.75 }}>
													Available Data:
												</Typography>
												<Typography variant="body2" component="div" sx={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
													• Provisional Ballots<br />
													• Active/Inactive Voters<br />
													• Pollbook Deletions<br />
													• Mail Ballot Rejections<br />
													• Voting Equipment<br />
													• Equipment Types<br />
													{isDetail && "• Voter Registration"}
													{isPartyState && <><br />• Drop Box Analysis</>}
													{isPreclearance && <><br />• VRA/Gingles Analysis<br />• Ecological Inference</>}
												</Typography>
											</Alert>
										</Box>
									</Paper>
								) : (
									<Paper elevation={2} sx={{ p: 2, height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
										<Typography variant="h5" gutterBottom textAlign="center" sx={{ fontSize: "1.15rem", mb: 1.25 }}>
											EAVS State Data
										</Typography>
										<Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1.75, fontSize: "0.95rem" }}>
											Basic EAVS data available
										</Typography>

										<Alert severity="info" sx={{ mb: 1.5, py: 1, px: 1.5 }}>
											<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.75, fontSize: "0.9rem" }}>
												Available:
											</Typography>
											<Typography variant="body2" sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
												• State voting equipment<br />
												• Basic EAVS statistics<br />
												• Equipment history
											</Typography>
										</Alert>

										<Alert severity="warning" sx={{ py: 1, px: 1.5 }}>
											<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.75, fontSize: "0.9rem" }}>
												Enhanced for RI, MD, AR:
											</Typography>
											<Typography variant="body2" sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
												• County boundaries<br />
												• Full voter registration<br />
												• Demographics
											</Typography>
										</Alert>
									</Paper>
								)}
							</Box>
						</Box>
					</Box>
				</TabPanel>

				{/* Provisional Ballots Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_PROVISIONAL}>
						<Box sx={{
							p: 0,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: "calc(100vh - 280px)",
						}}>
							<Box
								sx={{
									display: "flex",
									gap: 1.5,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									height: { xs: "auto", md: "420px" },
									flexShrink: 0,
								}}
							>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
										height: "100%",
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
										height: "100%",
									}}
								>
									<ProvisionalBallotChoroplethMap
										stateName={decodedStateName}
										data={choroplethData || []}
									/>
								</Box>
							</Box>

							<Box sx={{ flex: 1, display: "flex" }}>
								<ProvisionalBallotTable data={provisionalData || []} />
							</Box>
						</Box>
					</TabPanel>
				)}
				{/* Active Voters Tab - Matching Provisional Ballot layout */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_ACTIVE}>
						<Box sx={{
							p: 0,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: "calc(100vh - 280px)",
						}}>
							<Box
								sx={{
									display: "flex",
									gap: 1.5,
									flexDirection: { xs: "column", md: "row" },
									alignItems: "stretch",
									justifyContent: "space-between",
									height: { xs: "auto", md: "420px" },
									flexShrink: 0,
								}}
							>
								<Box
									sx={{
										flex: 1,
										minWidth: { xs: "100%", md: "calc(50% - 8px)" },
										maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
										height: "100%",
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
										height: "100%",
									}}
								>
									<ActiveVotersChoroplethMap
										stateName={decodedStateName}
										data={activeVotersData || []}
									/>
								</Box>
							</Box>

							<Box sx={{ flex: 1, display: "flex" }}>
								<ActiveVotersTable data={activeVotersData || []} stateName={decodedStateName} />
							</Box>
						</Box>
					</TabPanel>
				)}

				{/* Pollbook Deletions Tab (GUI-8) - Matching Active Voters layout */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_POLLBOOK}>
						{pollbookRows === undefined ? (
							<Alert severity="info">Loading pollbook deletions…</Alert>
						) : pollbookErr ? (
							<Alert severity="warning">{pollbookErr}</Alert>
						) : pollbookRows.length === 0 ? (
							<Alert severity="warning">
								No pollbook deletions data available. Please ensure the preprocessing scripts have been run to populate the EAVS database.
							</Alert>
						) : (
							<Box
								sx={{
									p: 0,
									display: "flex",
									flexDirection: "column",
									gap: 1.5,
									minHeight: "calc(100vh - 280px)",
								}}
							>
								{pollbookRows[0]?.dataYear && pollbookRows[0].dataYear !== 2024 && (
									<Alert severity="info">
										Note: Displaying {pollbookRows[0].dataYear} data (2024 data not available)
									</Alert>
								)}
								<Box
									sx={{
										display: "flex",
										gap: 1.5,
										flexDirection: { xs: "column", md: "row" },
										alignItems: "stretch",
										justifyContent: "space-between",
										height: { xs: "auto", md: "420px" },
										flexShrink: 0,
									}}
								>
									<Box
										sx={{
											flex: 1,
											minWidth: { xs: "100%", md: "calc(50% - 8px)" },
											maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											height: "100%",
										}}
									>
										<PollbookDeletionsBarChart
											stateName={decodedStateName}
											data={pollbookRows}
										/>
									</Box>
									<Box
										sx={{
											flex: 1,
											minWidth: { xs: "100%", md: "calc(50% - 8px)" },
											maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											height: "100%",
										}}
									>
										<PercentChoropleth
											stateName={decodedStateName}
											data={pollbookRows.map((r) => ({
												geographicUnit: r.geographicUnit,
												percentOfTotal: r.deletionPercentage ?? 0,
											}))}
										/>
									</Box>
								</Box>

								<Box sx={{ flex: 1, display: "flex" }}>
									<PollbookDeletionsTable data={pollbookRows} />
								</Box>
							</Box>
						)}
					</TabPanel>
				)}

				{/* Mail Rejections Tab (GUI-9) - Matching Active Voters layout */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_MAIL}>
						{mailRows === undefined ? (
							<Alert severity="info">Loading mail rejections…</Alert>
						) : mailErr ? (
							<Alert severity="warning">{mailErr}</Alert>
						) : mailRows.length === 0 ? (
							<Alert severity="warning">
								No mail ballot rejections data available. Please ensure the preprocessing scripts have been run to populate the EAVS database.
							</Alert>
						) : (
							<Box sx={{
								p: 0,
								display: "flex",
								flexDirection: "column",
								gap: 1.5,
								minHeight: "calc(100vh - 280px)",
							}}>
								{mailRows[0]?.dataYear && mailRows[0].dataYear !== 2024 && (
									<Alert severity="info">
										Note: Displaying {mailRows[0].dataYear} data (2024 data not available)
									</Alert>
								)}
								<Box
									sx={{
										display: "flex",
										gap: 1.5,
										flexDirection: { xs: "column", md: "row" },
										alignItems: "stretch",
										justifyContent: "space-between",
										height: { xs: "auto", md: "420px" },
										flexShrink: 0,
									}}
								>
									<Box
										sx={{
											flex: 1,
											minWidth: { xs: "100%", md: "calc(50% - 8px)" },
											maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											height: "100%",
										}}
									>
										<MailRejectionsBarChart
											stateName={decodedStateName}
											data={mailRows}
										/>
									</Box>
									<Box
										sx={{
											flex: 1,
											minWidth: { xs: "100%", md: "calc(50% - 8px)" },
											maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
											height: "100%",
										}}
									>
										<PercentChoropleth
											stateName={decodedStateName}
											data={mailRows.map((r) => ({
												geographicUnit: r.geographicUnit,
												percentOfTotal: r.rejectionPercentage,
											}))}
											title="Mail Ballot Rejections Distribution"
											description="Interactive choropleth map showing mail ballot rejection distribution across counties. Hover over counties for detailed information."
										/>
									</Box>
								</Box>

								<Box sx={{ flex: 1, display: "flex" }}>
									<MailRejectionsTable data={mailRows} />
								</Box>
							</Box>
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
								geoJsonData={undefined}
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
									regressionLines={[]}
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
								democraticRegression={undefined}
								republicanRegression={undefined}
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
