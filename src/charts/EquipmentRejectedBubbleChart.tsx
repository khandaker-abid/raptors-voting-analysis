// components/EquipmentRejectedBubbleChart.tsx
// GUI-25 & GUI-26: Bubble chart with non-linear regression lines
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Paper, Typography, Box, Alert } from "@mui/material";

interface BubbleData {
  county: string;
  equipmentQuality: number;
  rejectedPct: number;
  party: "R" | "D";
}

interface RegressionLine {
  party: "R" | "D";
  coefficients: { a: number; b: number }; // non-linear model: y = a * x^b
}

interface Props {
  data: BubbleData[];
  regressionLines?: RegressionLine[];
}

const EquipmentRejectedBubbleChart: React.FC<Props> = ({ data, regressionLines = [] }) => {
  // Generate regression curve points from coefficients (GUI-26)
  const regressionData = useMemo(() => {
    if (regressionLines.length === 0) return [];

    // Generate points for smooth curves
    const points: any[] = [];
    for (let x = 0; x <= 100; x += 1) {
      const point: any = { equipmentQuality: x };

      regressionLines.forEach((line) => {
        // Power regression: y = a * x^b
        const y = line.coefficients.a * Math.pow(x, line.coefficients.b);
        const key = line.party === "R" ? "republicanRegression" : "democraticRegression";
        point[key] = Math.max(0, Math.min(100, y)); // Clamp to 0-100
      });

      points.push(point);
    }

    return points;
  }, [regressionLines]);

  // Separate data by party
  const republicanData = useMemo(() => data.filter((d) => d.party === "R"), [data]);
  const democraticData = useMemo(() => data.filter((d) => d.party === "D"), [data]);

  // Check if we have regression lines
  const hasRepublicanRegression = regressionLines.some((l) => l.party === "R");
  const hasDemocraticRegression = regressionLines.some((l) => l.party === "D");

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Equipment Quality vs Rejected Ballots (GUI-25)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each bubble represents a county. Red = Republican majority, Blue = Democratic majority.
        {(hasRepublicanRegression || hasDemocraticRegression) && (
          <> Regression lines show the statistical correlation between equipment quality and rejection rates.</>
        )}
      </Typography>

      {regressionLines.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Calculating regression lines... (GUI-26)
        </Alert>
      )}

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          <XAxis
            type="number"
            dataKey="equipmentQuality"
            name="Equipment Quality Score"
            domain={[0, 100]}
            label={{ value: "Equipment Quality Score (0-100)", position: "insideBottom", offset: -10 }}
            tick={{ fontSize: 12 }}
          />

          <YAxis
            type="number"
            dataKey="rejectedPct"
            name="Rejected Ballot %"
            domain={[0, "auto"]}
            label={{ value: "Rejected Ballots (%)", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;

              const data = payload[0].payload;

              // Check if this is a bubble or regression line
              if (data.county) {
                return (
                  <Box sx={{ bgcolor: "white", p: 1.5, border: "1px solid #ccc", borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {data.county}
                    </Typography>
                    <Typography variant="body2">
                      Equipment Quality: {data.equipmentQuality?.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      Rejected: {data.rejectedPct?.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: data.party === "R" ? "#d32f2f" : "#1976d2" }}>
                      {data.party === "R" ? "Republican" : "Democratic"} Majority
                    </Typography>
                  </Box>
                );
              }

              return null;
            }}
          />

          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ paddingBottom: "10px" }}
          />

          {/* Republican Bubbles */}
          <Scatter
            name="Republican Counties"
            data={republicanData}
            fill="#d32f2f"
            fillOpacity={0.6}
            shape="circle"
          />

          {/* Democratic Bubbles */}
          <Scatter
            name="Democratic Counties"
            data={democraticData}
            fill="#1976d2"
            fillOpacity={0.6}
            shape="circle"
          />

          {/* GUI-26: Republican Regression Line */}
          {hasRepublicanRegression && (
            <Line
              name="Republican Regression (GUI-26)"
              data={regressionData}
              type="monotone"
              dataKey="republicanRegression"
              stroke="#d32f2f"
              strokeWidth={3}
              dot={false}
              strokeDasharray="5 5"
              legendType="line"
            />
          )}

          {/* GUI-26: Democratic Regression Line */}
          {hasDemocraticRegression && (
            <Line
              name="Democratic Regression (GUI-26)"
              data={regressionData}
              type="monotone"
              dataKey="democraticRegression"
              stroke="#1976d2"
              strokeWidth={3}
              dot={false}
              strokeDasharray="5 5"
              legendType="line"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Regression Statistics */}
      {regressionLines.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Non-Linear Regression Coefficients (y = a × x^b):
          </Typography>
          {regressionLines.map((line) => (
            <Typography
              key={line.party}
              variant="body2"
              sx={{ color: line.party === "R" ? "#d32f2f" : "#1976d2" }}
            >
              {line.party === "R" ? "Republican" : "Democratic"}:
              a = {line.coefficients.a.toFixed(4)},
              b = {line.coefficients.b.toFixed(4)}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default EquipmentRejectedBubbleChart;
