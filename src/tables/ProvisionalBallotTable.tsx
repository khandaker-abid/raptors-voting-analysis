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
import { getProvisionalBallotCategories } from "../data/provisionalBallotData";

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
								Total
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
										backgroundColor: "primary.main",
										color: "white",
										py: 1.5,
									}}>
									{categoryMap[cat] || cat}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredData
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
											{row.county}
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontWeight: "bold",
											}}>
											{row.E1a.toLocaleString()}
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
							].map((cat) => (
								<TableCell key={cat} align="right" sx={{ fontWeight: "bold" }}>
									{(totalsByCategory[cat] || 0).toLocaleString()}
								</TableCell>
							))}
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
