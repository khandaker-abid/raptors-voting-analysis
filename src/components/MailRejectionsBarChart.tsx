// GUI - 9

import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Box, Typography } from "@mui/material";
import type { MailRejectionRow } from "../data/types";

type Props = { stateName: string; data: MailRejectionRow[] };

const LABELS: Record<keyof MailRejectionRow, string> = {
    geographicUnit: "Region",
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

const fmt = new Intl.NumberFormat();

export default function MailRejectionsBarChart({ stateName, data }: Props) {
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

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Mail Ballot Rejections by Category — {stateName}
            </Typography>
            <ResponsiveContainer width="100%" height={270}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 40 }}>
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
