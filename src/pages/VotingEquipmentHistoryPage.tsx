// GUI - 14 

import React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Container,
    Paper,
    Typography,
    Alert,
    Link,
    CircularProgress,
} from "@mui/material";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RTooltip,
} from "recharts";
import { fetchEquipmentHistory } from "../data/api";
import type { EquipmentHistorySeries } from "../data/types";

type Point = { year: number; value: number };

// Keep years as a literal tuple for stricter typing
const YEARS = [2016, 2018, 2020, 2022, 2024] as const;
type YearKey = typeof YEARS[number];

const CHART_HEIGHT = 220;

function makeSeriesPoints(series: EquipmentHistorySeries): Point[] {
    // Cast to numeric indexable map to avoid TS index error
    const byYear = series.byYear as Record<number, number | undefined>;
    return YEARS.map((y: YearKey) => ({ year: y, value: Number(byYear[y] ?? 0) }));
}

function ChartCard({
    title,
    points,
    barColor,
}: {
    title: string;
    points: Point[];
    barColor: string;
}) {
    const max = Math.max(0, ...points.map((p) => p.value));
    return (
        <Paper sx={{ p: 1.5, height: CHART_HEIGHT }}>
            <Typography variant="subtitle2" align="center" sx={{ mb: 0.5 }}>
                {title}
            </Typography>
            <Box sx={{ height: CHART_HEIGHT - 46 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={points} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="year"
                            tick={{ fontSize: 11 }}
                            axisLine={{ strokeOpacity: 0.3 }}
                            tickLine={{ strokeOpacity: 0.3 }}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            width={42}
                            axisLine={{ strokeOpacity: 0.3 }}
                            tickLine={{ strokeOpacity: 0.3 }}
                            domain={[0, Math.ceil(max * 1.1)]}
                        />
                        <RTooltip
                            formatter={(v: any) => v.toLocaleString()}
                            labelFormatter={(l: any) => `Year ${l}`}
                        />
                        {/* 🔵 Blue bars to match the rest of the app */}
                        <Bar dataKey="value" fill={barColor} barSize={22} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

const VotingEquipmentHistoryPage: React.FC = () => {
    const params = useParams<{ stateName: string }>();
    const stateName = params.stateName || "";
    const decodedStateName = decodeURIComponent(stateName);
    const gray = "#616161"; // Grayscale for non-partisan equipment data

    const [rows, setRows] = React.useState<EquipmentHistorySeries[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                const data = await fetchEquipmentHistory(decodedStateName);
                if (!cancel) setRows(data || []);
            } catch (e: any) {
                if (!cancel) setError(e?.message || "Failed to load history");
            }
        })();
        return () => {
            cancel = true;
        };
    }, [decodedStateName]);

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Link component={RouterLink} to="/per-state-voting-equipment">
                    ← Back to per-state equipment
                </Link>
            </Container>
        );
    }

    if (!rows) {
        return (
            <Container maxWidth="lg" sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    // Keep a predictable category order
    const order = ["DRE no VVPAT", "DRE with VVPAT", "Ballot Marking Device", "Scanner"];
    const sorted = [...rows].sort(
        (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
    );

    return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <Box sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                    Voting Equipment History — {decodedStateName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Bars show device counts for federal election years 2016–2024.
                </Typography>
            </Box>

            {/* ✅ No MUI Grid — pure CSS Grid via Box; avoids type issues.
          2×2 layout at md+, one column on small screens. */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 1.5,
                }}
            >
                {sorted.map((s) => (
                    <ChartCard
                        key={s.category}
                        title={`Devices by Year — ${s.category}`}
                        points={makeSeriesPoints(s)}
                        barColor={gray}
                    />
                ))}
            </Box>

            <Box sx={{ mt: 1.5 }}>
                <Link component={RouterLink} to="/per-state-voting-equipment">
                    ← Back to per-state voting equipment
                </Link>
            </Box>
        </Container>
    );
};

export default VotingEquipmentHistoryPage;
