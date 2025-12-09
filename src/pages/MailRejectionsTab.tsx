import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchMailRejections } from "../data/api";
import type { MailRejectionRow } from "../data/types";
import PercentChoropleth from "../components/PercentChoropleth";
import MailRejectionsBarChart from "../charts/MailRejectionsBarChart";
import MailRejectionsTable from "../tables/MailRejectionsTable";

interface MailRejectionsTabProps {
    stateName: string;
}

const MailRejectionsTab = ({ stateName }: MailRejectionsTabProps) => {
    const [data, setData] = useState<MailRejectionRow[] | undefined>(undefined);

    // Fetch mail rejections data when stateName changes
    useEffect(() => {
        if (!stateName) return;

        // Reset state when stateName changes
        setData(undefined);

        let alive = true;
        (async () => {
            try {
                const rows = await fetchMailRejections(stateName);
                if (alive) setData(rows);
            } catch {
                if (alive) {
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
                <MailRejectionsBarChart
                    stateName={stateName}
                    data={data || []}
                />
            </Box>

            <Box sx={{ gridColumn: "2", gridRow: "2", overflow: "hidden", height: "100%" }}>
                <MailRejectionsTable
                    data={data || []}
                />
            </Box>
        </Box>
    );
}

export default MailRejectionsTab;
