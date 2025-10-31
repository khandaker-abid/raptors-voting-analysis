// components/DropBoxBubbleChart.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
  Legend,
  CartesianGrid,
  Line,
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";

interface BubbleData {
  county: string;
  republicanPct: number; // x
  dropBoxPct: number;    // y
  party: "R" | "D";
  totalBallots?: number; // optional: for bubble size if you add it later
}

interface RegressionLine {
  party: "R" | "D";
  coefficients: {
    a: number; // y = a * x^b
    b: number;
  };
}

interface Props {
  data: BubbleData[];
  regressionLines?: RegressionLine[]; // <- NEW
}

const clamp01 = (v: number) => Math.max(0, Math.min(100, v));

const DropBoxBubbleChart: React.FC<Props> = ({ data, regressionLines = [] }) => {
  const democraticData = data.filter((d) => d.party === "D");
  const republicanData = data.filter((d) => d.party === "R");

  // Precompute line points from coefficients (non-linear y = a * x^b)
  const { dLine, rLine } = useMemo(() => {
    const pointsFor = (a: number, b: number) => {
      const pts: Array<{ republicanPct: number; dropBoxPct: number }> = [];
      for (let x = 0; x <= 100; x += 2) {
        const y = a * Math.pow(x, b);
        pts.push({ republicanPct: x, dropBoxPct: clamp01(y) });
      }
      return pts;
    };

    const d = regressionLines.find((r) => r.party === "D");
    const r = regressionLines.find((r) => r.party === "R");

    return {
      dLine: d ? pointsFor(d.coefficients.a, d.coefficients.b) : [],
      rLine: r ? pointsFor(r.coefficients.a, r.coefficients.b) : [],
    };
  }, [regressionLines]);

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="subtitle1"
        align="center"
        gutterBottom
        fontWeight={600}
        sx={{ mb: 0.5 }}
      >
        Drop Box Voting Bubble Chart
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ mb: 1, display: "block" }}
      >
        Drop Box % vs. Republican Vote % by County (Arkansas 2020, Maryland & Rhode Island 2024)
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="republicanPct"
              name="Republican %"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="number"
              dataKey="dropBoxPct"
              name="Drop Box Voting %"
              domain={[0, 10]}
              tickFormatter={(v) => `${v}%`}
            />
            <ZAxis
              // If you later pass totalBallots, uncomment dataKey below
              // dataKey="totalBallots"
              range={[150, 400]}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, name: string, props: any) => {
                if (name === "republicanPct") return [`${value}%`, "Republican %"];
                if (name === "dropBoxPct") return [`${value}%`, "Drop Box %"];
                return [value, name];
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.county ?? ""}
            />
            <Legend />

            {/* Bubbles */}
            <Scatter name="Democratic counties" data={democraticData} fill="#1976d2" />
            <Scatter name="Republican counties" data={republicanData} fill="#d32f2f" />

            {/* Regression lines (non-linear) */}
            {dLine.length > 0 && (
              <Line
                name="Democratic regression"
                type="monotone"
                data={dLine}
                dataKey="dropBoxPct"
                dot={false}
                stroke="#1976d2"
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            )}
            {rLine.length > 0 && (
              <Line
                name="Republican regression"
                type="monotone"
                data={rLine}
                dataKey="dropBoxPct"
                dot={false}
                stroke="#d32f2f"
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DropBoxBubbleChart;
