/**
 * Sortable, searchable table displaying active voter statistics.
 * Shows voter counts and percentages by geographic unit.
 */

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
	TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { ActiveVotersRow } from "../data/types";

type SortableColumn = 'geographicUnit' | 'totalVoters' | 'activeVoters' | 'inactiveVoters' | 'activePercentage' | 'inactivePercentage';
type SortOrder = 'asc' | 'desc';

interface ActiveVotersTableProps {
	data: ActiveVotersRow[];
	stateName?: string;
}

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
	const [sortColumn, setSortColumn] = useState<SortableColumn>('geographicUnit');
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

	const normalizeCountyName = (name: string): string => {
		return name
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	const sortedData = useMemo(() => {
		const sorted = [...filteredData];
		sorted.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			if (sortColumn === 'geographicUnit') {
				aValue = normalizeCountyName(a.geographicUnit);
				bValue = normalizeCountyName(b.geographicUnit);
			} else if (sortColumn === 'inactivePercentage') {
				aValue = 100 - a.activePercentage;
				bValue = 100 - b.activePercentage;
			} else {
				aValue = a[sortColumn];
				bValue = b[sortColumn];
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortOrder === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			} else {
				return sortOrder === 'asc'
					? (aValue as number) - (bValue as number)
					: (bValue as number) - (aValue as number);
			}
		});
		return sorted;
	}, [filteredData, sortColumn, sortOrder]);

	const handleSort = (column: SortableColumn) => {
		if (sortColumn === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortOrder('asc');
		}
		setPage(0); 
	};

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
		<Paper sx={{ pt: 0.5, px: 0.5, pb: 0, display: "flex", flexDirection: "column", width: "100%" }}>
			<Box mb={0.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.75}>
				<Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: "0.95rem" }}>
					Active Voters by County
				</Typography>
				<TextField
					size="small"
					placeholder="Search county..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
						sx: { fontSize: "0.85rem", height: "32px" }
					}}
					sx={{ minWidth: 180 }}
				/>
			</Box>

			{/* These two lines below are the key to getting the table to stay 
                in its grid spot and not increase in width, causing the lower 
                few table cells to be hidden from view */}
			<TableContainer sx={{ mb: 0, overflowX: "auto", overflowY: "hidden" }}>
				<Table size="small" sx={{ width: "max-content", minWidth: "100%" }}>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'geographicUnit'}
									direction={sortColumn === 'geographicUnit' ? sortOrder : 'asc'}
									onClick={() => handleSort('geographicUnit')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									County
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'activeVoters'}
									direction={sortColumn === 'activeVoters' ? sortOrder : 'asc'}
									onClick={() => handleSort('activeVoters')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Active Voters
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'inactiveVoters'}
									direction={sortColumn === 'inactiveVoters' ? sortOrder : 'asc'}
									onClick={() => handleSort('inactiveVoters')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Inactive Voters
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'activePercentage'}
									direction={sortColumn === 'activePercentage' ? sortOrder : 'asc'}
									onClick={() => handleSort('activePercentage')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Active %
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'inactivePercentage'}
									direction={sortColumn === 'inactivePercentage' ? sortOrder : 'asc'}
									onClick={() => handleSort('inactivePercentage')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Inactive %
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 0.75,
									cursor: "pointer",
								}}>
								<TableSortLabel
									active={sortColumn === 'totalVoters'}
									direction={sortColumn === 'totalVoters' ? sortOrder : 'asc'}
									onClick={() => handleSort('totalVoters')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Total Voters
								</TableSortLabel>
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
											{normalizeCountyName(row.geographicUnit)}
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
										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												backgroundColor: rowBg,
											}}>
											{row.totalVoters.toLocaleString()}
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
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.total.toLocaleString()}
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
					labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
					sx={{ minHeight: 0, height: 36, p: 0, overflow: "hidden", '& .MuiToolbar-root': { minHeight: 36, height: 36, padding: '0 8px' } }}
				/>
			</Box>
		</Paper>
	);
};

export default ActiveVotersTable;
