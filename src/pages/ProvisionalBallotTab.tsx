import { useMemo, useState, useEffect } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import { fetchProvisionalBallots } from "../data/api";

import {
	getProvisionalBallotCategories,
	getChoroplethData,
} from "../data/provisionalBallotData";
import ProvisionalBallotBarChart from "../charts/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../tables/ProvisionalBallotTable";

interface ProvisionalBallotTabProps {
	stateName: string;
}

const ProvisionalBallotTab = ({ stateName }: ProvisionalBallotTabProps) => {
	const [data, setData] = useState<any[] | undefined>(undefined);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Fetch provisional ballot data when stateName changes
	useEffect(() => {
		if (!stateName) return;

		// Reset state when stateName changes
		setData(undefined);
		setError(null);
		setLoading(true);

		let alive = true;
		(async () => {
			try {
				const rows = await fetchProvisionalBallots(stateName);
				if (alive) {
					setData(rows);
					setLoading(false);
				}
			} catch (err: unknown) {
				if (alive) {
					const message = err instanceof Error ? err.message : "Failed to fetch data";
					setError(message);
					setData([]);
					setLoading(false);
				}
			}
		})();

		return () => {
			alive = false; // cleanup on unmount
		};
	}, [stateName]);

	// Get choropleth data (shared with Registration tab)
	const choroplethData = useMemo(() => {
		return getChoroplethData(stateName);
	}, [stateName]);

	// Show loading state
	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
				<CircularProgress />
			</Box>
		);
	}

	// Show error state
	if (error) {
		return (
			<Box sx={{ p: 2 }}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{
			p: 0,
			height: "calc(100vh - 60px)",
			display: "grid",
			gridTemplateColumns: "40% 60%",
			gridTemplateRows: "1fr 1fr",
			gap: 0
		}}>
			<Box sx={{ gridColumn: "1", gridRow: "1 / 3", overflow: "hidden" }}>
				<ProvisionalBallotChoroplethMap
					stateName={stateName}
					data={choroplethData || []}
				/>
			</Box>

			<Box sx={{
				gridColumn: "2",
				gridRow: "1",
				overflow: "hidden"
			}}>
				<ProvisionalBallotBarChart
					data={data || []}
					categories={getProvisionalBallotCategories()}
				/>
			</Box>

			<Box sx={{
				gridColumn: "2",
				gridRow: "2",
				overflow: "hidden",
				height: "100%"
			}}>
				<ProvisionalBallotTable
					data={data || []}
				/>
			</Box>
		</Box>
	);
};

export default ProvisionalBallotTab;
