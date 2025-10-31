import React, { useMemo } from "react";
import { Paper, Typography, Box } from "@mui/material";
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
import type { ActiveVotersRow } from "../data/types";
import theme from "../theme";

interface ActiveVotersBarChartProps {
	data: ActiveVotersRow[];
	stateName?: string;
}

// Helper function to transform API data to chart data
function getActiveVotersChartData(data: ActiveVotersRow[]) {
	const totalActive = data.reduce((sum, d) => sum + (d.activeVoters || 0), 0);
	const totalInactive = data.reduce((sum, d) => sum + (d.inactiveVoters || 0), 0);
	const total = data.reduce((sum, d) => sum + (d.totalVoters || 0), 0);

	const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

	return [
		{
			category: "Active",
			count: totalActive,
			percentage: pct(totalActive, total),
		},
		{
			category: "Inactive",
			count: totalInactive,
			percentage: pct(totalInactive, total),
		},
		{
			category: "Total",
			count: total,
			percentage: 100,
		},
	];
}

const ActiveVotersBarChart: React.FC<ActiveVotersBarChartProps> = ({
	data,
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

	return (
		<Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={1}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Active Voter Categories Analysis
				</Typography>
				<Typography variant="caption" color="text.secondary" display="block" fontSize="0.7rem">
					Active, Inactive, and Total registered voters. Hover over bars for detailed information.
				</Typography>
			</Box>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={orderedChartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="category"
							angle={-45}
							textAnchor="end"
							height={80}
							tick={{ fontSize: 11 }}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							tickFormatter={(v: number) => v.toLocaleString()}
							label={{
								value: "Number of Voters",
								angle: -90,
								position: "insideLeft",
								style: { fontSize: 11 },
							}}
						/>
						<RechartsTooltip content={<CustomTooltip />} />
						<Bar dataKey="count" radius={[8, 8, 0, 0]}>
							{orderedChartData.map((_entry, index) => (
								<Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</Box>
		</Paper>
	);
};

export default ActiveVotersBarChart;
