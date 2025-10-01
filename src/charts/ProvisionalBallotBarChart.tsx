import React from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";
import {
	getProvisionalBallotCategories,
	getStateCategoryTotals,
} from "../data/provisionalBallotData";

interface ProvisionalBallotBarChartProps {
	stateName: string;
	height?: number;
}

interface ChartData {
	category: string;
	categoryCode: string;
	count: number;
	description: string;
}

const ProvisionalBallotBarChart: React.FC<ProvisionalBallotBarChartProps> = ({
	stateName,
	height = 400,
}) => {
	const categories = getProvisionalBallotCategories();
	const categoryTotals = getStateCategoryTotals(stateName);

	const chartData: ChartData[] = categories
		.map((category) => ({
			category: category.label,
			categoryCode: category.key,
			count: categoryTotals[category.key] || 0,
			description: category.description,
		}))
		.filter((item) => item.count > 0); // Only show categories with data

	if (chartData.length === 0) {
		return (
			<Box
				sx={{
					height,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "text.secondary",
				}}>
				<Typography>
					No provisional ballot data available for {stateName}
				</Typography>
			</Box>
		);
	}

	// Custom tooltip component
	const CustomTooltip = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: Array<{
			payload: ChartData;
			dataKey: string;
			value: number;
		}>;
		label?: string;
	}) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload as ChartData;
			return (
				<Box
					sx={{
						backgroundColor: "background.paper",
						border: "1px solid #ccc",
						borderRadius: 2,
						padding: 2,
						boxShadow: 2,
						maxWidth: 300,
					}}>
					<Typography variant="h6" gutterBottom color="primary">
						{data.categoryCode}: {data.category}
					</Typography>
					<Typography variant="body1" gutterBottom>
						<strong>Count:</strong> {data.count.toLocaleString()}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{data.description}
					</Typography>
				</Box>
			);
		}
		return null;
	};

	return (
		<Box sx={{ width: "100%", height }}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={chartData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 80,
					}}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey="categoryCode"
						angle={-45}
						textAnchor="end"
						height={100}
						interval={0}
						tick={{ fontSize: 12 }}
					/>
					<YAxis
						tick={{ fontSize: 12 }}
						tickFormatter={(value: number) => value.toLocaleString()}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend
						content={
							<Box sx={{ textAlign: "center", py: 1 }}>
								<Typography variant="subtitle2" color="primary">
									Provisional Ballot Categories - {stateName}
								</Typography>
							</Box>
						}
					/>
					<Bar
						dataKey="count"
						fill="#1976d2"
						stroke="#1565c0"
						strokeWidth={1}
						radius={[2, 2, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</Box>
	);
};

export default ProvisionalBallotBarChart;
