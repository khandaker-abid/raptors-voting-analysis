import React, { useState, useMemo } from "react";
import {
	Box,
	Chip,
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
	LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { ActiveVotersData } from "../data/activeVotersData";
import {
	getTotalActiveVoters,
	getTotalInactiveVoters,
	getTotalVoters,
} from "../data/activeVotersData";

interface ActiveVotersTableProps {
	data: ActiveVotersData[];
	stateName: string;
}

const ActiveVotersTable: React.FC<ActiveVotersTableProps> = ({
	data,
	stateName,
}) => {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.county.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	// Sort by total voters descending
	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => b.totalVoters - a.totalVoters);
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

	const getActivePercentageColor = (percentage: number) => {
		if (percentage >= 90) return "#4caf50";
		if (percentage >= 80) return "#8bc34a";
		if (percentage >= 70) return "#ffeb3b";
		if (percentage >= 60) return "#ff9800";
		return "#f44336";
	};

	const totals = useMemo(() => {
		if (!data || data.length === 0) return { total: 0, active: 0, inactive: 0 };
		return {
			total: getTotalVoters(data),
			active: getTotalActiveVoters(data),
			inactive: getTotalInactiveVoters(data),
		};
	}, [data]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No active voters table data available for this state.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Active Voters by County/Town - {stateName}
				</Typography>
				<Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
					<TextField
						size="small"
						placeholder="Search county/town..."
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
			</Box>

			<TableContainer sx={{ maxHeight: 600, position: "relative" }}>
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
								}}>
								County/Town
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Total Voters
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Active Voters
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Inactive Voters
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Active %
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Inactive %
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => (
								<TableRow
									key={row.county}
									hover
									sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
									<TableCell
										component="th"
										scope="row"
										sx={{
											fontWeight: 500,
											position: "sticky",
											left: 0,
											backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
											zIndex: 1,
										}}>
										{row.county}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
										}}>
										{row.totalVoters.toLocaleString()}
									</TableCell>

									<TableCell align="right">
										<Typography
											variant="body2"
											fontWeight="bold"
											color="#4caf50">
											{row.activeVoters.toLocaleString()}
										</Typography>
									</TableCell>

									<TableCell align="right">
										<Typography
											variant="body2"
											fontWeight="bold"
											color="#ff9800">
											{row.inactiveVoters.toLocaleString()}
										</Typography>
									</TableCell>

									<TableCell align="center">
										<Box sx={{ minWidth: 120 }}>
											<Box display="flex" alignItems="center" gap={1}>
												<LinearProgress
													variant="determinate"
													value={row.activePercentage}
													sx={{
														"flex": 1,
														"height": 8,
														"borderRadius": 4,
														"backgroundColor": "#e0e0e0",
														"& .MuiLinearProgress-bar": {
															backgroundColor: getActivePercentageColor(
																row.activePercentage,
															),
														},
													}}
												/>
												<Typography variant="caption" fontWeight="bold">
													{row.activePercentage.toFixed(1)}%
												</Typography>
											</Box>
										</Box>
									</TableCell>

									<TableCell align="center">
										<Typography variant="body2" color="text.secondary">
											{row.inactivePercentage.toFixed(1)}%
										</Typography>
									</TableCell>
								</TableRow>
							))}

						{/* Totals Row */}
						<TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
							<TableCell
								sx={{
									fontWeight: "bold",
									position: "sticky",
									left: 0,
									backgroundColor: "#f5f5f5",
									zIndex: 1,
								}}>
								TOTAL
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.total.toLocaleString()}
							</TableCell>
							<TableCell
								align="right"
								sx={{ fontWeight: "bold", color: "#4caf50" }}>
								{totals.active.toLocaleString()}
							</TableCell>
							<TableCell
								align="right"
								sx={{ fontWeight: "bold", color: "#ff9800" }}>
								{totals.inactive.toLocaleString()}
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: "bold" }}>
								{((totals.active / totals.total) * 100).toFixed(1)}%
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: "bold" }}>
								{((totals.inactive / totals.total) * 100).toFixed(1)}%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<TablePagination
				component="div"
				count={sortedData.length}
				page={page}
				onPageChange={handleChangePage}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={handleChangeRowsPerPage}
				rowsPerPageOptions={[5, 10, 25, 50]}
			/>
		</Paper>
	);
};

export default ActiveVotersTable;
