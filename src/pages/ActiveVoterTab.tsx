import { useEffect, useState } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import { fetchActiveVoters } from "../data/api";
import type { ActiveVotersRow } from "../data/types";
import ActiveVotersChoroplethMap from "../components/ActiveVotersChoroplethMap";
import ActiveVotersBarChart from "../charts/ActiveVotersBarChart";
import ActiveVotersTable from "../tables/ActiveVotersTable";

interface ActiveVoterTabProps {
    stateName: string;
}

const ActiveVoterTab = ({ stateName }: ActiveVoterTabProps) => {
    const [data, setData] = useState<ActiveVotersRow[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!stateName) return;

        setData(undefined);
        setError(null);
        setLoading(true);

        let alive = true;
        (async () => {
            try {
                const rows = await fetchActiveVoters(stateName);
                if (alive) {
                    setData(rows);
                    setLoading(false);
                }
            } catch (e: any) {
                if (alive) {
                    setError(e?.message || "Failed to fetch active voters");
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
        <Box sx={{
            p: 0,
            height: "calc(100vh - 60px)",
            display: "grid",
            gridTemplateColumns: "40% 60%",
            gridTemplateRows: "1fr 1fr",
            gap: 0
        }}>
            <Box sx={{ gridColumn: "1", gridRow: "1 / 3", overflow: "hidden" }}>
                <ActiveVotersChoroplethMap
                    stateName={stateName}
                    data={data || []}
                />
            </Box>

            <Box sx={{
                gridColumn: "2",
                gridRow: "1",
                overflow: "hidden"
            }}>
                <ActiveVotersBarChart
                    data={data || []}
                />
            </Box>

            <Box sx={{
                gridColumn: "2",
                gridRow: "2",
                overflow: "hidden",
                height: "100%"
            }}>
                <ActiveVotersTable
                    data={data || []}
                />
            </Box>
        </Box>
    );
};

export default ActiveVoterTab;