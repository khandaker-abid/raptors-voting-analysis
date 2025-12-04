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
    Line,
} from "recharts";
import { Paper, Typography, Box, CircularProgress, Alert } from "@mui/material";

interface EquipmentQualityDataPoint {
    county: string;
    equipmentQuality: number; // 0-1 scale
    rejectionRate: number; // percentage
    party: "R" | "D";
}

interface RegressionLine {
    party: "R" | "D";
    coefficients: { a: number; b: number };
    r2: number;
}

interface Props {
    stateName: string;
    data?: EquipmentQualityDataPoint[];
    regressionLines?: RegressionLine[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
        // Get the data from the first payload entry
        const dataPoint = payload[0]?.payload;
        
        // Only show tooltip if we have actual scatter point data (must have county and party)
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

// Generate regression line points
const generateRegressionPoints = (
    coefficients: { a: number; b: number },
    xMin: number,
    xMax: number
) => {
    const points = [];
    const step = (xMax - xMin) / 50;
    for (let x = xMin; x <= xMax; x += step) {
        const y = coefficients.a * Math.pow(x, coefficients.b);
        points.push({ x, y });
    }
    return points;
};

const EquipmentQualityVsRejectionsChart: React.FC<Props> = ({
    stateName,
    data,
    regressionLines,
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
                } else {
                    // Fetch from API if not provided
                    const response = await fetch(
                        `http://localhost:8080/api/equipment/vs-rejected/${encodeURIComponent(stateName)}`
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch equipment quality data");
                    }
                    const result = await response.json();

                    // Transform backend data to match chart interface
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

    // Separate data by party
    const republicanData = chartData.filter((d) => d.party === "R");
    const democraticData = chartData.filter((d) => d.party === "D");

    // Use full scale for equipment quality (0-100)
    const xMin = 0;
    const xMax = 100;

    // Calculate Y-axis range based on data with reasonable padding
    const rejections = chartData.map((d) => d.rejectionRate);
    const maxRejection = Math.max(...rejections);

    // Use a tighter range to reduce whitespace, with minimum floor of 0
    const yMax = Math.max(maxRejection * 1.15, 1); // At least 1% range, 15% padding at top

    // Generate regression line data if provided
    // Note: Regression lines are currently not provided by backend (GUI-26 - preferred feature)
    const republicanRegression = regressionLines?.find((r) => r.party === "R");
    const democraticRegression = regressionLines?.find((r) => r.party === "D");

    const republicanRegressionPoints = republicanRegression
        ? generateRegressionPoints(republicanRegression.coefficients, xMin, xMax)
        : [];

    const democraticRegressionPoints = democraticRegression
        ? generateRegressionPoints(democraticRegression.coefficients, xMin, xMax)
        : [];

    return (
        // The line below is the key to getting huge cut off components to fit in
        // grid views without expanding their size and cutting off content
        <Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                Equipment Quality vs Ballot Rejection Rate
            </Typography>

            {/*  
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each bubble represents a county, colored by political party majority
            </Typography>
            */}

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
                        tickFormatter={(value) => `${value}`}
                        ticks={[0, 20, 40, 60, 80, 100]}
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
                        width={75}
                        allowDataOverflow={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={10}
                    />

                    {/* Democratic counties - uniform bubble size */}
                    {democraticData.length > 0 && (
                        <Scatter
                            name="Democratic Counties"
                            data={democraticData}
                            fill="#1976d2"
                            fillOpacity={0.75}
                            shape="circle"
                            isAnimationActive={false}
                        />
                    )}

                    {/* Republican counties - uniform bubble size */}
                    {republicanData.length > 0 && (
                        <Scatter
                            name="Republican Counties"
                            data={republicanData}
                            fill="#d32f2f"
                            fillOpacity={0.75}
                            shape="circle"
                            isAnimationActive={false}
                        />
                    )}

                    {/* Regression lines */}
                    {republicanRegressionPoints.length > 0 && (
                        <Line
                            type="monotone"
                            dataKey="y"
                            data={republicanRegressionPoints}
                            stroke="#d32f2f"
                            strokeWidth={2}
                            dot={false}
                            name={`Republican Trend (R²=${republicanRegression?.r2.toFixed(3)})`}
                        />
                    )}

                    {democraticRegressionPoints.length > 0 && (
                        <Line
                            type="monotone"
                            dataKey="y"
                            data={democraticRegressionPoints}
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={false}
                            name={`Democratic Trend (R²=${democraticRegression?.r2.toFixed(3)})`}
                        />
                    )}
                </ScatterChart>
                </ResponsiveContainer>
            </Box>
            
            {/*  
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Note:</strong> Equipment quality is measured on a 0-100 scale
                    considering age, certification, OS, scan rate, error rate, and
                    reliability. Rejection rate includes mail-in, provisional, and UOCAVA
                    ballots.
                </Typography>
            </Box>
            */}
        </Paper>
    );
};

export default EquipmentQualityVsRejectionsChart;
