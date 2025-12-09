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
		<Paper sx={{ p: 2, display: "flex", flexDirection: "column", width: "100%" }}>
			<Box
				mb={1.5}
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				flexWrap="wrap"
				gap={1}
			>
				<Typography variant="h6" fontWeight={600}>
					Voter Registration Data
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
									backgroundColor: "#616161",
									color: "white",
									py: 1.5,
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
									py: 1.5,
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
									Registered Voter Count
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 1.5,
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
									Republican Count
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 1.5,
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
									Democratic Count
								</TableSortLabel>
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									py: 1.5,
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
									Unaffiliated Party Count
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
										}}>
										{row.regionName} County
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
										}}>
										{row.registeredVoterCount.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "#d32f2f"
										}}>
										{row.republicanCount.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "#1976d2"
										}}>
										{row.democraticCount.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "#757575"
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
								}}
							>
								TOTAL
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{totals.registeredVoterCount.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold", color: "#d32f2f" }}>
								{totals.republicanCount.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
								{totals.democraticCount.toLocaleString()}
							</TableCell>
							<TableCell align="right" sx={{ fontWeight: "bold", color: "#757575" }}>
								{totals.unaffiliatedPartyCount.toLocaleString()}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<Box
				sx={{
					flexShrink: 0,
					borderTop: "1px solid #e0e0e0",
					backgroundColor: "white",
				}}
			>
				<TablePagination
					component="div"
					count={sortedData.length}
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
}

export default StateVoterRegistrationTable;