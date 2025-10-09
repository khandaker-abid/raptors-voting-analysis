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
import theme from "../theme";

interface ActiveVotersBarChartProps {
	data: ActiveVotersData[];
	stateName: string;
}

const ActiveVotersBarChart: React.FC<ActiveVotersBarChartProps> = ({
	data,
	stateName,
}) => {
	// Base chart data from your helper
	const chartData = useMemo(() => getActiveVotersChartData(data), [data]);

	// [PATCH]: Enforce bar order + human-readable Y ticks ----
	const ORDER = ["Active", "Inactive", "Total"] as const;

	const orderedChartData = useMemo(() => {
		const byCat = new Map(chartData.map((d) => [d.category.toLowerCase(), d]));
		const fallbackColors = [theme.palette.primary.main, 
								theme.palette.primary.main, 
								theme.palette.primary.main]; // Active, Inactive, Total
		return ORDER.map((label, i) => {
			const found = byCat.get(label.toLowerCase());
			return (
				found ?? {
					category: label,
					count: 0,
					percentage: 0,
					color: fallbackColors[i],
				}
			);
		});
	}, [chartData]);

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

	// [PATCH]: read the chip from the “Total” bar
	const totalVoters =
		orderedChartData.find((d) => d.category.toLowerCase() === "total")
			?.count ?? 0;

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					2024 EAVS Active vs Inactive Voters - {stateName}
				</Typography>
			</Box>

			<ResponsiveContainer width="100%" height={400}>
				<BarChart
					data={orderedChartData}
					margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis dataKey="category" tick={{ fontSize: 12 }} />
					<YAxis
						tick={{ fontSize: 12 }}
						tickFormatter={(v: number) => v.toLocaleString()}
						label={{
							value: "Number of Voters",
							angle: -90,
							position: "insideLeft",
							style: { fontSize: 12 },
						}}
					/>
					<RechartsTooltip content={<CustomTooltip />} />
					<Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={120}>
						{orderedChartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</Paper>
	);
};

export default ActiveVotersBarChart;
