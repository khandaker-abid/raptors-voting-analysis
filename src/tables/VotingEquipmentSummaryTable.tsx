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
	TablePagination,
	Typography,
	TextField,
	InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { VotingEquipmentSummaryData } from "../data/votingEquipmentSummaryData.ts";
import { fetchEquipmentSummary } from "../data/api.ts";


const VotingEquipmentSummaryTable: React.FC = () => {
	const [data, setData] = useState<VotingEquipmentSummaryData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetchEquipmentSummary();
				// Map backend response to frontend format
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

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.model.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => (
			b.equipmentProvider.localeCompare(a.equipmentProvider) != 0 ? a.equipmentProvider.localeCompare(b.equipmentProvider) : a.model.localeCompare(b.model)
		));
	}, [filteredData]);

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};


	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No detailed voter equipment data available for this state.
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
									backgroundColor: "primary.main",
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
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 320
								}}>
								Model
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Quantity
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Age (years)
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 220
								}}>
								OS
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Certification
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Scan Rate
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Error Rate
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Reliability
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Quality Measure
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => (
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
										<Typography variant="body2">
											{row.scanRate}
										</Typography>
									</TableCell>

									<TableCell
										align="right"  >
										{row.errorRate}
									</TableCell>

									<TableCell
										align="right"  >
										{row.reliability} {/* had toFixed before */}
									</TableCell>

									<TableCell
										align="right"  >
										{row.qualityMeasure} {/* had toFixed before */}
									</TableCell>

								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: 2,
					p: 4,
					px: 6
				}}
			>
				<Box display="flex" alignItems="center" gap={2}>
					<TextField
						size="small"
						placeholder="Model name..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						sx={{ minWidth: 250 }}
					/>
				</Box>
				<TablePagination
					component="div"
					count={sortedData.length}
					page={page}
					onPageChange={handleChangePage}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={[5, 10, 25, 50]}
				/>
			</Box>
		</Paper>
	);
}

export default VotingEquipmentSummaryTable;