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
	TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { StateVoterRegistrationData } from "../data/stateVoterRegistrationData";
import { fetchStateRegisteredVoters } from "../data/api";

type SortableColumn = 'regionName' | 'registeredVoterCount' | 'republicanCount' | 'democraticCount' | 'unaffiliatedPartyCount';
type SortOrder = 'asc' | 'desc';

interface StateVoterRegistrationTableProps {
	stateName: string;
}

const StateVoterRegistrationTable: React.FC<StateVoterRegistrationTableProps> = ({
	stateName,
}) => {
	const [data, setData] = useState<StateVoterRegistrationData[]>([]);
	const [page, setPage] = useState(0);
	const rowsPerPage = 5; // Fixed at 5 rows per page (no scrolling, just pagination)
	const [searchTerm, setSearchTerm] = useState("");
	const [sortColumn, setSortColumn] = useState<SortableColumn>('regionName');
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetchStateRegisteredVoters(stateName);
				setData(response);
			} catch (err) {
				console.error(`Failed to fetch voter registration data for ${stateName}:`, err);
			}
		};
		fetchData();
	}, [stateName]);

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
			row.regionName.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	const totals = useMemo(() => {
		return {
			registeredVoterCount: data.reduce((sum, row) => sum + (row.registeredVoterCount || 0), 0),
			republicanCount: data.reduce((sum, row) => sum + (row.republicanCount || 0), 0),
			democraticCount: data.reduce((sum, row) => sum + (row.democraticCount || 0), 0),
			unaffiliatedPartyCount: data.reduce((sum, row) => sum + (row.unaffiliatedPartyCount || 0), 0),
		};
	}, [data]);

	const sortedData = useMemo(() => {
		const sorted = [...filteredData];
		sorted.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			if (sortColumn === 'regionName') {
				aValue = normalizeCountyName(a.regionName);
				bValue = normalizeCountyName(b.regionName);
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
		setPage(0); // Reset to first page on sort
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};


	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					Sorry! No detailed voter registration data available for this state.
				</Typography>
			</Paper>
		);
	}

		return (
			<Paper sx={{ pt: 0.5, px: 0.5, pb: 0, width: "100%" }}>
				<Box mb={0.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
					<Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: "0.95rem" }}>
						Voter Registration Data
					</Typography>
					<TextField
						size="small"
						placeholder="Search region..."
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

				<TableContainer sx={{ mb: 0, overflowX: "auto", overflowY: "hidden" }}>
					<Table size="small" sx={{ width: "max-content", minWidth: "100%" }}>
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 0.85,
										fontSize: "0.95rem",
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === 'regionName'}
										direction={sortColumn === 'regionName' ? sortOrder : 'asc'}
										onClick={() => handleSort('regionName')}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': {
												color: 'white !important',
											},
										}}
									>
										Region Name
									</TableSortLabel>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 0.85,
										fontSize: "0.95rem",
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === 'registeredVoterCount'}
										direction={sortColumn === 'registeredVoterCount' ? sortOrder : 'asc'}
										onClick={() => handleSort('registeredVoterCount')}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': {
												color: 'white !important',
											},
											flexDirection: 'row-reverse',
										}}
									>
										   Total
									</TableSortLabel>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 0.85,
										fontSize: "0.95rem",
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === 'republicanCount'}
										direction={sortColumn === 'republicanCount' ? sortOrder : 'asc'}
										onClick={() => handleSort('republicanCount')}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': {
												color: 'white !important',
											},
											flexDirection: 'row-reverse',
										}}
									>
										   Republican
									</TableSortLabel>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 0.85,
										fontSize: "0.95rem",
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === 'democraticCount'}
										direction={sortColumn === 'democraticCount' ? sortOrder : 'asc'}
										onClick={() => handleSort('democraticCount')}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': {
												color: 'white !important',
											},
											flexDirection: 'row-reverse',
										}}
									>
										   Democratic
									</TableSortLabel>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 0.85,
										fontSize: "0.95rem",
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === 'unaffiliatedPartyCount'}
										direction={sortColumn === 'unaffiliatedPartyCount' ? sortOrder : 'asc'}
										onClick={() => handleSort('unaffiliatedPartyCount')}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': {
												color: 'white !important',
											},
											flexDirection: 'row-reverse',
										}}
									>
										   Unaffiliated
									</TableSortLabel>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedData
								.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
								.map((row) => (
									<TableRow
										key={row.regionName}
										hover
										sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
										<TableCell
											component="th"
											scope="row"
											sx={{
												fontWeight: 500,
												fontSize: "0.95rem",
												py: 0.7,
											}}>
											{row.regionName} County
										</TableCell>

										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												fontSize: "0.95rem",
												py: 0.7,
											}}>
											{row.registeredVoterCount.toLocaleString()}
										</TableCell>

										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												color: "#d32f2f",
												fontSize: "0.95rem",
												py: 0.7,
											}}>
											{row.republicanCount.toLocaleString()}
										</TableCell>

										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												color: "#1976d2",
												fontSize: "0.95rem",
												py: 0.7,
											}}>
											{row.democraticCount.toLocaleString()}
										</TableCell>

										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												color: "#757575",
												fontSize: "0.95rem",
												py: 0.7,
											}}>
											{row.unaffiliatedPartyCount.toLocaleString()}
										</TableCell>
									</TableRow>
								))}

							<TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
								<TableCell
									sx={{
										fontWeight: "bold",
										backgroundColor: "#f5f5f5",
										fontSize: "0.95rem",
										py: 0.7,
									}}
								>
									TOTAL
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.95rem", py: 0.7 }}>
									{totals.registeredVoterCount.toLocaleString()}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", color: "#d32f2f", fontSize: "0.95rem", py: 0.7 }}>
									{totals.republicanCount.toLocaleString()}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2", fontSize: "0.95rem", py: 0.7 }}>
									{totals.democraticCount.toLocaleString()}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold", color: "#757575", fontSize: "0.95rem", py: 0.7 }}>
									{totals.unaffiliatedPartyCount.toLocaleString()}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={{ flexShrink: 0, borderTop: "1px solid #e0e0e0", backgroundColor: "white" }}>
					<TablePagination
						component="div"
						count={sortedData.length}
						page={page}
						onPageChange={handleChangePage}
						rowsPerPage={rowsPerPage}
						rowsPerPageOptions={[]}
						labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
						sx={{ overflow: "hidden", minHeight: 0, height: 36, p: 0, '& .MuiToolbar-root': { minHeight: 36, height: 36, padding: '0 8px' } }}
					/>
				</Box>
			</Paper>
	);
}

export default StateVoterRegistrationTable;