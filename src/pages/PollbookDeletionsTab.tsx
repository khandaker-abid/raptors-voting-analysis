import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchPollbookDeletions } from "../data/api";
import type { PollbookDeletionRow } from "../data/types";
import PercentChoropleth from "../components/PercentChoropleth";
import PollbookDeletionsBarChart from "../charts/PollbookDeletionsBarChart";
import PollbookDeletionsTable from "../tables/PollbookDeletionsTable";

interface PollbookDeletionsTabProps {
    stateName: string;
}

const PollbookDeletionsTab = ({ stateName }: PollbookDeletionsTabProps) => {
    const [data, setData] = useState<PollbookDeletionRow[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    // Fetch pollbook deletions data when stateName changes
    useEffect(() => {
        if (!stateName) return;

        // Reset state when stateName changes
        setData(undefined);
        setError(null);

        let alive = true;
        (async () => {
            try {
                const rows = await fetchPollbookDeletions(stateName);
                if (alive) setData(rows);
            } catch (e: any) {
                if (alive) {
                    setError(e?.message || "Failed to fetch pollbook deletions");
                    setData([]); // stop loading spinner
                }
            }
        })();

        return () => {
            alive = false; // cleanup on unmount
        };
    }, [stateName]);
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
                <PercentChoropleth
                    key={stateName}
                    stateName={stateName}
                    data={data || []}
                />
            </Box>

            <Box sx={{ gridColumn: "2", gridRow: "1", overflow: "hidden" }}>
                <PollbookDeletionsBarChart
                    stateName={stateName}
                    data={data || []}
                />
            </Box>

            <Box sx={{ gridColumn: "2", gridRow: "2", overflow: "hidden", height: "100%" }}>
                <PollbookDeletionsTable
                    data={data || []}
                />
            </Box>
        </Box>
    );
}

export default PollbookDeletionsTab;