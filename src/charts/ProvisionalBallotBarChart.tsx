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

// Single consistent black color for all bars (matching Active Voters & Pollbook Deletions charts)
const CATEGORY_COLOR = "#424242"; // Dark gray/black for consistency

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

		return categories.map((cat) => ({
			category: cat.key,
			label: cat.label,
			value: totals[cat.key] || 0,
			description: cat.description,
			color: CATEGORY_COLOR,
		}));
	}, [data, categories]); const CustomTooltip = ({
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
		<Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={1}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Provisional Ballot Categories Analysis
				</Typography>
				<Typography variant="caption" color="text.secondary" display="block" fontSize="0.7rem">
					Each bar represents a different provisional ballot category. Hover over bars for detailed descriptions.
				</Typography>
			</Box>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={aggregatedData}
						margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="label"
							angle={-45}
							textAnchor="end"
							height={80}
							tick={{ fontSize: 11 }}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							label={{
								value: "Number of Ballots",
								angle: -90,
								position: "insideLeft",
								style: { fontSize: 11 },
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
			</Box>
		</Paper>
	);
};

export default ProvisionalBallotBarChart;
