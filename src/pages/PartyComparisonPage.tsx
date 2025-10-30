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
	Divider,
	Container,
	Stack,
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
		<Container sx={{ py: 4 }}>
			<Typography variant="h4" gutterBottom fontWeight="bold">
				Party Comparison Analysis
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				Compare voting metrics between Republican-controlled, Democratic-controlled, and Split states
			</Typography>

			<Divider sx={{ my: 3 }} />

			{/* Summary Cards */}
			<Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
				<Box sx={{ flex: '1 1 300px' }}>
					<Card sx={{ bgcolor: 'error.light', color: 'white' }}>
						<CardContent>
							<Typography variant="h6">Republican States</Typography>
							<Typography variant="h3">{data.republican.count}</Typography>
							<Typography variant="body2">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
				<Box sx={{ flex: '1 1 300px' }}>
					<Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
						<CardContent>
							<Typography variant="h6">Democratic States</Typography>
							<Typography variant="h3">{data.democratic.count}</Typography>
							<Typography variant="body2">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
				<Box sx={{ flex: '1 1 300px' }}>
					<Card sx={{ bgcolor: 'grey.600', color: 'white' }}>
						<CardContent>
							<Typography variant="h6">Split Control</Typography>
							<Typography variant="h3">{data.split.count}</Typography>
							<Typography variant="body2">jurisdictions</Typography>
						</CardContent>
					</Card>
				</Box>
			</Box>

			{/* Voting Metrics Chart */}
			<Paper sx={{ p: 3, mb: 4 }}>
				<Typography variant="h6" gutterBottom>
					Voting Metrics Comparison
				</Typography>
				<ResponsiveContainer width="100%" height={400}>
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="metric" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="Republican" fill={COLORS.Republican} />
						<Bar dataKey="Democratic" fill={COLORS.Democratic} />
						<Bar dataKey="Split" fill={COLORS.Split} />
					</BarChart>
				</ResponsiveContainer>
			</Paper>

			{/* Felony Voting Policies Chart */}
			<Paper sx={{ p: 3, mb: 4 }}>
				<Typography variant="h6" gutterBottom>
					Felony Voting Policies
				</Typography>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={felonyChartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="category" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="Republican" fill={COLORS.Republican} />
						<Bar dataKey="Democratic" fill={COLORS.Democratic} />
						<Bar dataKey="Split" fill={COLORS.Split} />
					</BarChart>
				</ResponsiveContainer>
			</Paper>

			{/* Summary Table */}
			<Paper sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					Summary Statistics
				</Typography>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell><strong>Metric</strong></TableCell>
								<TableCell align="right"><strong>Republican</strong></TableCell>
								<TableCell align="right"><strong>Democratic</strong></TableCell>
								<TableCell align="right"><strong>Split</strong></TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell>Jurisdictions</TableCell>
								<TableCell align="right">{data.republican.count}</TableCell>
								<TableCell align="right">{data.democratic.count}</TableCell>
								<TableCell align="right">{data.split.count}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Avg Registration Rate (%)</TableCell>
								<TableCell align="right">{data.republican.avgRegistrationRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.democratic.avgRegistrationRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.split.avgRegistrationRate.toFixed(1)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Avg Turnout (%)</TableCell>
								<TableCell align="right">{data.republican.avgTurnout.toFixed(1)}</TableCell>
								<TableCell align="right">{data.democratic.avgTurnout.toFixed(1)}</TableCell>
								<TableCell align="right">{data.split.avgTurnout.toFixed(1)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Avg Mail Ballot Rate (%)</TableCell>
								<TableCell align="right">{data.republican.avgMailBallotRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.democratic.avgMailBallotRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.split.avgMailBallotRate.toFixed(1)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Avg Drop Box Rate (%)</TableCell>
								<TableCell align="right">{data.republican.avgDropBoxRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.democratic.avgDropBoxRate.toFixed(1)}</TableCell>
								<TableCell align="right">{data.split.avgDropBoxRate.toFixed(1)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Restrictive Felony Policies</TableCell>
								<TableCell align="right">{data.republican.felonyRestrictiveCount}</TableCell>
								<TableCell align="right">{data.democratic.felonyRestrictiveCount}</TableCell>
								<TableCell align="right">{data.split.felonyRestrictiveCount}</TableCell>
							</TableRow>
							<TableRow>
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
