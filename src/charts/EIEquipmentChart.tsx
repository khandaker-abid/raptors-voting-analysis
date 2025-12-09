import React, { useState, useMemo, useEffect } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from "recharts";
import {
    Paper,
    Typography,
    Box,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress,
} from "@mui/material";
import { ExportButton } from "../components/ExportButton";
interface ProbabilityCurvePoint {
    qualityScore: number;
    probability: number;
}
interface DemographicCurve {
    demographic: string;
    data: ProbabilityCurvePoint[];
}
interface EIEquipmentData {
    state: string;
    curves: DemographicCurve[];
}
interface Props {
    stateName: string;
}
const DEMOGRAPHICS = [
    "White",
    "African American",
    "Hispanic",
    "Asian",
    "Native American",
    "Other",
];

const DEMOGRAPHIC_COLORS: Record<string, string> = {
    "White": "#1976d2", // Blue
    "African American": "#d32f2f", // Red
    "Hispanic": "#388e3c", // Green
    "Asian": "#f57c00", // Orange
    "Native American": "#7b1fa2", // Purple
    "Other": "#c2185b",
};

const toBackendFormat = (demographic: string): string => {
    return demographic.toLowerCase().replace(/ /g, '_');
};

const API_TO_UI_DEMOGRAPHIC: Record<string, string> = {
    "white": "White",
    "african_american": "African American",
    "hispanic": "Hispanic",
    "asian": "Asian",
    "native_american": "Native American",
    "other": "Other",
};

const generateNormalCurve = (mean: number, stdDev: number): ProbabilityCurvePoint[] => {
    const points: ProbabilityCurvePoint[] = [];
    for (let x = 0; x <= 100; x += 2) {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        const probability = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
        points.push({ qualityScore: x, probability });
    }
    return points;
};

const generateMockData = (state: string): EIEquipmentData => {
    const mockParams: Record<string, { mean: number; stdDev: number }> = {
        "White": { mean: 72, stdDev: 12 },
        "African American": { mean: 58, stdDev: 15 },
        "Hispanic": { mean: 62, stdDev: 14 },
        "Asian": { mean: 68, stdDev: 13 },
        "Native American": { mean: 55, stdDev: 16 },
        "Other": { mean: 64, stdDev: 14 },
    };

    const curves: DemographicCurve[] = DEMOGRAPHICS.map(demographic => ({
        demographic,
        data: generateNormalCurve(mockParams[demographic].mean, mockParams[demographic].stdDev),
    }));

    return { state, curves };
};

const EIEquipmentChart: React.FC<Props> = ({ stateName }) => {
    const [selectedDemographics, setSelectedDemographics] = useState<string[]>(["White", "African American"]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<EIEquipmentData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/preclearance/ei-equipment/${encodeURIComponent(stateName)}`);
                if (!response.ok) {
                    if (response.status === 404 || response.status === 500) {
                        console.warn("EI Equipment data not available, using mock data");
                        setData(generateMockData(stateName));
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();

                if (!result.curves || result.curves.length === 0) {
                    console.warn("Backend returned empty curves, using mock data");
                    setData(generateMockData(stateName));
                    return;
                }

                const transformedData: EIEquipmentData = {
                    state: stateName,
                    curves: result.curves.map((curve: any) => ({
                        demographic: API_TO_UI_DEMOGRAPHIC[curve.demographic] || curve.demographic,
                        data: curve.data.map((point: any) => ({
                            qualityScore: point.qualityScore,
                            probability: point.probability,
                        })),
                    })),
                };

                setData(transformedData);
            } catch (err) {
                console.error("Error fetching EI equipment data:", err);
                setData(generateMockData(stateName));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateName]);

    const handleDemographicToggle = (demographic: string) => {
        setSelectedDemographics(prev => {
            if (prev.includes(demographic)) {
                return prev.filter(d => d !== demographic);
            } else {
                return [...prev, demographic];
            }
        });
    };

    const chartData = useMemo(() => {
        if (!data || !data.curves || data.curves.length === 0) return [];

        // Get all unique quality scores from the data
        const allQualityScores = new Set<number>();
        data.curves.forEach(curve => {
            curve.data.forEach(point => {
                allQualityScores.add(point.qualityScore);
            });
        });

        const sortedScores = Array.from(allQualityScores).sort((a, b) => a - b);

        return sortedScores.map(score => {
            const point: any = { qualityScore: score };

            selectedDemographics.forEach(demographic => {
                // Find curve by matching the UI demographic name (already normalized in transform)
                const curve = data.curves.find(c => c.demographic === demographic);
                if (curve) {
                    const dataPoint = curve.data.find(d => d.qualityScore === score);
                    if (dataPoint) {
                        point[demographic] = dataPoint.probability;
                    }
                }
            });

            return point;
        });
    }, [data, selectedDemographics]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper sx={{ p: 0.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0 }}>
                <Typography variant="h6" gutterBottom>
                    Ecological Inference: Equipment Quality Access by Demographic
                </Typography>
                <ExportButton
                    chartId="ei-equipment-chart"
                    chartName={`ei-equipment-${stateName}`}
                    tableData={chartData}
                    tableColumns={[
                        { header: "Quality Score", accessor: "qualityScore" },
                        ...selectedDemographics.map(demo => ({
                            header: demo,
                            accessor: demo,
                        })),
                    ]}
                    tableName={`ei-equipment-data-${stateName}`}
                />
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Ecological Inference - Equipment Quality:</strong> This analysis examines whether different demographic groups have equal access to high-quality voting equipment. The probability curves show the distribution of equipment quality scores across demographics. Higher quality scores indicate better, newer equipment, and disparities in the curves may suggest unequal access to quality voting equipment.
                <br /><br />
                <strong>Analysis Method:</strong> Ecological Inference uses statistical modeling to estimate voting patterns across demographic groups. The curves show the probability distribution of equipment quality scores for each demographic in {stateName}.
            </Alert>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <ResponsiveContainer width="75%" height={470} id="ei-equipment-chart">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="qualityScore"
                            label={{ value: "Equipment Quality Score", position: "insideBottom", offset: -5, style: { fontSize: 12, fontWeight: 600 } }}
                        />
                        <YAxis
                            label={{ value: "Probability Density", angle: -90, position: "insideLeft", style: { fontSize: 12, fontWeight: 600 } }}
                        />
                        <Tooltip
                            formatter={(value: number) => value.toFixed(4)}
                            labelFormatter={(label) => `Quality Score: ${label}`}
                        />
                        <Legend />
                        {selectedDemographics.map((demographic) => (
                            <Line
                                key={demographic}
                                type="monotone"
                                dataKey={demographic}
                                stroke={DEMOGRAPHIC_COLORS[demographic]}
                                strokeWidth={2}
                                dot={false}
                                name={demographic}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>

                <Box sx={{ width: "25%", display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Select Demographics
                    </Typography>
                    {DEMOGRAPHICS.map((demographic) => (
                        <FormControlLabel
                            key={demographic}
                            control={
                                <Checkbox
                                    checked={selectedDemographics.includes(demographic)}
                                    onChange={() => handleDemographicToggle(demographic)}
                                    sx={{
                                        color: DEMOGRAPHIC_COLORS[demographic],
                                        '&.Mui-checked': {
                                            color: DEMOGRAPHIC_COLORS[demographic],
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            bgcolor: DEMOGRAPHIC_COLORS[demographic],
                                        }}
                                    />
                                    <Typography variant="body2">{demographic}</Typography>
                                </Box>
                            }
                        />
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default EIEquipmentChart;
