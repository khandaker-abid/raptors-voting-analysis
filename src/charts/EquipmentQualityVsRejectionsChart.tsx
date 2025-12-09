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
    equipmentQuality: number;
    rejectionRate: number;
    party: "R" | "D";
}

interface RegressionLine {
    party: "R" | "D";
    coefficients: { a: number; b: number };
    r2: number;
    type?: "power" | "linear";
}

interface Props {
    stateName: string;
    data?: EquipmentQualityDataPoint[];
    regressionLines?: RegressionLine[];
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

/**
 * Generate regression line points for both power and linear regression
 */
const generateRegressionPoints = (
    coefficients: { a: number; b: number },
    xMin: number,
    xMax: number,
    type: "power" | "linear" = "power"
) => {
    const points = [];
    const step = (xMax - xMin) / 50;

    // Start from a small positive value to avoid log(0) issues
    const startX = type === "power" ? Math.max(xMin, 1) : xMin;

    for (let x = startX; x <= xMax; x += step) {
        let y: number;
        if (type === "linear") {
            // Linear: y = a + b*x (a is intercept, b is slope)
            y = coefficients.a + coefficients.b * x;
        } else {
            // Power: y = a * x^b
            y = coefficients.a * Math.pow(x, coefficients.b);
        }

        // Only add points with valid y values
        if (isFinite(y) && y >= 0) {
            points.push({ x, y });
        }
    }
    return points;
};

const EquipmentQualityVsRejectionsChart: React.FC<Props> = ({
    stateName,
    data,
    regressionLines: propRegressionLines,
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<EquipmentQualityDataPoint[]>([]);
    const [regressionLines, setRegressionLines] = useState<RegressionLine[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (data) {
                    setChartData(data);
                    if (propRegressionLines) {
                        setRegressionLines(propRegressionLines);
                    }
                } else {
                    const response = await fetch(
                        `/api/equipment/vs-rejected-with-regression/${encodeURIComponent(stateName)}`
                    );
                    if (!response.ok) {
                        throw new Error("Failed to fetch equipment quality data");
                    }
                    const result = await response.json();

                    // Transform backend data to match chart interface
                    const dataPoints = result.dataPoints || result;
                    const transformedData = (Array.isArray(dataPoints) ? dataPoints : []).map((item: any) => ({
                        county: item.county,
                        equipmentQuality: item.equipmentQuality,
                        rejectionRate: item.rejectedPct * 100, // Convert decimal to percentage
                        party: item.party,
                    }));

                    setChartData(transformedData);

                    if (result.regressionLines && Array.isArray(result.regressionLines)) {
                        const transformedRegression = result.regressionLines.map((reg: any) => ({
                            party: reg.party,
                            coefficients: reg.coefficients,
                            r2: reg.r2,
                            type: reg.type || "power",
                        }));
                        setRegressionLines(transformedRegression);
                    }
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
    }, [stateName, data, propRegressionLines]);

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

    const rejections = chartData.map((d) => d.rejectionRate);
    const maxRejection = Math.max(...rejections);
    const yMax = Math.max(maxRejection * 1.15, 1);

    const republicanRegression = regressionLines?.find((r) => r.party === "R");
    const democraticRegression = regressionLines?.find((r) => r.party === "D");

    const republicanRegressionPoints = republicanRegression
        ? generateRegressionPoints(
            republicanRegression.coefficients,
            xMin,
            xMax,
            republicanRegression.type || "power"
        )
        : [];

    const democraticRegressionPoints = democraticRegression
        ? generateRegressionPoints(
            democraticRegression.coefficients,
            xMin,
            xMax,
            democraticRegression.type || "power"
        )
        : [];

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
                        {republicanRegressionPoints.length > 0 && (
                            <Scatter
                                name="Republican Trend"
                                data={republicanRegressionPoints}
                                line={{ stroke: "#d32f2f", strokeWidth: 2 }}
                                shape={() => <></>}
                                isAnimationActive={false}
                            />
                        )}
                        {democraticRegressionPoints.length > 0 && (
                            <Scatter
                                name="Democratic Trend"
                                data={democraticRegressionPoints}
                                line={{ stroke: "#1976d2", strokeWidth: 2 }}
                                shape={() => <></>}
                                isAnimationActive={false}
                            />
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default EquipmentQualityVsRejectionsChart;
