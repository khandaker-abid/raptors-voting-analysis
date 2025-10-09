// components/EquipmentRejectedBubbleChart.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  CartesianGrid,
} from "recharts";
import { Paper, Typography } from "@mui/material";

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
  // Generate regression curve points from coefficients
  const regressionCurves = useMemo(() => {
    return regressionLines.map((line) => {
      const points: { equipmentQuality: number; rejectedPct: number }[] = [];
      for (let x = 0; x <= 100; x += 2) {
        const y = line.coefficients.a * Math.pow(x, line.coefficients.b);
        points.push({ equipmentQuality: x, rejectedPct: y });
      }
      return { party: line.party, points };
    });
  }, [regressionLines]);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Equipment Quality vs Rejected Ballots
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="equipmentQuality"
            name="Equipment Quality"
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="rejectedPct"
            name="Rejected %"
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend />

          {/* Bubbles */}
          <Scatter
            data={data.filter((d) => d.party === "R")}
            fill="#d32f2f"
            name="Republican Counties"
          />
          <Scatter
            data={data.filter((d) => d.party === "D")}
            fill="#1976d2"
            name="Democratic Counties"
          />

          {/* Regression Lines */}
          {regressionCurves.map((curve, i) => (
            <Line
              key={i}
              type="monotone"
              data={curve.points}
              dataKey="rejectedPct"
              dot={false}
              stroke={curve.party === "R" ? "#d32f2f" : "#1976d2"}
              strokeWidth={2}
              name={`${curve.party === "R" ? "Republican" : "Democratic"} Regression`}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default EquipmentRejectedBubbleChart;
