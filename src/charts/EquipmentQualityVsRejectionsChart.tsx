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
    coefficients: { a?: number | string; b?: number | string; c?: number | string };
    r2: number;
    type?: "power" | "linear" | "quadratic" | "exponential" | "power";
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
const generateRegressionPoints = (
    coefficients: { a: number; b: number },
    xMin: number,
    xMax: number,
    type: "power" | "linear" | "exponential" = "power"
) => {
    const points = [];
    const step = (xMax - xMin) / 50;

    const startX = type === "power" ? Math.max(xMin, 1) : xMin;

    for (let x = startX; x <= xMax; x += step) {
        let y: number;
        if (type === "linear") {
            y = coefficients.a + coefficients.b * x;
        } else if (type === "exponential") {
            y = coefficients.a * Math.exp(coefficients.b * x);
        } else {
            y = coefficients.a * Math.pow(x, coefficients.b);
        }

        if (isFinite(y) && y >= 0) {
            points.push({ x, y });
        }
    }
    return points;
};

// Quadratic points generator: y = a*x^2 + b*x + c
const generateQuadraticPoints = (
    coefficients: { a: number; b: number; c: number },
    xMin: number,
    xMax: number
) => {
    const points: { x: number; y: number }[] = [];
    const step = (xMax - xMin) / 100;
    const eps = 1e-6;
    for (let x = xMin; x <= xMax; x += step) {
        const y = coefficients.a * x * x + coefficients.b * x + coefficients.c;
        const yy = Math.max(eps, y);
        if (isFinite(yy)) points.push({ x, y: yy });
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

                    const dataPoints = result.dataPoints || result;
                                    const transformedData = (Array.isArray(dataPoints) ? dataPoints : []).map((item: any) => ({
                                        county: item.county,
                                        equipmentQuality: item.equipmentQuality,
                                        // backend returns percent (0-100)
                                        rejectionRate: item.rejectedPct,
                                        party: item.party,
                                    }));

                    setChartData(transformedData);
                    const counts = transformedData.reduce((acc: any, d: any) => {
                        acc[d.party] = (acc[d.party] || 0) + 1;
                        return acc;
                    }, {});
                    console.log("[EquipChart] data counts for", stateName, counts);

                    if (result.regressionLines && Array.isArray(result.regressionLines)) {
                        const transformedRegression = result.regressionLines.map((reg: any) => ({
                            party: reg.party,
                            coefficients: reg.coefficients || {},
                            r2: reg.r2,
                            type: reg.type || "power",
                        }));
                        console.log("[EquipChart] regressionLines for", stateName, transformedRegression);
                        setRegressionLines(transformedRegression);
                    }
                }
            } catch (err) {
                console.log("Error loading equipment quality data:", err);
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

    const xMin = 0;
    const xMax = 100;

    const rejections = chartData.map((d) => d.rejectionRate);
    const maxRejection = Math.max(...rejections);
    const yMax = Math.max(maxRejection * 1.15, 1);

    // Prefer quadratic regression when available, otherwise fall back to any regression for the party
    const republicanRegression = regressionLines?.find((r) => r.party === "R" && r.type === 'quadratic') ?? regressionLines?.find((r) => r.party === "R");
    const democraticRegression = regressionLines?.find((r) => r.party === "D" && r.type === 'quadratic') ?? regressionLines?.find((r) => r.party === "D");

    const fmt = (v: any) => {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return Number.isFinite(n) ? n : null;
    };
    const formatEquation = (reg: RegressionLine | undefined) => {
        if (!reg || !reg.type) return '';
        const type = reg.type;
        if (type === 'quadratic') {
            const a = fmt(reg.coefficients.a);
            const b = fmt(reg.coefficients.b);
            const c = fmt(reg.coefficients.c);
            if (a === null || b === null || c === null) return '';
            return `y = ${a.toFixed(4)} x² + ${b.toFixed(4)} x + ${c.toFixed(4)}`;
        }
        if (type === 'exponential') {
            const a = fmt(reg.coefficients.a);
            const b = fmt(reg.coefficients.b);
            if (a === null || b === null) return '';
            return `y = ${a.toFixed(4)} * e^(${b.toFixed(4)} x)`;
        }
        if (type === 'linear') {
            const a = fmt(reg.coefficients.a);
            const b = fmt(reg.coefficients.b);
            if (a === null || b === null) return '';
            return `y = ${a.toFixed(4)} + ${b.toFixed(4)} x`;
        }
        // power
        const a = fmt(reg.coefficients.a);
        const b = fmt(reg.coefficients.b);
        if (a === null || b === null) return '';
        return `y = ${a.toFixed(4)} x^${b.toFixed(4)}`;
    };

    // Helpers to parse coefficients that might be strings
    const parseNum = (v: any) => (typeof v === 'string' ? parseFloat(v) : v);

    const republicanRegressionPoints = (() => {
        if (!republicanRegression) return [];
        if (republicanRegression.type === 'quadratic') {
            const a = parseNum(republicanRegression.coefficients.a) ?? 0;
            const b = parseNum(republicanRegression.coefficients.b) ?? 0;
            const c = parseNum(republicanRegression.coefficients.c) ?? 0;
            return generateQuadraticPoints({ a, b, c }, xMin, xMax);
        }
        const a = parseNum(republicanRegression.coefficients.a) ?? 0;
        const b = parseNum(republicanRegression.coefficients.b) ?? 0;
        return generateRegressionPoints({ a, b }, xMin, xMax, republicanRegression.type || 'power');
    })();

    const democraticRegressionPoints = (() => {
        if (!democraticRegression) return [];
        if (democraticRegression.type === 'quadratic') {
            const a = parseNum(democraticRegression.coefficients.a) ?? 0;
            const b = parseNum(democraticRegression.coefficients.b) ?? 0;
            const c = parseNum(democraticRegression.coefficients.c) ?? 0;
            return generateQuadraticPoints({ a, b, c }, xMin, xMax);
        }
        const a = parseNum(democraticRegression.coefficients.a) ?? 0;
        const b = parseNum(democraticRegression.coefficients.b) ?? 0;
        return generateRegressionPoints({ a, b }, xMin, xMax, democraticRegression.type || 'power');
    })();

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
                            height={48}
                            iconType="circle"
                            iconSize={10}
                            content={() => {
                                const demEq = formatEquation(democraticRegression);
                                const repEq = formatEquation(republicanRegression);
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 1 }}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#1976d2' }}>{demEq}</Typography>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#d32f2f' }}>{repEq}</Typography>
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
                                data={republicanRegressionPoints.map(pt => ({ equipmentQuality: pt.x, rejectionRate: pt.y }))}
                                line={{ stroke: "#d32f2f", strokeWidth: 2 }}
                                shape={() => <></>}
                                isAnimationActive={false}
                            />
                        )}
                        {democraticRegressionPoints.length > 0 && (
                            <Scatter
                                name="Democratic Trend"
                                data={democraticRegressionPoints.map(pt => ({ equipmentQuality: pt.x, rejectionRate: pt.y }))}
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
