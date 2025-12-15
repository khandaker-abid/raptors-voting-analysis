import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchPartyComparison } from "../data/api";

interface PartyAggregates {
    count: number;
    avgRegistrationRate: number;
    avgTurnout: number;
    avgMailBallotRate: number;
    avgDropBoxRate: number;
    felonyRestrictiveCount: number;
    felonyPermissiveCount: number;
}

interface StateDetail {
    state: string;
    party: string;
    registrationRate: number;
    turnout: number;
    mailBallotRate: number;
    dropBoxRate: number;
    felonyPolicy: string;
    felonyRestrictive: boolean;
}

interface PartyComparisonData {
    republican: PartyAggregates;
    democratic: PartyAggregates;
    split: PartyAggregates;
    stateDetails: {
        Republican: StateDetail[];
        Democratic: StateDetail[];
        Split: StateDetail[];
    };
}

const COLORS = {
    Republican: "#c62828",
    Democratic: "#1565c0",
    Split: "#6d6d6d",
};

const PartyComparisonPage: React.FC = () => {
    const [data, setData] = useState<PartyComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const response = await fetchPartyComparison();
                if (!active) return;
                setData(response);
                setError(null);
            } catch (err) {
                if (!active) return;
                console.error("Failed to fetch party comparison data", err);
                setError("Unable to load party comparison data. Please try again later.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const chartData = useMemo(() => {
        if (!data) return [];
        return [
            {
                metric: "Registration Rate (%)",
                Republican: data.republican.avgRegistrationRate,
                Democratic: data.democratic.avgRegistrationRate,
                Split: data.split.avgRegistrationRate,
            },
            {
                metric: "Turnout (%)",
                Republican: data.republican.avgTurnout,
                Democratic: data.democratic.avgTurnout,
                Split: data.split.avgTurnout,
            },
            {
                metric: "Mail Ballot Rate (%)",
                Republican: data.republican.avgMailBallotRate,
                Democratic: data.democratic.avgMailBallotRate,
                Split: data.split.avgMailBallotRate,
            },
            {
                metric: "Drop Box Rate (%)",
                Republican: data.republican.avgDropBoxRate,
                Democratic: data.democratic.avgDropBoxRate,
                Split: data.split.avgDropBoxRate,
            },
        ];
    }, [data]);

    const felonyChartData = useMemo(() => {
        if (!data) return [];
        return [
            {
                category: "Restrictive Policies",
                Republican: data.republican.felonyRestrictiveCount,
                Democratic: data.democratic.felonyRestrictiveCount,
                Split: data.split.felonyRestrictiveCount,
            },
            {
                category: "Permissive Policies",
                Republican: data.republican.felonyPermissiveCount,
                Democratic: data.democratic.felonyPermissiveCount,
                Split: data.split.felonyPermissiveCount,
            },
        ];
    }, [data]);

    if (loading) {
        return (
            <Container sx={{ py: 3, display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 90px)" }}>
                <CircularProgress size={32} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!data) {
        return (
            <Container sx={{ py: 3 }}>
                <Alert severity="info">No party comparison data available.</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 1.5, height: "calc(100vh - 90px)", overflow: "hidden" }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    height: "100%",
                    gridTemplateRows: { xs: "auto auto 1fr", md: "auto 1fr" },
                }}
            >
                {/* Left column */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                            Party Comparison Analysis
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                            Compare voting metrics between Republican-controlled, Democratic-controlled, and Split states
                        </Typography>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                        <Card sx={{ bgcolor: "error.light", color: "white" }}>
                            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                                <Typography variant="subtitle1" fontWeight="bold">Republican States</Typography>
                                <Typography variant="h4" fontWeight="bold">{data.republican.count}</Typography>
                                <Typography variant="caption">jurisdictions</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ bgcolor: "#1976d2", color: "white" }}>
                            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                                <Typography variant="subtitle1" fontWeight="bold">Democratic States</Typography>
                                <Typography variant="h4" fontWeight="bold">{data.democratic.count}</Typography>
                                <Typography variant="caption">jurisdictions</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ bgcolor: "grey.600", color: "white" }}>
                            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                                <Typography variant="subtitle1" fontWeight="bold">Split Control</Typography>
                                <Typography variant="h4" fontWeight="bold">{data.split.count}</Typography>
                                <Typography variant="caption">jurisdictions</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Paper sx={{ p: 2, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Summary Statistics
                        </Typography>
                        <TableContainer sx={{ maxWidth: 680, alignSelf: "center", width: "100%" }}>
                            <Table size="small" sx={{ tableLayout: "fixed", "& td, & th": { py: 0.35, px: 0.55 } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white", width: "25%" }}>Metric</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white", width: "25%" }}>Republican</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white", width: "25%" }}>Democratic</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white", width: "25%" }}>Split</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Jurisdictions</TableCell>
                                        <TableCell align="right">{data.republican.count}</TableCell>
                                        <TableCell align="right">{data.democratic.count}</TableCell>
                                        <TableCell align="right">{data.split.count}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Avg Registration Rate (%)</TableCell>
                                        <TableCell align="right">{data.republican.avgRegistrationRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.democratic.avgRegistrationRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.split.avgRegistrationRate.toFixed(1)}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Avg Turnout (%)</TableCell>
                                        <TableCell align="right">{data.republican.avgTurnout.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.democratic.avgTurnout.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.split.avgTurnout.toFixed(1)}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Avg Mail Ballot Rate (%)</TableCell>
                                        <TableCell align="right">{data.republican.avgMailBallotRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.democratic.avgMailBallotRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.split.avgMailBallotRate.toFixed(1)}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Avg Drop Box Rate (%)</TableCell>
                                        <TableCell align="right">{data.republican.avgDropBoxRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.democratic.avgDropBoxRate.toFixed(1)}</TableCell>
                                        <TableCell align="right">{data.split.avgDropBoxRate.toFixed(1)}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Restrictive Felony Policies</TableCell>
                                        <TableCell align="right">{data.republican.felonyRestrictiveCount}</TableCell>
                                        <TableCell align="right">{data.democratic.felonyRestrictiveCount}</TableCell>
                                        <TableCell align="right">{data.split.felonyRestrictiveCount}</TableCell>
                                    </TableRow>
                                    <TableRow hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                                        <TableCell>Permissive Felony Policies</TableCell>
                                        <TableCell align="right">{data.republican.felonyPermissiveCount}</TableCell>
                                        <TableCell align="right">{data.democratic.felonyPermissiveCount}</TableCell>
                                        <TableCell align="right">{data.split.felonyPermissiveCount}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                {/* Right column */}
                <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 1.5, minHeight: 0 }}>
                    <Paper sx={{ p: 2, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Voting Metrics Comparison
                        </Typography>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    <Bar dataKey="Republican" fill={COLORS.Republican} />
                                    <Bar dataKey="Democratic" fill={COLORS.Democratic} />
                                    <Bar dataKey="Split" fill={COLORS.Split} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 2, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Felony Voting Policies
                        </Typography>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={felonyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    <Bar dataKey="Republican" fill={COLORS.Republican} />
                                    <Bar dataKey="Democratic" fill={COLORS.Democratic} />
                                    <Bar dataKey="Split" fill={COLORS.Split} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default PartyComparisonPage;
