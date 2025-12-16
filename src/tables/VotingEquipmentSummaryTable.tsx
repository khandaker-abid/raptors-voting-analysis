import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { VotingEquipmentSummaryData } from "../data/votingEquipmentSummaryData.ts";
import { fetchEquipmentSummary } from "../data/api.ts";


const VotingEquipmentSummaryTable: React.FC = () => {
	const [data, setData] = useState<VotingEquipmentSummaryData[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetchEquipmentSummary();
				const mappedData: VotingEquipmentSummaryData[] = response.map((item: any, index: number) => ({
					id: index + 1,
					equipmentProvider: item.provider || "Unknown",
					model: item.model || "Unknown",
					quantity: item.quantity || 0,
					age: item.age || 0,
					os: item.os || "Unknown",
					certification: item.certification || "Not certified",
					scanRate: item.scanRate || 0,
					errorRate: item.errorRate || 0,
					reliability: item.reliability || 0,
					qualityMeasure: item.qualityScore || 0,
				}));
				setData(mappedData);
			} catch (err) {
				console.error(err);
			}
		};
		fetchData();
	}, []);

	const sortedData = useMemo(() => {
		if (!data) return [];
		return [...data].sort((a, b) => (
			b.equipmentProvider.localeCompare(a.equipmentProvider) != 0 ? a.equipmentProvider.localeCompare(b.equipmentProvider) : a.model.localeCompare(b.model)
		));
	}, [data]);


	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No voting equipment summary data available.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 4 }}>
			<Box mb={3} sx={{ p: 3 }} >
				<Typography variant="h4" gutterBottom align="center" fontWeight={600}>
					US Voting Equipment Summary
				</Typography>
			</Box>

			<TableContainer sx={{ maxHeight: 600, px: 5, position: "relative" }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									position: "sticky",
									left: 0,
									zIndex: 3,
									minWidth: 300,
								}}>
								Equipment Provider
							</TableCell>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 320
								}}>
								Model
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								Quantity
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								Age (years)
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 220
								}}>
								OS
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 180
								}}>
								Certification
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								Scan Rate
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								Error Rate
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								Reliability
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
								}}>
								<Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
									Quality Measure
									<Tooltip
										title="Equipment quality score on a 0-1 scale, with 1 being the highest quality. Calculated based on age, reliability, and certification level."
										arrow
										placement="top">
										<InfoOutlinedIcon sx={{ fontSize: 16, cursor: "help" }} />
									</Tooltip>
								</Box>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData.map((row, index) => (
							<TableRow
								key={row.id}
								hover
								sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
								<TableCell
									component="th"
									scope="row"
									sx={{
										fontWeight: 500,
										position: "sticky",
										left: 0,
										backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
										zIndex: 1,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
									<Typography
										variant="body2">
										{row.equipmentProvider}
									</Typography>
								</TableCell>

								<TableCell
									align="left"
									sx={{
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
									<Typography
										variant="body2">
										{row.model}
									</Typography>
								</TableCell>

								<TableCell
									align="right">
									{row.quantity.toLocaleString()}
								</TableCell>

								<TableCell
									align="right">
									{row.age.toLocaleString()}
								</TableCell>

								<TableCell
									align="left"
									sx={{
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
									<Typography
										variant="body2">
										{row.os}
									</Typography>
								</TableCell>

								<TableCell
									align="left"
									sx={{
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}>
									<Typography
										variant="body2">
										{row.certification}
									</Typography>
								</TableCell>

								<TableCell align="right">
									{row.scanRate > 0 ? row.scanRate : 'N/A'}
								</TableCell>

								<TableCell align="right">
									{row.errorRate > 0 ? `${row.errorRate}%` : '0%'}
								</TableCell>

								<TableCell align="right">
									{row.reliability > 0 ? `${row.reliability}%` : '0%'}
								</TableCell>

								<TableCell align="right">
									{typeof row.qualityMeasure === 'number'
										? row.qualityMeasure.toFixed(2)
										: row.qualityMeasure}
								</TableCell>

							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
}

export default VotingEquipmentSummaryTable;