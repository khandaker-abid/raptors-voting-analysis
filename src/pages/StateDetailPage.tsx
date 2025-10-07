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
import ProvisionalBallotBarChart from "../components/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../components/ProvisionalBallotTable";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import ActiveVotersBarChart from "../components/ActiveVotersBarChart";
import ActiveVotersTable from "../components/ActiveVotersTable";
import ActiveVotersChoroplethMap from "../components/ActiveVotersChoroplethMap";
import StateVotingEquipmentTable from "../components/StateVotingEquipmentTable";
import StateVoterRegistrationTable from "../components/StateVoterRegistrationTable";
import VoterRegistrationChloroplethMap from "../components/VoterRegistrationChloroplethMap";

// NEW (GUI-8/9/16/18)
import {
	fetchPollbookDeletions,
	fetchMailRejections,
	fetchRegistrationTrends,
	fetchBlockBubbles,
} from "../data/api";
import PollbookDeletionsBarChart from "../components/PollbookDeletionsBarChart";
import PollbookDeletionsTable from "../components/PollbookDeletionsTable";
import MailRejectionsBarChart from "../components/MailRejectionsBarChart";
import MailRejectionsTable from "../components/MailRejectionsTable";
import PercentChoropleth from "../components/PercentChoropleth";
import VoterRegistrationTrendChart from "../components/VoterRegistrationTrendChart";
import VoterRegistrationBubbleOverlay from "../components/VoterRegistrationBubbleOverlay";
// New imports for GUI-25 to GUI-27
import EquipmentRejectedBubbleChart from "../components/EquipmentRejectedBubbleChart";
import ResetButton from "../components/ResetButton";
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
	const IDX_POLLBOOK = isDetail ? idx++ : -1; // new
	const IDX_MAIL = isDetail ? idx++ : -1;     // new
	const IDX_EQUIPMENT = idx++;
	const IDX_REG = isDetail ? idx++ : -1;

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
						{isDetail && <Tab label="Provisional Ballot Chart" />}
						{isDetail && <Tab label="Provisional Ballot Table" />}
						{isDetail && <Tab label="Choropleth Map" />}
						{isDetail && <Tab label="Equipment vs Rejected Ballots" />}
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

							{/* Bubble overlay toggle (only if payload present) */}
							{blockBubbles && (
								<Box sx={{ my: 2 }}>
									<Button
										variant="outlined"
										onClick={() => setShowBubbles((s) => !s)}
									>
										{showBubbles ? "Hide" : "Show"} Party Bubble Overlay
									</Button>
									{showBubbles && (
										<Box sx={{ mt: 2 }}>
											<VoterRegistrationBubbleOverlay
												stateName={decodedStateName}
												payload={blockBubbles}
											/>
										</Box>
									)}
								</Box>
							)}
						</Box>
					</TabPanel>
				)}
			</Paper>
			<ResetButton />
		</Box>
	);
};

export default StateDetailPage;
