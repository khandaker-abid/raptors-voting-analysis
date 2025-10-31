import React, { useState, useMemo } from "react";
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
import type { ActiveVotersRow } from "../data/types";

interface ActiveVotersTableProps {
	data: ActiveVotersRow[];
	stateName?: string;
}

// Helper functions to calculate totals
const getTotalActiveVoters = (data: ActiveVotersRow[]): number =>
	data.reduce((total, c) => total + (c.activeVoters || 0), 0);

const getTotalInactiveVoters = (data: ActiveVotersRow[]): number =>
	data.reduce((total, c) => total + (c.inactiveVoters || 0), 0);

const getTotalVoters = (data: ActiveVotersRow[]): number =>
	data.reduce((total, c) => total + (c.totalVoters || 0), 0);

const ActiveVotersTable: React.FC<ActiveVotersTableProps> = ({
	data,
}) => {
	const [page, setPage] = useState(0);
	const rowsPerPage = 5; // Fixed at 5 rows per page (no scrolling, just pagination)
	const [searchTerm, setSearchTerm] = useState("");

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	// Sort by total voters descending
	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => b.totalVoters - a.totalVoters);
	}, [filteredData]);

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
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
		<Paper sx={{ p: 2, display: "flex", flexDirection: "column", width: "100%" }}>
			<Box mb={1.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
				<Typography variant="h6" fontWeight={600}>
					Active Voters by County/Town
				</Typography>
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
					sx={{ minWidth: 200 }}
				/>
			</Box>

			<TableContainer sx={{ position: "relative", overflow: "visible" }}>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								County/Town
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								Total Voters
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								Active Voters
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								Inactive Voters
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								Active %
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									py: 1.5,
								}}>
								Inactive %
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => {
								const globalIndex = page * rowsPerPage + index;
								const rowBg = globalIndex % 2 === 0 ? "white" : "#fafafa";
								const inactivePercentage = 100 - row.activePercentage;
								return (
									<TableRow key={row.geographicUnit} hover>
										<TableCell
											component="th"
											scope="row"
											sx={{
												fontWeight: 500,
												backgroundColor: rowBg,
											}}>
											{row.geographicUnit}
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												backgroundColor: rowBg,
											}}>
											{row.totalVoters.toLocaleString()}
										</TableCell>
										<TableCell align="right" sx={{ backgroundColor: rowBg }}>
											{row.activeVoters.toLocaleString()}
										</TableCell>
										<TableCell align="right" sx={{ backgroundColor: rowBg }}>
											{row.inactiveVoters.toLocaleString()}
										</TableCell>
										<TableCell align="right" sx={{ backgroundColor: rowBg }}>
											{row.activePercentage.toFixed(1)}%
										</TableCell>
										<TableCell align="right" sx={{ backgroundColor: rowBg }}>
											{inactivePercentage.toFixed(1)}%
										</TableCell>
									</TableRow>
								);
							})}

						{/* Totals Row */}
						<TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "#f5f5f5",
								}}>
								TOTAL
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.total.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.active.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.inactive.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{((totals.active / totals.total) * 100).toFixed(1)}%
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{((totals.inactive / totals.total) * 100).toFixed(1)}%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<Box sx={{ flexShrink: 0, borderTop: "1px solid #e0e0e0", backgroundColor: "white" }}>
				<TablePagination
					component="div"
					count={filteredData.length}
					page={page}
					onPageChange={handleChangePage}
					rowsPerPage={rowsPerPage}
					rowsPerPageOptions={[]}
					labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
					sx={{ minHeight: 52 }}
				/>
			</Box>
		</Paper>
	);
};

export default ActiveVotersTable;
