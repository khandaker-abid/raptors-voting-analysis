import React, { useMemo } from "react";
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
import type { StateVoterRegistrationData } from "../data/stateVoterRegistrationData";

interface VoterRegistrationBarChartProps {
    data: StateVoterRegistrationData[];
}

function getVoterRegistrationChartData(data: StateVoterRegistrationData[]) {
    const totalRegistered = data.reduce((sum, d) => sum + (d.registeredVoterCount || 0), 0);
    const totalRepublican = data.reduce((sum, d) => sum + (d.republicanCount || 0), 0);
    const totalDemocratic = data.reduce((sum, d) => sum + (d.democraticCount || 0), 0);
    const totalUnaffiliated = data.reduce((sum, d) => sum + (d.unaffiliatedPartyCount || 0), 0);

    const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

    return [
        {
            category: "Total",
            count: totalRegistered,
            percentage: 100,
            color: "#757575",
        },
        {
            category: "Republican",
            count: totalRepublican,
            percentage: pct(totalRepublican, totalRegistered),
            color: "#d32f2f",
        },
        {
            category: "Democratic",
            count: totalDemocratic,
            percentage: pct(totalDemocratic, totalRegistered),
            color: "#1976d2",
        },
        {
            category: "Unaffiliated",
            count: totalUnaffiliated,
            percentage: pct(totalUnaffiliated, totalRegistered),
            color: "#757575",
        },
    ];
}

// Bar order constant
const ORDER = ["Registered Voter Count", "Republican Count", "Democratic Count", "Unaffiliated Party Count"] as const;

const VoterRegistrationBarChart: React.FC<VoterRegistrationBarChartProps> = ({
    data,
}) => {
    const chartData = useMemo(() => getVoterRegistrationChartData(data), [data]);

    const ORDER = ["Total", "Republican", "Democratic", "Unaffiliated"] as const;

    const orderedChartData = useMemo(() => {
        const byCat = new Map(chartData.map((d) => [d.category, d]));
        return ORDER.map((label) => {
            const found = byCat.get(label);
            return (
                found ?? {
                    category: label,
                    count: 0,
                    percentage: 0,
                    color: "#757575",
                }
            );
        });
    }, [chartData]);

    const CustomTooltip = ({
        active,
        payload,
    }: {
        active?: boolean;
        payload?: Array<{
            payload: {
                category: string;
                count: number;
                percentage: number;
                color: string;
            };
        }>;
    }) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 2, maxWidth: 300 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {data.category}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, color: data.color, fontWeight: "bold" }}>
                        {data.count.toLocaleString()} voters
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data.percentage}% of total registered voters
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
                    No voter registration data available for this state.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                    Voter Registration Categories Analysis
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={orderedChartData}
                        margin={{ top: 0, right: 0, left: 0, bottom: -30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="category"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            width={80}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v: number) => v.toLocaleString()}
                            label={{
                                value: "Number of Voters",
                                angle: -90,
                                position: "insideLeft",
                                dy: 50,
                                style: { fontSize: 12, fontWeight: 600 },
                            }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {orderedChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default VoterRegistrationBarChart;
