import { useEffect, useState } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import {
	fetchStateRegisteredVoters,
	fetchRegistrationTrends,
	fetchBlockBubbles,
} from "../data/api";
import type {
	RegistrationTrendPayload,
	BlockBubblePayload,
} from "../data/types";
import VoterRegistrationBarChart from "../charts/VoterRegistrationBarChart";
import VoterRegistrationChloroplethMap from "../components/VoterRegistrationChloroplethMap";
import StateVoterRegistrationTable from "../tables/StateVoterRegistrationTable";
import VoterRegistrationTrendChart from "../charts/VoterRegistrationTrendChart";
import VoterRegistrationBubbleOverlay from "../components/VoterRegistrationBubbleOverlay";
import RegisteredVotersList from "../components/RegisteredVotersList";

interface VoterRegistrationTabProps {
	stateName: string;
}

const VoterRegistrationTab = ({ stateName }: VoterRegistrationTabProps) => {
	const [data, setData] = useState<any[] | undefined>(undefined);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [regTrends, setRegTrends] = useState<RegistrationTrendPayload | null>(null);
	const [blockBubbles, setBlockBubbles] = useState<BlockBubblePayload | null>(null);
	const [showBubbles, setShowBubbles] = useState(false);
	const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

	useEffect(() => {
		if (!stateName) return;

		setData(undefined);
		setError(null);
		setLoading(true);
		setRegTrends(null);
		setBlockBubbles(null);
		setShowBubbles(false);

		let alive = true;
		(async () => {
			try {
				const [regData, trends, bubbles] = await Promise.all([
					fetchStateRegisteredVoters(stateName),
					fetchRegistrationTrends(stateName).catch(() => null),
					fetchBlockBubbles(stateName).catch(() => null),
				]);

				if (alive) {
					setData(regData);
					setRegTrends(trends);
					setBlockBubbles(bubbles);
					setLoading(false);
				}
			} catch (err: unknown) {
				if (alive) {
					const message = err instanceof Error ? err.message : "Failed to fetch voter registration data";
					setError(message);
					setData([]);
					setLoading(false);
				}
			}
		})();

		return () => {
			alive = false;
		};
	}, [stateName]);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 2 }}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

		return (
			<Box
				sx={{
					p: 0,
					height: "calc(100vh - 60px)",
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "40% 60%" },
					   gridTemplateRows: { xs: "auto auto auto auto", md: "65% 35%" },
					   gridTemplateAreas: {
						   xs: `
							   'choropleth'
							   'bar'
							   'trend'
							   'table'
						   `,
						   md: `
							   'choropleth rightcol'
							   'bar rightcol'
						   `
					   },
					gap: 0,
				}}
			>
				   {/* Choropleth Map: 65% height of first column */}
				<Box sx={{ gridArea: { xs: "choropleth", md: "choropleth" }, minHeight: 0, overflow: "hidden" }}>
					{showBubbles && blockBubbles ? (
						<VoterRegistrationBubbleOverlay
							stateName={stateName}
							payload={blockBubbles}
						/>
					) : (
						<VoterRegistrationChloroplethMap
							stateName={stateName}
							data={data || []}
							onCountyClick={setSelectedRegion}
							blockBubbles={blockBubbles}
							showBubbles={showBubbles}
							setShowBubbles={setShowBubbles}
						/>
					)}
				</Box>

				   {/* Bar Chart: 35% height of first column */}
				<Box sx={{ gridArea: { xs: "bar", md: "bar" }, minHeight: 0, overflow: "hidden" }}>
					<VoterRegistrationBarChart data={data || []} />
				</Box>

				   {/* Right column: nested grid for trend chart and table, each 50% */}
				   <Box sx={{ gridArea: { xs: undefined, md: "rightcol" }, display: { xs: "block", md: "grid" }, gridTemplateRows: { md: "54% 46%" }, height: "100%", minHeight: 0, overflow: "hidden" }}>
					   <Box sx={{ minHeight: 0, overflow: "hidden" }}>
						   {regTrends && <VoterRegistrationTrendChart trends={regTrends} />}
					   </Box>
					   <Box sx={{ minHeight: 0, overflow: "hidden" }}>
						   <StateVoterRegistrationTable stateName={stateName} />
					   </Box>
				   </Box>

				{/* Registered Voters List Modal */}
				{selectedRegion && (
					<RegisteredVotersList
						open={!!selectedRegion}
						stateName={stateName}
						geographicUnit={selectedRegion}
						onClose={() => setSelectedRegion(null)}
					/>
				)}
			</Box>
		);
};

export default VoterRegistrationTab;
