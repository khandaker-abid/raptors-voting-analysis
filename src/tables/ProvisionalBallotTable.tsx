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
import { getProvisionalBallotCategories } from "../data/provisionalBallotData";

type SortableColumn = 'county' | 'E1a' | 'E2a' | 'E2b' | 'E2c' | 'E2d' | 'E2e' | 'E2f' | 'E2g' | 'E2h' | 'E2i';
type SortOrder = 'asc' | 'desc';

interface ProvisionalBallotTableProps {
	data: Array<{
		county: string;
		E1a: number;
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
}

const ProvisionalBallotTable: React.FC<ProvisionalBallotTableProps> = ({
	data,
}) => {
	const [page, setPage] = useState(0);
	const rowsPerPage = 5; // Fixed at 5 rows per page (no scrolling, just pagination)
	const [searchTerm, setSearchTerm] = useState("");
	const [sortColumn, setSortColumn] = useState<SortableColumn>('county');
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

	// Helper function to normalize county names (fix all-caps issue)
	const normalizeCountyName = (name: string): string => {
		return name
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};

	// Get category mappings
	const categories = useMemo(() => getProvisionalBallotCategories(), []);
	const categoryMap = useMemo(() => {
		const map: Record<string, string> = {};
		categories.forEach((cat) => {
			map[cat.key] = cat.label;
		});
		return map;
	}, [categories]);

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.county.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	// Add sorting logic
	const sortedData = useMemo(() => {
		const sorted = [...filteredData];
		sorted.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			if (sortColumn === 'county') {
				aValue = normalizeCountyName(a.county);
				bValue = normalizeCountyName(b.county);
			} else {
				aValue = a[sortColumn] as number;
				bValue = b[sortColumn] as number;
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
		setPage(0); // Reset to first page when sorting
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};



	const totalsByCategory = useMemo(() => {
		if (!data || data.length === 0) return {};

		const categories = [
			"E1a",
			"E2a",
			"E2b",
			"E2c",
			"E2d",
			"E2e",
			"E2f",
			"E2g",
			"E2h",
			"E2i",
		];
		return categories.reduce((acc, cat) => {
			acc[cat] = data.reduce(
				(sum, row) => sum + ((row[cat as keyof typeof row] as number) || 0),
				0,
			);
			return acc;
		}, {} as Record<string, number>);
	}, [data]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No provisional ballot table data available for this state.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 2, display: "flex", flexDirection: "column", width: "100%" }}>
			<Box mb={1.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
				<Typography variant="h6" fontWeight={600}>
					Provisional Ballots by County/Town
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
									active={sortColumn === 'county'}
									direction={sortColumn === 'county' ? sortOrder : 'asc'}
									onClick={() => handleSort('county')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									County/Town
								</TableSortLabel>
							</TableCell>
							{[
								"E2a",
								"E2b",
								"E2c",
								"E2d",
								"E2e",
								"E2f",
								"E2g",
								"E2h",
								"E2i",
							].map((cat) => (
								<TableCell
									key={cat}
									align="right"
									sx={{
										fontWeight: "bold",
										backgroundColor: "#616161",
										color: "white",
										py: 1.5,
										cursor: "pointer",
									}}>
									<TableSortLabel
										active={sortColumn === cat}
										direction={sortColumn === cat ? sortOrder : 'asc'}
										onClick={() => handleSort(cat as SortableColumn)}
										sx={{
											color: 'white !important',
											'&:hover': { color: 'white !important' },
											'& .MuiTableSortLabel-icon': { color: 'white !important' },
											'&.Mui-active': { color: 'white !important' },
											'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
										}}>
										{categoryMap[cat] || cat}
									</TableSortLabel>
								</TableCell>
							))}
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
									active={sortColumn === 'E1a'}
									direction={sortColumn === 'E1a' ? sortOrder : 'asc'}
									onClick={() => handleSort('E1a')}
									sx={{
										color: 'white !important',
										'&:hover': { color: 'white !important' },
										'& .MuiTableSortLabel-icon': { color: 'white !important' },
										'&.Mui-active': { color: 'white !important' },
										'&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
									}}>
									Total
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
								return (
									<TableRow key={row.county} hover>
										<TableCell
											component="th"
											scope="row"
											sx={{
												fontWeight: 500,
												backgroundColor: rowBg,
											}}>
											{normalizeCountyName(row.county)}
										</TableCell>
										{[
											"E2a",
											"E2b",
											"E2c",
											"E2d",
											"E2e",
											"E2f",
											"E2g",
											"E2h",
											"E2i",
										].map((cat) => (
											<TableCell
												key={cat}
												align="right"
												sx={{
													backgroundColor: rowBg,
												}}>
												{(
													row[cat as keyof typeof row] as number
												).toLocaleString()}
											</TableCell>
										))}
										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
												backgroundColor: rowBg,
											}}>
											{row.E1a.toLocaleString()}
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
							{[
								"E2a",
								"E2b",
								"E2c",
								"E2d",
								"E2e",
								"E2f",
								"E2g",
								"E2h",
								"E2i",
							].map((cat) => (
								<TableCell key={cat} align="right" sx={{ fontWeight: "bold" }}>
									{(totalsByCategory[cat] || 0).toLocaleString()}
								</TableCell>
							))}
							<TableCell align="right" sx={{ fontWeight: "bold" }}>
								{(totalsByCategory["E1a"] || 0).toLocaleString()}
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
					rowsPerPageOptions={[]} // Hide rows per page selector
					labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
					sx={{ minHeight: 52 }}
				/>
			</Box>
		</Paper>
	);
};

export default ProvisionalBallotTable;
