import React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
    Legend,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";
import { ExportButton } from "../components/ExportButton";

interface DropboxBubbleChartProps {
    data: Array<{
        geographicUnit: string;
        republicanPercentage: number;
        dropBoxPercentage: number;
        majorityParty: string;
        color: string;
        republicanVotes: number;
        democraticVotes: number;
        dropBoxVotes: number;
        totalVotes: number;
    }>;
    stateName: string;
}

/**
 * GUI-24: Drop Box Voting Bubble Chart
 * 
 * Displays bubble chart showing the relationship between Republican vote percentage
 * and drop box voting percentage for each EAVS geographic unit.
 * 
 * - X-axis: % Republican votes in unit
 * - Y-axis: % drop box voting in unit (C3a)
 * - Color: Red for Republican majority, Blue for Democratic majority
 * - Each bubble represents one EAVS geographic unit
 */
const DropboxBubbleChart: React.FC<DropboxBubbleChartProps> = ({ data, stateName }) => {
    // Separate data by party for coloring
    const republicanData = data.filter((d) => d.color === "red");
    const democraticData = data.filter((d) => d.color === "blue");
    const unknownData = data.filter((d) => d.color === "gray");

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <Paper sx={{ p: 1.5, maxWidth: 300 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                        {point.geographicUnit}
                    </Typography>
                    <Typography variant="body2">
                        Republican: {point.republicanPercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                        Drop Box: {point.dropBoxPercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                        {point.republicanVotes.toLocaleString()} R votes, {point.democraticVotes.toLocaleString()} D votes
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {point.dropBoxVotes.toLocaleString()} drop box of {point.totalVotes.toLocaleString()} total
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    // Calculate some statistics for display
    const avgRepPct = data.length > 0
        ? data.reduce((sum, d) => sum + d.republicanPercentage, 0) / data.length
        : 0;
    const avgDropBoxPct = data.length > 0
        ? data.reduce((sum, d) => sum + d.dropBoxPercentage, 0) / data.length
        : 0;

    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ flex: 1, textAlign: "center" }}>
                    <Typography variant="h6">
                        Drop Box Voting vs. Republican Vote Percentage - {stateName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Each bubble represents an EAVS geographic unit (county/town).
                        Red = Republican majority, Blue = Democratic majority
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        Average: {avgRepPct.toFixed(1)}% Republican, {avgDropBoxPct.toFixed(1)}% Drop Box
                    </Typography>
                </Box>
                <ExportButton
                    chartId="dropbox-bubble-chart"
                    chartName={`dropbox-analysis-${stateName}`}
                    tableData={data}
                    tableColumns={[
                        { header: "Geographic Unit", accessor: "geographicUnit" },
                        { header: "Republican %", accessor: "republicanPercentage" },
                        { header: "Drop Box %", accessor: "dropBoxPercentage" },
                        { header: "Majority Party", accessor: "majorityParty" },
                        { header: "Republican Votes", accessor: "republicanVotes" },
                        { header: "Democratic Votes", accessor: "democraticVotes" },
                        { header: "Drop Box Votes", accessor: "dropBoxVotes" },
                        { header: "Total Votes", accessor: "totalVotes" },
                    ]}
                    tableName={`dropbox-data-${stateName}`}
                />
            </Box>

            <ResponsiveContainer width="100%" height={500} id="dropbox-bubble-chart">
                <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="republicanPercentage"
                        name="Republican %"
                        domain={[0, 100]}
                        label={{
                            value: "Republican Vote Percentage (%)",
                            position: "bottom",
                            offset: 40,
                        }}
                    />
                    <YAxis
                        type="number"
                        dataKey="dropBoxPercentage"
                        name="Drop Box %"
                        domain={[0, "auto"]}
                        label={{
                            value: "Drop Box Voting Percentage (%)",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                    />

                    {/* Republican majority counties (red) */}
                    {republicanData.length > 0 && (
                        <Scatter
                            name="Republican Majority"
                            data={republicanData}
                            fill="#d32f2f"
                            fillOpacity={0.7}
                        />
                    )}

                    {/* Democratic majority counties (blue) */}
                    {democraticData.length > 0 && (
                        <Scatter
                            name="Democratic Majority"
                            data={democraticData}
                            fill="#1976d2"
                            fillOpacity={0.7}
                        />
                    )}

                    {/* Unknown/no data (gray) */}
                    {unknownData.length > 0 && (
                        <Scatter
                            name="Unknown"
                            data={unknownData}
                            fill="#757575"
                            fillOpacity={0.5}
                        />
                    )}
                </ScatterChart>
            </ResponsiveContainer>

            {data.length === 0 && (
                <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No drop box voting data available for {stateName}.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This state may not use drop boxes or data is not reported in EAVS.
                    </Typography>
                </Box>
            )}

            {data.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Key Insights:
                    </Typography>
                    <Typography variant="body2">
                        • {republicanData.length} Republican-majority units, {democraticData.length} Democratic-majority units
                    </Typography>
                    <Typography variant="body2">
                        • Drop box usage ranges from {Math.min(...data.map(d => d.dropBoxPercentage)).toFixed(1)}%
                        to {Math.max(...data.map(d => d.dropBoxPercentage)).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                        • Total drop box votes: {data.reduce((sum, d) => sum + d.dropBoxVotes, 0).toLocaleString()}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DropboxBubbleChart;
