// GUI - 8
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Box, Typography } from "@mui/material";
import type { PollbookDeletionRow } from "../data/types";

type Props = { stateName: string; data: PollbookDeletionRow[] };

const LABELS: Record<keyof PollbookDeletionRow, string> = {
    geographicUnit: "Region",
    A12b_Death: "A12b Death",
    A12c_Moved: "A12c Moved",
    A12d_Felon: "A12d Felon",
    A12e_MentalIncap: "A12e Mental Incap",
    A12f_Requested: "A12f Requested",
    A12g_FailedToVote: "A12g Failed to Vote",
    A12h_Other: "A12h Other",
    total: "Total",
    deletionPercentage: "Deletion %",
};

const fmt = new Intl.NumberFormat();

export default function PollbookDeletionsBarChart({ stateName, data }: Props) {
    const chartData = useMemo(() => {
        const sum = (key: keyof PollbookDeletionRow) =>
            data.reduce((acc, r) => acc + (r[key] as number), 0);

        return [
            { key: "A12b_Death", label: LABELS.A12b_Death, value: sum("A12b_Death") },
            { key: "A12c_Moved", label: LABELS.A12c_Moved, value: sum("A12c_Moved") },
            { key: "A12d_Felon", label: LABELS.A12d_Felon, value: sum("A12d_Felon") },
            { key: "A12e_MentalIncap", label: LABELS.A12e_MentalIncap, value: sum("A12e_MentalIncap") },
            { key: "A12f_Requested", label: LABELS.A12f_Requested, value: sum("A12f_Requested") },
            { key: "A12g_FailedToVote", label: LABELS.A12g_FailedToVote, value: sum("A12g_FailedToVote") },
            { key: "A12h_Other", label: LABELS.A12h_Other, value: sum("A12h_Other") },
        ];
    }, [data]);

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Pollbook Deletions by Category — {stateName}
            </Typography>
            <ResponsiveContainer width="100%" height={270}>
                <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 8, bottom: 40 }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                        dataKey="label"
                        interval={0}
                        angle={-20}
                        height={60}
                        tick={{ fontSize: 12 }}
                        dy={8}
                    />
                    <YAxis tickFormatter={(v) => fmt.format(v as number)} />
                    <Tooltip
                        formatter={(v: number) => fmt.format(v)}
                        labelFormatter={(l) => l as string}
                    />
                    <Bar dataKey="value" fill="#1976d2" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
