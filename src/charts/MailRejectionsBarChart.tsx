/**
 * Stacked bar chart showing mail ballot rejection reasons.
 * Displays breakdown by rejection category (no signature, mismatch, late, etc.)
 */

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Box, Typography, Paper } from "@mui/material";
import type { MailRejectionRow } from "../data/types";
import theme from "../theme";

type Props = { stateName: string; data: MailRejectionRow[] };

const LABELS: Record<keyof MailRejectionRow, string> = {
    geographicUnit: "Region",
    dataYear: "Year",
    C9b_NoSignature: "C9b No Signature",
    C9c_SigMismatch: "C9c Signature Mismatch",
    C9d_ReceivedLate: "C9d Received Late",
    C9e_MissingInfo: "C9e Missing Info",
    C9f_NotRegistered: "C9f Not Registered",
    C9g_WrongEnvelope: "C9g Wrong Envelope",
    C9h_Other: "C9h Other",
    total: "Total",
    rejectionPercentage: "Rejection %",
};

export default function MailRejectionsBarChart({ data }: Props) {
    const chartData = useMemo(() => {
        const sum = (key: keyof MailRejectionRow) =>
            data.reduce((acc, r) => acc + (r[key] as number), 0);

        return [
            { label: LABELS.C9b_NoSignature, value: sum("C9b_NoSignature") },
            { label: LABELS.C9c_SigMismatch, value: sum("C9c_SigMismatch") },
            { label: LABELS.C9d_ReceivedLate, value: sum("C9d_ReceivedLate") },
            { label: LABELS.C9e_MissingInfo, value: sum("C9e_MissingInfo") },
            { label: LABELS.C9f_NotRegistered, value: sum("C9f_NotRegistered") },
            { label: LABELS.C9g_WrongEnvelope, value: sum("C9g_WrongEnvelope") },
            { label: LABELS.C9h_Other, value: sum("C9h_Other") },
        ];
    }, [data]);

    const CustomTooltip = ({
        active,
        payload,
    }: {
        active?: boolean;
        payload?: Array<{
            payload: {
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
                        {data.value.toLocaleString()} rejections
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
                    No mail rejections data available for this state.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                    Mail Ballot Rejections by Category
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 20, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="label"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11 }}
                            style={{ fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v: number) => v.toLocaleString()}
                            label={{
                                value: "Number of Rejections",
                                angle: -90,
                                position: "insideLeft",
                                dy: 60,
                                style: { fontSize: 12, fontWeight: 600 },
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
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
