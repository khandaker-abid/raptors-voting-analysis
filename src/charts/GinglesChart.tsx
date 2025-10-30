// GUI-27: Display Gingles Chart
// For preclearance state (Maryland)
// Shows racially polarized voting patterns
// Two bubbles per precinct (Democratic % and Republican %)
// X-axis: % of selected demographic group
// Y-axis: % of votes for that party

import React, { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    Line,
} from "recharts";
import {
    Paper,
    Typography,
    Box,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";

interface PrecinctData {
    precinct: string;
    // Vote percentages
    democraticPct: number;
    republicanPct: number;
    // Demographic percentages
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
    // Regression coefficients: y = a * x^b
    democraticRegression?: RegressionCoefficients;
    republicanRegression?: RegressionCoefficients;
}

const GinglesChart: React.FC<Props> = ({
    stateName,
    data,
    democraticRegression,
    republicanRegression,
}) => {
    const [selectedDemographics, setSelectedDemographics] = useState({
        white: true,
        hispanic: true,
        africanAmerican: true,
    });

    const demographicKey =
        selectedDemographics.white && selectedDemographics.hispanic && selectedDemographics.africanAmerican
            ? "all"
            : selectedDemographics.white
                ? "white"
                : selectedDemographics.hispanic
                    ? "hispanic"
                    : "africanAmerican";

    // Transform data for charting
    const chartData = useMemo(() => {
        const points: GinglesDataPoint[] = [];

        data.forEach((precinct) => {
            // Get the selected demographic percentage
            let demographicPct: number;
            if (demographicKey === "all") {
                // Average all demographics
                demographicPct =
                    (precinct.whitePct +
                        precinct.hispanicPct +
                        precinct.africanAmericanPct) /
                    3;
            } else if (demographicKey === "white") {
                demographicPct = precinct.whitePct;
            } else if (demographicKey === "hispanic") {
                demographicPct = precinct.hispanicPct;
            } else {
                demographicPct = precinct.africanAmericanPct;
            }

            // Add Democratic bubble
            points.push({
                precinct: precinct.precinct,
                demographicPct,
                votePct: precinct.democraticPct,
                party: "D",
            });

            // Add Republican bubble
            points.push({
                precinct: precinct.precinct,
                demographicPct,
                votePct: precinct.republicanPct,
                party: "R",
            });
        });

        return points;
    }, [data, demographicKey]);

    // Generate regression lines
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

    const handleDemographicChange = (demographic: keyof typeof selectedDemographics) => {
        setSelectedDemographics((prev) => ({
            ...prev,
            [demographic]: !prev[demographic],
        }));
    };

    const democraticPoints = chartData.filter((d) => d.party === "D");
    const republicanPoints = chartData.filter((d) => d.party === "R");

    const getDemographicLabel = () => {
        if (selectedDemographics.white && !selectedDemographics.hispanic && !selectedDemographics.africanAmerican) {
            return "White";
        }
        if (!selectedDemographics.white && selectedDemographics.hispanic && !selectedDemographics.africanAmerican) {
            return "Hispanic";
        }
        if (!selectedDemographics.white && !selectedDemographics.hispanic && selectedDemographics.africanAmerican) {
            return "African American";
        }
        return "Selected Demographics";
    };

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Gingles Chart - Racially Polarized Voting Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {stateName} - 2024 Presidential Election
            </Typography>

            {/* Demographic Selection */}
            <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Select Demographic Group:
                </Typography>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedDemographics.white}
                                onChange={() => handleDemographicChange("white")}
                            />
                        }
                        label="White"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedDemographics.hispanic}
                                onChange={() => handleDemographicChange("hispanic")}
                            />
                        }
                        label="Hispanic"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedDemographics.africanAmerican}
                                onChange={() => handleDemographicChange("africanAmerican")}
                            />
                        }
                        label="African American"
                    />
                </FormGroup>
            </Box>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="demographicPct"
                        name={`${getDemographicLabel()} %`}
                        domain={[0, 100]}
                        label={{
                            value: `Percentage of ${getDemographicLabel()} Population`,
                            position: "insideBottom",
                            offset: -10,
                        }}
                    />
                    <YAxis
                        type="number"
                        dataKey="votePct"
                        name="Vote %"
                        domain={[0, 100]}
                        label={{
                            value: "Percentage of Votes",
                            angle: -90,
                            position: "insideLeft",
                        }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value: number, name: string) => {
                            if (name === "votePct") return [`${value.toFixed(1)}%`, "Vote %"];
                            if (name === "demographicPct")
                                return [`${value.toFixed(1)}%`, `${getDemographicLabel()} %`];
                            return [value, name];
                        }}
                        labelFormatter={(_, payload) => {
                            const data = payload?.[0]?.payload;
                            return data
                                ? `${data.precinct} (${data.party === "D" ? "Democratic" : "Republican"})`
                                : "";
                        }}
                    />
                    <Legend />

                    {/* Bubbles */}
                    <Scatter
                        name="Democratic Votes"
                        data={democraticPoints}
                        fill="#1976d2"
                    />
                    <Scatter
                        name="Republican Votes"
                        data={republicanPoints}
                        fill="#d32f2f"
                    />

                    {/* Regression Lines */}
                    {regressionLines.map((line, index) => (
                        <Line
                            key={index}
                            type="monotone"
                            data={line.points}
                            dataKey="votePct"
                            stroke={line.party === "D" ? "#1976d2" : "#d32f2f"}
                            strokeWidth={3}
                            dot={false}
                            name={`${line.party === "D" ? "Democratic" : "Republican"} Trend`}
                        />
                    ))}
                </ScatterChart>
            </ResponsiveContainer>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                The Gingles chart helps identify racially polarized voting patterns. Separate trend
                lines for each party suggest different voting behaviors across demographic groups.
            </Typography>
        </Paper>
    );
};

export default GinglesChart;
