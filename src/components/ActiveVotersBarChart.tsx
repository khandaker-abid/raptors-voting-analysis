import React, { useMemo } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import type { ActiveVotersData } from "../data/activeVotersData";
import { getActiveVotersChartData } from "../data/activeVotersData";

interface ActiveVotersBarChartProps {
	data: ActiveVotersData[];
	stateName: string;
}

const ActiveVotersBarChart: React.FC<ActiveVotersBarChartProps> = ({
	data,
	stateName,
}) => {
	const chartData = useMemo(() => getActiveVotersChartData(data), [data]);

	const CustomTooltip = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: Array<{
			payload: {
				category: string;
				count: number;
				percentage: number;
				color: string;
			};
		}>;
	}) => {
		if (active && payload && payload[0]) {
			const data = payload[0].payload;
			return (
				<Paper sx={{ p: 2, maxWidth: 300 }}>
					<Typography variant="subtitle2" fontWeight="bold">
						{data.category}
					</Typography>
					<Typography variant="h6" sx={{ mt: 1, color: data.color }}>
						{data.count.toLocaleString()} voters
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{data.percentage}% of total registered voters
					</Typography>
				</Paper>
			);
		}
		return null;
	};

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No active voters data available for this state.
				</Typography>
			</Paper>
		);
	}

	const totalVoters = chartData.reduce((sum, item) => sum + item.count, 0);

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					2024 EAVS Active vs Inactive Voters - {stateName}
				</Typography>
				<Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
					<Typography variant="body2" color="text.secondary">
						Total registered voters:
					</Typography>
					<Chip
						label={`${totalVoters.toLocaleString()} voters`}
						color="primary"
						size="small"
					/>
				</Box>
			</Box>

			<ResponsiveContainer width="100%" height={400}>
				<BarChart
					data={chartData}
					margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis
						dataKey="category"
						tick={{ fontSize: 12 }}
						angle={0}
						textAnchor="middle"
					/>
					<YAxis
						tick={{ fontSize: 12 }}
						label={{
							value: "Number of Voters",
							angle: -90,
							position: "insideLeft",
							style: { fontSize: 12 },
						}}
					/>
					<RechartsTooltip content={<CustomTooltip />} />
					<Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={120}>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>

			{/* Summary Statistics */}
			<Box
				mt={3}
				display="flex"
				gap={2}
				flexWrap="wrap"
				justifyContent="center">
				{chartData.map((item) => (
					<Chip
						key={item.category}
						label={`${item.category}: ${item.count.toLocaleString()} (${
							item.percentage
						}%)`}
						size="medium"
						sx={{
							"backgroundColor": item.color,
							"color": "#fff",
							"fontWeight": 500,
							"& .MuiChip-label": {
								fontSize: "0.875rem",
							},
						}}
					/>
				))}
			</Box>
		</Paper>
	);
};

export default ActiveVotersBarChart;
