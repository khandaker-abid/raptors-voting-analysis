import React, { useEffect, useState } from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Paper, Typography, Box, CircularProgress, Alert } from "@mui/material";

interface EquipmentQualityDataPoint {
    county: string;
    equipmentQuality: number; // 0-1 scale
    rejectionRate: number; // percentage
    party: "R" | "D";
}

interface Props {
    stateName: string;
    data?: EquipmentQualityDataPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
        const dataPoint = payload[0]?.payload;
        
        if (!dataPoint || !dataPoint.county || !dataPoint.party) {
            return null;
        }
        
        const party = dataPoint.party;
        
        return (
            <Paper sx={{ p: 1.5, bgcolor: "rgba(255, 255, 255, 0.95)" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {dataPoint.county}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Equipment Quality: {dataPoint.equipmentQuality.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Rejection Rate: {dataPoint.rejectionRate.toFixed(2)}%
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: party === "R" ? "#d32f2f" : "#1976d2",
                        fontWeight: "bold",
                    }}
                >
                    {party === "R" ? "Republican" : "Democratic"} Majority
                </Typography>
            </Paper>
        );
    }
    return null;
};



const EquipmentQualityVsRejectionsChart: React.FC<Props> = ({
    stateName,
    data,
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<EquipmentQualityDataPoint[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (data) {
                    setChartData(data);
                    console.log("data prop provided:", data);
                } else {
                    const response = await fetch(
                        `http://localhost:8080/api/equipment/vs-rejected/${encodeURIComponent(stateName)}`
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch equipment quality data");
                    }
                    const result = await response.json();

                    const transformedData = result.map((item: any) => ({
                        county: item.county,
                        equipmentQuality: item.equipmentQuality, // Keep on 0-100 scale for better display
                        rejectionRate: item.rejectedPct * 100, // Convert decimal to percentage (0.108 -> 10.8%)
                        party: item.party,
                    }));

                    setChartData(transformedData);
                }
            } catch (err) {
                console.error("Error loading equipment quality data:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load data"
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [stateName, data]);

    if (loading) {
        return (
            <Paper
                sx={{
                    p: 3,
                    height: "500px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="warning">{error}</Alert>
            </Paper>
        );
    }

    if (!chartData || chartData.length === 0) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="info">
                    No equipment quality vs rejection data available for {stateName}
                </Alert>
            </Paper>
        );
    }

    // Calculate X-axis range based on data
    const quality = chartData.map((d) => d.equipmentQuality);
    const qualityMin = Math.min(...quality);
    const xMin = Math.floor(qualityMin / 10) * 10; // Round down to nearest 10
    const xMax = 100;

    // Calculate Y-axis range based on data 
    const rejections = chartData.map((d) => d.rejectionRate);
    const maxRejection = Math.max(...rejections);
    const yMax = Math.max(maxRejection * 1.15, 1); // At least 1% range, 15% padding at top

    return (
        <Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                Equipment Quality vs Ballot Rejection Rate
            </Typography>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 35, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        type="number"
                        dataKey="equipmentQuality"
                        name="Equipment Quality"
                        domain={[xMin, xMax]}
                        label={{
                            value: "Equipment Quality Score",
                            position: "insideBottom",
                            offset: -15,
                            style: { fontSize: 12, fontWeight: 600 }
                        }}
                        tickFormatter={(value) => value.toFixed(1)}
                        allowDataOverflow={false}
                    />
                    <YAxis
                        type="number"
                        dataKey="rejectionRate"
                        name="Rejection Rate"
                        domain={[0, yMax]}
                        label={{
                            value: "Ballot Rejection Rate (%)",
                            angle: -90,
                            position: "insideLeft",
                            offset: 0,
                            style: { fontSize: 12, fontWeight: 600, textAnchor: 'middle' }
                        }}
                        tickFormatter={(value) => value.toFixed(1)}
                        allowDataOverflow={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={10}
                        content={() => {
                            return (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: '#1976d2',
                                                opacity: 0.75
                                            }}
                                        />
                                        <Typography variant="body2">Democratic Counties</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: '#d32f2f',
                                                opacity: 0.75
                                            }}
                                        />
                                        <Typography variant="body2">Republican Counties</Typography>
                                    </Box>
                                </Box>
                            );
                        }}
                    />
                    <Scatter
                        name="Counties"
                        data={chartData}
                        fillOpacity={0.75}
                        shape="circle"
                        isAnimationActive={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.party === "R" ? "#d32f2f" : "#1976d2"}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default EquipmentQualityVsRejectionsChart;
