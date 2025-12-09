/**
 * Gingles Chart for preclearance states showing racially polarized voting patterns.
 * Two bubbles per precinct (Democratic % and Republican %)
 * X-axis: % of selected demographic group
 * Y-axis: % of votes for that party
 */

import React, { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Line,
    Legend,
} from "recharts";
import {
    Paper,
    Typography,
    Box,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Alert,
} from "@mui/material";
import { CHART_HEIGHTS } from "../constants";

interface PrecinctData {
    precinct: string;
    democraticPct: number;
    republicanPct: number;
    whitePct: number;
    hispanicPct: number;
    africanAmericanPct: number;
}

interface GinglesDataPoint {
    precinct: string;
    demographicPct: number;
    votePct: number;
    party: "D" | "R";
}

interface RegressionCoefficients {
    a: number;
    b: number;
}

interface Props {
    stateName: string;
    data: PrecinctData[];
    democraticRegression?: RegressionCoefficients;
    republicanRegression?: RegressionCoefficients;
}

const GinglesChart: React.FC<Props> = ({
    data,
    democraticRegression,
    republicanRegression,
}) => {
    const [selectedDemographic, setSelectedDemographic] = useState<"white" | "hispanic" | "africanAmerican">("white");

    const demographicKey = selectedDemographic;

    const chartData = useMemo(() => {
        const points: GinglesDataPoint[] = [];

        data.forEach((precinct) => {
            let demographicPct: number;
            if (demographicKey === "white") {
                demographicPct = precinct.whitePct;
            } else if (demographicKey === "hispanic") {
                demographicPct = precinct.hispanicPct;
            } else {
                demographicPct = precinct.africanAmericanPct;
            }

            points.push({
                precinct: precinct.precinct,
                demographicPct,
                votePct: precinct.democraticPct,
                party: "D",
            });

            points.push({
                precinct: precinct.precinct,
                demographicPct,
                votePct: precinct.republicanPct,
                party: "R",
            });
        });

        return points;
    }, [data, demographicKey]);

    const regressionLines = useMemo(() => {
        const lines: {
            party: "D" | "R";
            points: Array<{ demographicPct: number; votePct: number }>;
        }[] = [];

        if (democraticRegression) {
            const dPoints = [];
            for (let x = 0; x <= 100; x += 2) {
                const y = Math.max(
                    0,
                    Math.min(
                        100,
                        democraticRegression.a * Math.pow(x, democraticRegression.b)
                    )
                );
                dPoints.push({ demographicPct: x, votePct: y });
            }
            lines.push({ party: "D", points: dPoints });
        }

        if (republicanRegression) {
            const rPoints = [];
            for (let x = 0; x <= 100; x += 2) {
                const y = Math.max(
                    0,
                    Math.min(
                        100,
                        republicanRegression.a * Math.pow(x, republicanRegression.b)
                    )
                );
                rPoints.push({ demographicPct: x, votePct: y });
            }
            lines.push({ party: "R", points: rPoints });
        }

        return lines;
    }, [democraticRegression, republicanRegression]);

    const handleDemographicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDemographic(event.target.value as "white" | "hispanic" | "africanAmerican");
    };

    const democraticPoints = chartData.filter((d) => d.party === "D");
    const republicanPoints = chartData.filter((d) => d.party === "R");

    const getDemographicLabel = () => {
        if (selectedDemographic === "white") return "White";
        if (selectedDemographic === "hispanic") return "Hispanic";
        if (selectedDemographic === "africanAmerican") return "African American";
        return "White";
    };

    return (
        <Paper
            sx={{
                p: 2,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography
                variant="subtitle1"
                align="center"
                sx={{
                    fontWeight: 600,
                    mb: 0.5,
                }}
            >
                Gingles Chart - Racially Polarized Voting Analysis
            </Typography>

            {/* Description */}
            <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{
                    mb: 1,
                    display: "block",
                }}
            >
                Vote % vs. Demographic % by Precinct (Data Year: 2024)
            </Typography>

            {/* Demographic Selection */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                <FormControl>
                    <Typography variant="subtitle2" gutterBottom sx={{ textAlign: "center" }}>
                        Select Demographic Group:
                    </Typography>
                    <RadioGroup
                        row
                        value={selectedDemographic}
                        onChange={handleDemographicChange}
                    >
                        <FormControlLabel
                            value="white"
                            control={<Radio />}
                            label="White"
                        />
                        <FormControlLabel
                            value="hispanic"
                            control={<Radio />}
                            label="Hispanic"
                        />
                        <FormControlLabel
                            value="africanAmerican"
                            control={<Radio />}
                            label="African American"
                        />
                    </RadioGroup>
                </FormControl>
            </Box>

            {/* Chart */}
            {data.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    No precinct data available for this state.
                </Alert>
            ) : (
                <Box sx={{ flex: 1, minHeight: CHART_HEIGHTS.STANDARD, height: CHART_HEIGHTS.STANDARD }}>
                    <ResponsiveContainer width="100%" height={CHART_HEIGHTS.STANDARD}>
                        <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                dataKey="demographicPct"
                                name={`${getDemographicLabel()} %`}
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                                type="number"
                                dataKey="votePct"
                                name="Vote %"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                content={({ payload }) => {
                                    if (!payload || payload.length === 0) return null;

                                    const data = payload[0].payload as GinglesDataPoint;
                                    if (!data) return null;

                                    return (
                                        <Box
                                            sx={{
                                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                padding: "8px 12px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600, fontSize: "14px", mb: 0.5, color: "#000" }}>
                                                {data.precinct}
                                            </Typography>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontSize: "12px" }}>
                                                    {getDemographicLabel()} %: {data.demographicPct.toFixed(1)}%
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: "12px" }}>
                                                    {data.party === "D" ? "Democratic" : "Republican"} Vote %: {data.votePct.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                }}
                            />
                            <Legend verticalAlign="bottom" align="center" />

                            {/* Democratic Bubbles - Blue */}
                            <Scatter
                                name="Democratic counties"
                                data={democraticPoints}
                                fill="#1976d2"
                                fillOpacity={0.7}
                            />

                            {/* Republican Bubbles - Red */}
                            <Scatter
                                name="Republican counties"
                                data={republicanPoints}
                                fill="#d32f2f"
                                fillOpacity={0.7}
                            />

                            {/* Regression Lines - Don't show in legend */}
                            {regressionLines.map((line, index) => (
                                <Line
                                    key={index}
                                    name={line.party === "D" ? "Democratic regression" : "Republican regression"}
                                    type="monotone"
                                    data={line.points}
                                    dataKey="votePct"
                                    stroke={line.party === "D" ? "#1976d2" : "#d32f2f"}
                                    strokeWidth={3}
                                    dot={false}
                                    strokeDasharray="5 5"
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
};

export default GinglesChart;
