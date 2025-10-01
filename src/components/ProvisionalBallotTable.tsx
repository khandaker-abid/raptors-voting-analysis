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

	const getColorForValue = (value: number, max: number) => {
		const intensity = Math.min((value / max) * 100, 100);
		if (intensity > 75) return "#ffebee";
		if (intensity > 50) return "#fff3e0";
		if (intensity > 25) return "#f3e5f5";
		return "transparent";
	};

	const maxValue = useMemo(() => {
		if (!data || data.length === 0) return 100;
		return Math.max(
			...data.flatMap((row) => [
				row.E2a,
				row.E2b,
				row.E2c,
				row.E2d,
				row.E2e,
				row.E2f,
				row.E2g,
				row.E2h,
				row.E2i,
			]),
		);
	}, [data]);

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
					<Chip
						label={`${filteredData.length} locations`}
						color="primary"
						size="small"
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
								E1a (Total)
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
									{cat}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredData
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
											backgroundColor: "#e3f2fd",
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
												backgroundColor: getColorForValue(
													row[cat as keyof typeof row] as number,
													maxValue,
												),
											}}>
											{(
												row[cat as keyof typeof row] as number
											).toLocaleString()}
										</TableCell>
									))}
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
