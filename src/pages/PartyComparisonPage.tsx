import React, { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	CircularProgress,
	Alert,
	Card,
	CardContent,
	Container,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchPartyComparison } from '../data/api';

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

const PartyComparisonPage: React.FC = () => {
	const [data, setData] = useState<PartyComparisonData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				const result = await fetchPartyComparison();
				setData(result);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load party comparison data');
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	if (loading) {
		return (
			<Container>
				<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
					<CircularProgress />
				</Box>
			</Container>
		);
	}

	if (error || !data) {
		return (
			<Container>
				<Box p={3}>
					<Alert severity="error">{error || 'No data available'}</Alert>
				</Box>
			</Container>
		);
	}

	// Prepare chart data
	const chartData = [
		{
			metric: 'Registration Rate (%)',
			Republican: data.republican.avgRegistrationRate,
			Democratic: data.democratic.avgRegistrationRate,
			Split: data.split.avgRegistrationRate,
		},
		{
			metric: 'Turnout (%)',
			Republican: data.republican.avgTurnout,
			Democratic: data.democratic.avgTurnout,
			Split: data.split.avgTurnout,
		},
		{
			metric: 'Mail Ballot Rate (%)',
			Republican: data.republican.avgMailBallotRate,
			Democratic: data.democratic.avgMailBallotRate,
			Split: data.split.avgMailBallotRate,
		},
		{
			metric: 'Drop Box Rate (%)',
			Republican: data.republican.avgDropBoxRate,
			Democratic: data.democratic.avgDropBoxRate,
			Split: data.split.avgDropBoxRate,
		},
	];

	const felonyChartData = [
		{
			category: 'Restrictive',
			Republican: data.republican.felonyRestrictiveCount,
			Democratic: data.democratic.felonyRestrictiveCount,
			Split: data.split.felonyRestrictiveCount,
		},
		{
			category: 'Permissive',
			Republican: data.republican.felonyPermissiveCount,
			Democratic: data.democratic.felonyPermissiveCount,
			Split: data.split.felonyPermissiveCount,
		},
	];

	const COLORS = {
		Republican: '#d32f2f',
		Democratic: '#1976d2',
		Split: '#757575',
	};

	return (
		<Container sx={{ py: 1.5, height: 'calc(100vh - 90px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
				Party Comparison Analysis
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				Compare voting metrics between Republican-controlled, Democratic-controlled, and Split states
			</Typography>

			{/* Summary Cards */}
			<Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
				<Box sx={{ flex: 1 }}>
					<Card sx={{ bgcolor: 'error.light', color: 'white' }}>
						<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
							<Typography variant="subtitle1" fontWeight="bold">Republican States</Typography>
							<Typography variant="h4" fontWeight="bold">{data.republican.count}</Typography>
							<Typography variant="caption">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
				<Box sx={{ flex: 1 }}>
					<Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
						<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
							<Typography variant="subtitle1" fontWeight="bold">Democratic States</Typography>
							<Typography variant="h4" fontWeight="bold">{data.democratic.count}</Typography>
							<Typography variant="caption">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
				<Box sx={{ flex: 1 }}>
					<Card sx={{ bgcolor: 'grey.600', color: 'white' }}>
						<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
							<Typography variant="subtitle1" fontWeight="bold">Split Control</Typography>
							<Typography variant="h4" fontWeight="bold">{data.split.count}</Typography>
							<Typography variant="caption">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
			</Box>

			{/* Charts in two columns */}
			<Box sx={{ display: 'flex', gap: 2, mb: 1.5, flex: '1 1 auto', minHeight: 0 }}>
				{/* Voting Metrics Chart */}
				<Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
								<Legend wrapperStyle={{ fontSize: '12px' }} />
								<Bar dataKey="Republican" fill={COLORS.Republican} />
								<Bar dataKey="Democratic" fill={COLORS.Democratic} />
								<Bar dataKey="Split" fill={COLORS.Split} />
							</BarChart>
						</ResponsiveContainer>
					</Box>
				</Paper>

				{/* Felony Voting Policies Chart */}
				<Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
								<Legend wrapperStyle={{ fontSize: '12px' }} />
								<Bar dataKey="Republican" fill={COLORS.Republican} />
								<Bar dataKey="Democratic" fill={COLORS.Democratic} />
								<Bar dataKey="Split" fill={COLORS.Split} />
							</BarChart>
						</ResponsiveContainer>
					</Box>
				</Paper>
			</Box>

			{/* Summary Table */}
			<Paper sx={{ p: 2 }}>
				<Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
					Summary Statistics
				</Typography>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Metric</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Republican</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Democratic</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Split</TableCell>
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
		</Container>
	);
};

export default PartyComparisonPage;
