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
import theme from "../theme";

interface TooltipData {
	label: string;
	description: string;
	color: string;
	value: number;
}

interface ProvisionalBallotBarChartProps {
	data: Array<{
		county: string;
		E2a: number;
		E2b: number;
		E2c: number;
		E2d: number;
		E2e: number;
		E2f: number;
		E2g: number;
		E2h: number;
		E2i: number;
	}>;
	categories: Array<{ key: string; label: string; description: string }>;
}

const COLORS = [
	"#8884d8",
	"#82ca9d",
	"#ffc658",
	"#ff7c7c",
	"#8dd1e1",
	"#d084d0",
	"#ffb347",
	"#67b7dc",
	"#a4de6c",
];

const ProvisionalBallotBarChart: React.FC<ProvisionalBallotBarChartProps> = ({
	data,
	categories,
}) => {
	// Aggregate data across all counties
	const aggregatedData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const totals = categories.reduce((acc, cat) => {
			acc[cat.key] = data.reduce((sum, county) => {
				return sum + ((county[cat.key as keyof typeof county] as number) || 0);
			}, 0);
			return acc;
		}, {} as Record<string, number>);

		return categories.map((cat, index) => ({
			category: cat.key,
			label: cat.label,
			value: totals[cat.key] || 0,
			description: cat.description,
			color: theme.palette.primary.main,
		}));
	}, [data, categories]);

	const CustomTooltip = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: { payload: TooltipData }[];
	}) => {
		if (active && payload && payload[0]) {
			const data = payload[0].payload;
			return (
				<Paper sx={{ p: 2, maxWidth: 300 }}>
					<Typography variant="subtitle2" fontWeight="bold">
						{data.label}
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						{data.description}
					</Typography>
					<Typography variant="h6" sx={{ mt: 1, color: data.color }}>
						{data.value.toLocaleString()} ballots
					</Typography>
				</Paper>
			);
		}
		return null;
	};

	const totalBallots = useMemo(() => {
		return aggregatedData.reduce((sum, item) => sum + item.value, 0);
	}, [aggregatedData]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No provisional ballot data available for this state.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Provisional Ballot Categories Analysis
				</Typography>
			</Box>

			<ResponsiveContainer width="100%" height={400}>
				<BarChart
					data={aggregatedData}
					margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis
						dataKey="label"
						angle={-45}
						textAnchor="end"
						height={100}
						tick={{ fontSize: 12 }}
					/>
					<YAxis
						tick={{ fontSize: 12 }}
						label={{
							value: "Number of Ballots",
							angle: -90,
							position: "insideLeft",
							style: { fontSize: 12 },
						}}
					/>
					<RechartsTooltip content={<CustomTooltip />} />
					<Bar dataKey="value" radius={[8, 8, 0, 0]}>
						{aggregatedData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</Paper>
	);
};

export default ProvisionalBallotBarChart;
