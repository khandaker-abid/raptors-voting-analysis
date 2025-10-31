// GUI - 8
import { useMemo } from "react";
import { Paper, Typography, Box } from "@mui/material";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { PollbookDeletionRow } from "../data/types";
import theme from "../theme";

type Props = { stateName: string; data: PollbookDeletionRow[] };

const LABELS: Record<string, string> = {
    A12b_Death: "A12b Death",
    A12c_Moved: "A12c Moved",
    A12d_Felon: "A12d Felon",
    A12e_MentalIncap: "A12e Mental Incap",
    A12f_Requested: "A12f Requested",
    A12g_FailedToVote: "A12g Failed to Vote",
    A12h_Other: "A12h Other",
};

export default function PollbookDeletionsBarChart({ stateName, data }: Props) {
    const chartData = useMemo(() => {
        const sum = (key: keyof PollbookDeletionRow) =>
            data.reduce((acc, r) => {
                const val = r[key];
                return acc + (typeof val === "number" ? val : 0);
            }, 0);

        return [
            { key: "A12b_Death", label: LABELS.A12b_Death, value: sum("A12b_Death") },
            { key: "A12c_Moved", label: LABELS.A12c_Moved, value: sum("A12c_Moved") },
            { key: "A12d_Felon", label: LABELS.A12d_Felon, value: sum("A12d_Felon") },
            {
                key: "A12e_MentalIncap",
                label: LABELS.A12e_MentalIncap,
                value: sum("A12e_MentalIncap"),
            },
            {
                key: "A12f_Requested",
                label: LABELS.A12f_Requested,
                value: sum("A12f_Requested"),
            },
            {
                key: "A12g_FailedToVote",
                label: LABELS.A12g_FailedToVote,
                value: sum("A12g_FailedToVote"),
            },
            { key: "A12h_Other", label: LABELS.A12h_Other, value: sum("A12h_Other") },
        ];
    }, [data]);

    const CustomTooltip = ({
        active,
        payload,
    }: {
        active?: boolean;
        payload?: Array<{
            payload: {
                key: string;
                label: string;
                value: number;
            };
        }>;
    }) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 2, maxWidth: 300 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {data.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, color: theme.palette.primary.main }}>
                        {data.value.toLocaleString()} deletions
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    No pollbook deletions data available for this state.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
        >
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    Pollbook Deletions by Category — {stateName}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    fontSize="0.7rem"
                >
                    Voter registration deletions across different categories. Hover over
                    bars for detailed information.
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="label"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v: number) => v.toLocaleString()}
                            label={{
                                value: "Number of Deletions",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: 11 },
                            }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
