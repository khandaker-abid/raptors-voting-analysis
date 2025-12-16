import React, { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
    Label
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";    
import type { RegistrationTrendPayload } from "../data/types";


interface Props { trends: RegistrationTrendPayload; }


const VoterRegistrationTrendChart: React.FC<Props> = ({ trends }) => {
    // Prepare data for recharts: array of objects, each with unit name and values for each year
    const chartData = useMemo(() => {
        return trends.geographicUnitOrder2024.map((unit, i) => ({
            unit,
            idx: i + 1,
            "2016": trends.byYear[2016]?.[i] ?? null,
            "2020": trends.byYear[2020]?.[i] ?? null,
            "2024": trends.byYear[2024]?.[i] ?? null,
        }));
    }, [trends]);


    return (
        <Paper
            sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}
        >
            <Box mb={1}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                    Registered Voters by EAVS Unit (ordered by 2024)
                </Typography>
            </Box>
            <Box sx={{ p: 0, flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 0, right: 30, left: 20, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx">
                        <Label
                            value="EAVS Units (ascending by 2024)"
                            offset={30}
                            position="insideBottom"
                            dy={40}
                            style={{ fontSize: 12, fontWeight: 600 }}
                        />
                    </XAxis>
                    <YAxis>
                        <Label
                            value="Registered Voters"
                            angle={-90}
                            position="insideLeft"
                            offset={20}
                            dx={-35}
                            style={{ fontSize: 12, fontWeight: 600 }}
                        />
                    </YAxis>
                    <Tooltip
                        content={({ label, payload }) => {
                            // label is the idx, so get the name in Title Case
                            const i = Number(label) - 1;
                            let name = trends.geographicUnitOrder2024[i] || label;
                            if (typeof name === "string") {
                                name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                            }
                            return (
                                <div style={{ background: "white", border: "1px solid #ccc", padding: 8 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{name}</div>
                                    {payload && payload.map((entry, idx) => (
                                        <div key={idx} style={{ color: entry.color, marginBottom: 2 }}>
                                            {entry.value} Registered Voters <span style={{ fontWeight: 500 }}>({entry.name})</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Legend verticalAlign="top" height={20} />
                    <Line type="monotone" dataKey="2016" stroke="#8884d8" strokeWidth={2} dot={false} name="2016" />
                    <Line type="monotone" dataKey="2020" stroke="#82ca9d" strokeWidth={2} dot={false} name="2020" />
                    <Line type="monotone" dataKey="2024" stroke="#f3a667ff" strokeWidth={2} dot={false} name="2024" />
                </LineChart>
            </ResponsiveContainer>
            </Box>
        </Paper>
    );
};


export default VoterRegistrationTrendChart;