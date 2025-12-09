import React, { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	Typography,
	Box,
	Paper,
	Alert,
	Button,
	CircularProgress,
	Select,
	MenuItem,
	FormControl,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResetButton from "../components/ResetButton";

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
} from "../data/provisionalBallotData";
import StateMap from "../components/StateMap";
import ProvisionalBallotTab from "./ProvisionalBallotTab";
import ActiveVoterTab from "./ActiveVoterTab";
import StateVoterRegistrationTable from "../tables/StateVoterRegistrationTable";
import VoterRegistrationChloroplethMap from "../components/VoterRegistrationChloroplethMap";

// NEW (GUI-8/9/16/18) - Note: pollbook/mail fetches handled by Tab components
import {
	fetchRegistrationTrends,
	fetchBlockBubbles,
	fetchDropboxBubbles,
	fetchStateRegisteredVoters,
	fetchGinglesData,
} from "../data/api";
import VoterRegistrationTrendChart from "../charts/VoterRegistrationTrendChart";
import VoterRegistrationBarChart from "../charts/VoterRegistrationBarChart";
import VoterRegistrationBubbleOverlay from "../components/VoterRegistrationBubbleOverlay";

// New component imports for integration (GUI-10, GUI-19, GUI-24, GUI-27, GUI-28, GUI-29)
import RegisteredVotersList from "../components/RegisteredVotersList";
import DropboxBubbleChart from "../charts/DropboxBubbleChart";
import GinglesChart from "../charts/GinglesChart";
import EIEquipmentChart from "../charts/EIEquipmentChart";
import EIRejectedBallotsChart from "../charts/EIRejectedBallotsChart";
// Types - Note: PollbookDeletionRow/MailRejectionRow used by Tab components
import type {
	ActiveVotersRow,
	RegistrationTrendPayload,
	BlockBubblePayload,
} from "../data/types";
import PollbookDeletionsTab from "./PollbookDeletionsTab";
import MailRejectionsTab from "./MailRejectionsTab";
import VotingEquipmentTab from "./VotingEquipmentTab";

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
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	// List of all three detailed states
	const DETAILED_STATES = ["Arkansas", "Maryland", "Rhode Island"];

	// Get tab value from URL search params - reacts to URL changes
	const tabValue = useMemo(() => {
		const tabParam = searchParams.get('tab');
		return tabParam ? parseInt(tabParam, 10) : 0;
	}, [searchParams]);

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
	// GUI-27, GUI-28, GUI-29: Maryland only (preclearance state)
	const isPreclearance = useMemo(() => {
		return decodedStateName === "Maryland";
	}, [decodedStateName]);

	// Check if this is a party state (Republican or Democratic dominated)
	// All three detailed states can support party analysis
	const isPartyState = useMemo(() => {
		return isDetail && stateInfo?.party !== undefined;
	}, [decodedStateName, isDetail, stateInfo]);

	// Get provisional ballot data
	const provisionalData = useMemo(() => {
		return getProvisionalBallotData(decodedStateName);
	}, [decodedStateName]);

	// State for active voters data - will be fetched from API
	const [activeVotersData, setActiveVotersData] = React.useState<
		ActiveVotersRow[] | undefined
	>(undefined);
	const [activeVotersErr, setActiveVotersErr] = React.useState<string | null>(null);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		// Update URL with new tab value - tabValue is derived from searchParams
		setSearchParams({ tab: newValue.toString() });
	};

	// -------------------------------
	// GUI-8/9/16/18: data state + fetches
	// Use `undefined` = loading, `[]` = loaded but empty/error, plus error strings for alerts.
	// Note: pollbook/mail data now fetched directly by their Tab components
	// -------------------------------

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

	// State for GUI-17: Voter Registration Data
	const [voterRegistrationData, setVoterRegistrationData] = React.useState<any[]>([]);

	// State for GUI-27: Gingles Analysis
	const [ginglesData, setGinglesData] = React.useState<any>(null);
	const [ginglesLoading, setGinglesLoading] = React.useState(false);
	const [ginglesError, setGinglesError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!decodedStateName) return;

		// reset to loading on state change
		setActiveVotersData(undefined);
		setActiveVotersErr(null);
		// Note: pollbook/mail data reset handled by their respective Tab components
		setRegTrends(null);
		setBlockBubbles(null);
		setShowBubbles(false);
		setDropboxBubbleData([]);
		setDropboxBubbleLoading(true);
		setVoterRegistrationData([]); let alive = true;
		(async () => {
			// Note: pollbook/mail data fetched by their respective Tab components

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

			// GUI-24: Fetch dropbox bubble data (for all party-affiliated detailed states)
			if (isDetail && stateInfo?.party !== undefined) {
				try {
					const dropboxData = await fetchDropboxBubbles(decodedStateName);
					if (alive) {
						setDropboxBubbleData(dropboxData);
						setDropboxBubbleLoading(false);
					}
				} catch {
					if (alive) {
						setDropboxBubbleData([]);
						setDropboxBubbleLoading(false);
					}
				}
			} else {
				if (alive) setDropboxBubbleLoading(false);
			}

			// GUI-17: Fetch voter registration data (for detailed states)
			if (isDetail) {
				try {
					const regData = await fetchStateRegisteredVoters(decodedStateName);
					if (alive) setVoterRegistrationData(regData);
				} catch {
					if (alive) setVoterRegistrationData([]);
				}
			}

			// GUI-27: Fetch Gingles analysis data (for preclearance states: MD, AR, RI)
			if (["Maryland", "Arkansas", "Rhode Island"].includes(decodedStateName)) {
				setGinglesLoading(true);
				try {
					const gingles = await fetchGinglesData(decodedStateName, "white");
					if (alive) {
						setGinglesData(gingles);
						setGinglesLoading(false);
						setGinglesError(null);
					}
				} catch (err: unknown) {
					if (alive) {
						const message = err instanceof Error ? err.message : "Failed to fetch Gingles data.";
						setGinglesError(message);
						setGinglesData(null);
						setGinglesLoading(false);
					}
				}
			}
		})();

		return () => {
			alive = false;
		};
	}, [decodedStateName, isDetail, stateInfo]);

	if (!stateInfo) {
		return (
			<Box sx={{ py: 0, px: 0 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					State "{decodedStateName}" not found. Please select a valid state.
				</Alert>
			</Box>
		);
	}

	// Robust tab indexing and labels
	let idx = 0;
	const IDX_OVERVIEW = idx++;
	const IDX_PROVISIONAL = isDetail ? idx++ : -1;
	const IDX_ACTIVE = isDetail ? idx++ : -1;
	const IDX_POLLBOOK = isDetail ? idx++ : -1;
	const IDX_MAIL = isDetail ? idx++ : -1;
	const IDX_EQUIPMENT = idx++;
	const IDX_REG = isDetail ? idx++ : -1;
	const IDX_DROPBOX = isPartyState ? idx++ : -1; // NEW - GUI-24
	const IDX_GINGLES = isPreclearance ? idx++ : -1; // NEW - GUI-27
	const IDX_EI_EQUIPMENT = isPreclearance ? idx++ : -1; // NEW - GUI-28
	const IDX_EI_REJECTED = isPreclearance ? idx++ : -1; // NEW - GUI-29

	// Build tabs array for dropdown selector
	const tabOptions: Array<{ index: number; label: string }> = [];
	tabOptions.push({ index: IDX_OVERVIEW, label: "Overview" });
	if (isDetail) tabOptions.push({ index: IDX_PROVISIONAL, label: "Provisional Ballot" });
	if (isDetail) tabOptions.push({ index: IDX_ACTIVE, label: "Active Voters" });
	if (isDetail) tabOptions.push({ index: IDX_POLLBOOK, label: "Pollbook Deletions" });
	if (isDetail) tabOptions.push({ index: IDX_MAIL, label: "Mail Rejections" });
	tabOptions.push({ index: IDX_EQUIPMENT, label: "Voting Equipment" });
	if (isDetail) tabOptions.push({ index: IDX_REG, label: "Voter Registration" });
	if (isPartyState) tabOptions.push({ index: IDX_DROPBOX, label: "Drop Box Analysis" });
	if (isPreclearance) tabOptions.push({ index: IDX_GINGLES, label: "Gingles Analysis" });
	if (isPreclearance) tabOptions.push({ index: IDX_EI_EQUIPMENT, label: "EI Equipment" });
	if (isPreclearance) tabOptions.push({ index: IDX_EI_REJECTED, label: "EI Rejected" });

	return (
		<Box sx={{ py: 0, px: 0, width: "100%", margin: 0, height: "100%" }}>
			{/* Organized Content with Category Groups */}
			<Paper sx={{ width: "100%", mb: 0, height: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", p: 0.75 }}>
					{/* Left side: State selector dropdown */}
					<FormControl size="small" sx={{ minWidth: 160, '& .MuiInputBase-root': { height: 32 } }}>
						<Select
							value={decodedStateName}
							onChange={(e) => {
								const newState = e.target.value;
								// Check if current tab is Maryland-only (EI Equipment/Rejected, Gingles)
								// If switching to non-Maryland state, redirect to Overview tab
								if (newState !== "Maryland" && (tabValue === IDX_EI_EQUIPMENT || tabValue === IDX_EI_REJECTED || tabValue === IDX_GINGLES)) {
									navigate(`/state/${encodeURIComponent(newState)}?tab=0`);
								} else {
									navigate(`/state/${encodeURIComponent(newState)}?tab=${tabValue}`);
								}
							}}
							sx={{ fontWeight: 700, fontSize: "0.95rem" }}
						>
							{DETAILED_STATES.map((state) => (
								<MenuItem key={state} value={state} sx={{ fontSize: "0.95rem" }}>
									{state}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* Right side: Home button, Tab dropdown, Reset button */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon fontSize="small" />}
							onClick={() => navigate("/")}
							sx={{
								minWidth: 80,
								textTransform: "none",
								fontWeight: 600,
								fontSize: "0.85rem",
								py: 0.5,
							}}
						>
							Home
						</Button>
						<FormControl size="small" sx={{ minWidth: 160, '& .MuiInputBase-root': { height: 32 } }}>
							<Select
								value={tabValue}
								onChange={(e) => handleTabChange({} as React.SyntheticEvent, e.target.value as number)}
								sx={{ fontWeight: 700, fontSize: "0.85rem" }}
							>
								{tabOptions.map((tab) => (
									<MenuItem key={tab.index} value={tab.index} sx={{ fontSize: "0.85rem" }}>
										{tab.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<ResetButton />
					</Box>
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
						<ProvisionalBallotTab stateName={decodedStateName} />
					</TabPanel>
				)}

				{/* Active Voters Tab */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_ACTIVE}>
						<ActiveVoterTab stateName={decodedStateName} />
					</TabPanel>
				)}

				{/* Pollbook Deletion Tab (GUI-8) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_POLLBOOK}>
						<PollbookDeletionsTab stateName={decodedStateName} />
					</TabPanel>
				)}

				{/* Pollbook Deletions Tab (GUI-8) - Matching Active Voters layout 
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
											data={pollbookRows}
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
				*/}
				{/* Mail Rejections Tab (GUI-9) */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_MAIL}>
						<MailRejectionsTab stateName={decodedStateName} />
					</TabPanel>
				)}

				{/* Mail Rejections Tab (GUI-9) - Matching Active Voters layout 
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
											data={mailRows}
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
				*/}

				{/* Voting Equipment Tab (GUI-6) */}
				<TabPanel value={tabValue} index={IDX_EQUIPMENT}>
					<VotingEquipmentTab stateName={decodedStateName} />
				</TabPanel>

				{/* Voter Registration Data Tab (GUI-17) - Matching other tabs layout */}
				{isDetail && (
					<TabPanel value={tabValue} index={IDX_REG}>
						<Box sx={{
							p: 0,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: "calc(100vh - 280px)",
						}}>
							{/* Bar Chart and Map - top section */}
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
									<VoterRegistrationBarChart
										data={voterRegistrationData || []}
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
									<VoterRegistrationChloroplethMap
										stateName={decodedStateName}
										data={voterRegistrationData || []}
									/>
								</Box>
							</Box>

							{/* Table - bottom section */}
							<Box sx={{ flex: 1, display: "flex" }}>
								<StateVoterRegistrationTable
									stateName={stateName ? stateName : ""}
								/>
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

				{/* NEW: Drop Box Analysis Tab - GUI-24 (Arkansas, Maryland, Rhode Island) */}
				{isPartyState && IDX_DROPBOX >= 0 && (
					<TabPanel value={tabValue} index={IDX_DROPBOX}>
						<Box sx={{ p: 3 }}>
							{dropboxBubbleLoading ? (
								<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
									<CircularProgress />
								</Box>
							) : dropboxBubbleData.length === 0 ? (
								<Alert severity="warning">
									No drop box voting records were returned for {decodedStateName}. Please
									verify the preprocessing cache includes C3a totals for this state.
								</Alert>
							) : (
								<DropboxBubbleChart
									data={dropboxBubbleData}
									regressionLines={[]}
								/>
							)}
						</Box>
					</TabPanel>
				)}

				{/* NEW: Gingles Analysis Tab - GUI-27 (MD, AR, RI) */}
				{isPreclearance && IDX_GINGLES >= 0 && (
					<TabPanel value={tabValue} index={IDX_GINGLES}>
						<Box sx={{ p: 3 }}>
							{ginglesLoading && (
								<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
									<CircularProgress />
								</Box>
							)}
							{ginglesError && (
								<Alert severity="error" sx={{ mb: 2 }}>
									{ginglesError}
								</Alert>
							)}
							{!ginglesLoading && !ginglesError && ginglesData && (
								<GinglesChart
									stateName={decodedStateName}
									data={ginglesData.data || []}
									democraticRegression={ginglesData.democraticRegression}
									republicanRegression={ginglesData.republicanRegression}
								/>
							)}
						</Box>
					</TabPanel>
				)}

				{/* NEW: EI Equipment Tab - GUI-28 (Maryland only) */}
				{isPreclearance && IDX_EI_EQUIPMENT >= 0 && (
					<TabPanel value={tabValue} index={IDX_EI_EQUIPMENT}>
						<EIEquipmentChart stateName={decodedStateName} />
					</TabPanel>
				)}

				{/* NEW: EI Rejected Ballots Tab - GUI-29 (Maryland only) */}
				{isPreclearance && IDX_EI_REJECTED >= 0 && (
					<TabPanel value={tabValue} index={IDX_EI_REJECTED}>
						<EIRejectedBallotsChart stateName={decodedStateName} />
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
		</Box>
	);
};

export default StateDetailPage;
