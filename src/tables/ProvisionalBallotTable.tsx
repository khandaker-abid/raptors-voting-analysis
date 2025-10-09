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
	const [rowsPerPage, setRowsPerPage] = useState(10);
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

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
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
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Provisional Ballots by County/Town
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
												position: "sticky",
												left: 0,
												backgroundColor: rowBg,
												zIndex: 1,
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
									position: "sticky",
									left: 0,
									backgroundColor: "#f5f5f5",
									zIndex: 1,
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

			<TablePagination
				component="div"
				count={filteredData.length}
				page={page}
				onPageChange={handleChangePage}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={handleChangeRowsPerPage}
				rowsPerPageOptions={[5, 10, 25, 50]}
			/>
		</Paper>
	);
};

export default ProvisionalBallotTable;
