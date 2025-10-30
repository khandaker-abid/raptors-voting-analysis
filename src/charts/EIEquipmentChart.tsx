// GUI-28: Ecological Inference - Equipment Quality Access
// For preclearance state (Maryland)
// Shows probability curves for equipment quality by demographic group
// X-axis: Equipment quality score (0-100)
// Y-axis: Probability density

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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { ExportButton } from "../components/ExportButton";

interface ProbabilityCurvePoint {
    qualityScore: number; // 0-100
    probability: number; // 0-1
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
    "White": "#3498db",
    "African American": "#e74c3c",
    "Hispanic": "#f39c12",
    "Asian": "#2ecc71",
    "Native American": "#9b59b6",
    "Other": "#95a5a6",
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
                const response = await fetch(`http://localhost:8080/api/preclearance/ei-equipment/${stateName}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();

                // Transform backend data to match component interface
                const transformedData: EIEquipmentData = {
                    state: stateName,
                    curves: result.curves.map((curve: any) => ({
                        demographic: curve.demographic,
                        data: curve.data.map((point: any) => ({
                            qualityScore: point.qualityScore,
                            probability: point.probability,
                        })),
                    })),
                };

                setData(transformedData);
            } catch (err) {
                setError("Failed to load EI equipment analysis data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateName]);

    const handleDemographicChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        setSelectedDemographics(typeof value === 'string' ? value.split(',') : value);
    };

    // Combine data for all selected demographics
    const chartData = useMemo(() => {
        if (!data) return [];

        const qualityScores = Array.from({ length: 51 }, (_, i) => i * 2);

        return qualityScores.map(score => {
            const point: any = { qualityScore: score };

            selectedDemographics.forEach(demographic => {
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
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
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
                This chart shows the probability distribution of equipment quality scores across different
                demographic groups. Higher quality scores indicate better, newer equipment. Disparities in
                the curves may suggest unequal access to quality voting equipment.
            </Alert>

            <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Select Demographics to Compare</InputLabel>
                    <Select
                        multiple
                        value={selectedDemographics}
                        onChange={handleDemographicChange}
                        renderValue={(selected) => selected.join(", ")}
                    >
                        {DEMOGRAPHICS.map((demographic) => (
                            <MenuItem key={demographic} value={demographic}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            bgcolor: DEMOGRAPHIC_COLORS[demographic],
                                        }}
                                    />
                                    {demographic}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <ResponsiveContainer width="100%" height={400} id="ei-equipment-chart">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="qualityScore"
                        label={{ value: "Equipment Quality Score", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis
                        label={{ value: "Probability Density", angle: -90, position: "insideLeft" }}
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

            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Analysis Method:</strong> Ecological Inference uses statistical modeling
                    to estimate voting patterns across demographic groups. The curves show the probability
                    distribution of equipment quality scores for each demographic in {stateName}.
                </Typography>
            </Box>
        </Paper>
    );
};

export default EIEquipmentChart;
