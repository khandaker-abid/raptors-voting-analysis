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

type PartyCode = "R" | "D" | "U";

interface NormalizedBubbleDatum {
  county: string;
  republicanPct: number;
  dropBoxPct: number;
  party: PartyCode;
  totalBallots?: number;
  bubbleScale?: number;
  dropBoxVotes?: number;
  dataYear?: number;
}

interface RegressionLine {
  party: "R" | "D";
  coefficients: {
    a: number; // y = a * x^b
    b: number;
  };
}

interface Props {
  data: any[];
  regressionLines?: RegressionLine[]; // <- NEW
}

const clamp01 = (v: number) => Math.max(0, Math.min(100, v));

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DropBoxBubbleChart: React.FC<Props> = ({ data, regressionLines = [] }) => {
  const normalizedData = useMemo<NormalizedBubbleDatum[]>(() => {
    const toNumber = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const toPartyCode = (value: unknown, fallbackColor?: unknown): PartyCode => {
      if (typeof value === "string") {
        const upper = value.toUpperCase();
        if (upper.startsWith("R")) return "R";
        if (upper.startsWith("D")) return "D";
      }

      if (typeof fallbackColor === "string") {
        const color = fallbackColor.toLowerCase();
        if (color.includes("red")) return "R";
        if (color.includes("blue")) return "D";
      }

      return "U";
    };

    return (Array.isArray(data) ? data : [])
      .map((raw) => {
        const countyRaw =
          (raw?.geographicUnit as string) ||
          (raw?.county as string) ||
          (raw?.jurisdiction as string) ||
          (raw?.jurisdictionName as string) ||
          "Unknown";

        const county = toTitleCase(countyRaw);

        const republicanPct = toNumber(
          raw?.republicanPct ??
          raw?.republicanPercentage ??
          raw?.repPct ??
          raw?.repPercentage ??
          0
        );

        const dropBoxPct = toNumber(
          raw?.dropBoxPct ??
          raw?.dropBoxPercentage ??
          raw?.dropboxPct ??
          raw?.dropboxPercentage ??
          raw?.dropBoxPercent ??
          0
        );

        const totalBallots = toNumber(
          raw?.totalBallots ?? raw?.totalVotes ?? raw?.ballots
        );
        const bubbleScale = totalBallots > 0 ? Math.sqrt(totalBallots) : undefined;
        const dropBoxVotes = toNumber(raw?.dropBoxVotes ?? raw?.dropboxVotes);
        const dataYearValue = toNumber(raw?.dataYear ?? raw?.analysisYear ?? raw?.year);

        const party = toPartyCode(raw?.party ?? raw?.majorityParty, raw?.color);

        return {
          county,
          republicanPct,
          dropBoxPct,
          party,
          totalBallots: totalBallots > 0 ? totalBallots : undefined,
          bubbleScale,
          dropBoxVotes: dropBoxVotes > 0 ? dropBoxVotes : undefined,
          dataYear: dataYearValue > 0 ? Math.round(dataYearValue) : undefined,
        };
      })
      .filter(
        (item) =>
          item.county !== "Unknown" &&
          Number.isFinite(item.republicanPct) &&
          Number.isFinite(item.dropBoxPct)
      );
  }, [data]);

  const democraticData = normalizedData.filter((d) => d.party === "D");
  const republicanData = normalizedData.filter((d) => d.party === "R");
  const unknownData = normalizedData.filter((d) => d.party === "U"); const dataYears = useMemo<number[]>(() => {
    const years = new Set<number>();
    normalizedData.forEach((datum) => {
      if (datum.dataYear && Number.isFinite(datum.dataYear)) {
        years.add(datum.dataYear);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [normalizedData]);

  const subtitle = useMemo(() => {
    const maxDropBox = normalizedData.reduce((max, item) => Math.max(max, item.dropBoxPct), 0);

    const yearInfo = dataYears.length === 1
      ? ` (Data Year: ${dataYears[0]})`
      : dataYears.length > 1
        ? ` (Data Years: ${dataYears.join(", ")})`
        : "";

    // Add context for very low usage with more detail
    if (maxDropBox < 0.02 && maxDropBox > 0) {
      return `Drop Box % vs. Republican Vote % by County${yearInfo} - Note: Very low drop box usage in this state (max ${maxDropBox.toFixed(4)}%)`;
    }
    if (maxDropBox < 0.1 && maxDropBox > 0) {
      return `Drop Box % vs. Republican Vote % by County${yearInfo} - Note: Low drop box usage in this state`;
    }

    return `Drop Box % vs. Republican Vote % by County${yearInfo}`;
  }, [dataYears, normalizedData]);

  const yDomain = useMemo<[number, number]>(() => {
    const maxY = normalizedData.reduce(
      (max, item) => Math.max(max, item.dropBoxPct),
      0
    );
    if (maxY <= 0) {
      return [0, 0.1];
    }
    // For very small percentages (< 0.01%), use finer granularity
    if (maxY < 0.01) {
      return [0, Math.max(0.02, maxY * 1.5)];
    }
    // For small percentages (< 0.1%), cap at reasonable value
    if (maxY < 0.1) {
      return [0, Math.max(0.2, maxY * 1.5)];
    }
    if (maxY <= 1) {
      return [0, Math.max(1.5, maxY * 1.3)];
    }
    if (maxY <= 5) {
      return [0, Math.max(6, maxY * 1.2)];
    }
    const padded = Math.ceil(maxY + Math.max(1, maxY * 0.1));
    return [0, Math.min(100, padded)];
  }, [normalizedData]);

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

  const hasData = normalizedData.length > 0;

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
        {subtitle}
      </Typography>

      {/* Spacer to align with Gingles chart's demographic selection */}
      <Box sx={{ mb: 2, height: 72 }} />

      <Box sx={{ flex: 1, minHeight: 500, height: 500 }}>
        {!hasData ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            No drop box voting data available for the selected state and year.
          </Box>
        ) : normalizedData.length > 0 && yDomain[1] < 0.02 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              px: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
              Minimal Drop Box Usage Detected
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This state had extremely limited drop box ballot usage in {dataYears[0] || "the selected year"}.
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Maximum drop box usage: {yDomain[1].toFixed(4)}% of total votes
              <br />
              Average drop box usage: {(normalizedData.reduce((sum, item) => sum + item.dropBoxPct, 0) / normalizedData.length).toFixed(4)}%
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.disabled" }}>
              A meaningful bubble chart visualization requires higher drop box usage rates.
              This may indicate limited drop box availability or policy restrictions in this state during this election cycle.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="republicanPct"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="number"
                dataKey="dropBoxPct"
                domain={yDomain}
                tickFormatter={(v) =>
                  v === 0
                    ? '0%'
                    : Math.abs(v) < 0.01
                      ? `${v.toFixed(4)}%`
                      : Math.abs(v) < 0.1
                        ? `${v.toFixed(3)}%`
                        : Math.abs(v) < 1
                          ? `${v.toFixed(2)}%`
                          : Math.abs(v) < 10
                            ? `${v.toFixed(1)}%`
                            : `${Math.round(v)}%`
                }
              />
              <ZAxis range={[150, 400]} dataKey="bubbleScale" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;

                  const data = payload[0].payload as NormalizedBubbleDatum;
                  if (!data) return null;

                  const formatPercent = (val: number) => {
                    if (val === 0) return "0%";
                    if (val >= 10) return `${val.toFixed(1)}%`;
                    if (val >= 1) return `${val.toFixed(2)}%`;
                    if (val >= 0.1) return `${val.toFixed(3)}%`;
                    if (val >= 0.01) return `${val.toFixed(4)}%`;
                    return `${val.toFixed(5)}%`;
                  };

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
                        {data.county}
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Typography variant="body2" sx={{ fontSize: "12px" }}>
                          Drop Box %: {formatPercent(data.dropBoxPct)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px" }}>
                          Republican Vote %: {formatPercent(data.republicanPct)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
              <Legend verticalAlign="bottom" align="center" />

              {/* Bubbles */}
              <Scatter name="Democratic counties" data={democraticData} fill="#1976d2" fillOpacity={0.7} />
              <Scatter name="Republican counties" data={republicanData} fill="#d32f2f" fillOpacity={0.7} />
              {unknownData.length > 0 && (
                <Scatter
                  name="Missing election data"
                  data={unknownData}
                  fill="#6d6d6d"
                  fillOpacity={0.6}
                />
              )}

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
        )}
      </Box>
    </Paper>
  );
};

export default DropBoxBubbleChart;
