import React, { useState, useEffect, useMemo } from "react";
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
// [PATCH]: import RouterLink so the state name can be a link to the history page
import { Link as RouterLink } from "react-router-dom";

import type { EveryStateEquipmentData } from "../data/everyStateEquipmentData";
import { getEveryStateEquipmentData } from "../data/everyStateEquipmentData";

const EveryStateEquipmentTable: React.FC = () => {
	const [data, setData] = useState<EveryStateEquipmentData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await getEveryStateEquipmentData();
				setData(Array.isArray(result) ? result : []);
			} catch (error) {
				console.error("Error fetching voting equipment data:", error);
			}
		};
		fetchData();
	}, []);

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.stateName.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [data, searchTerm]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) =>
			a.stateName.localeCompare(b.stateName)
		);
	}, [filteredData]);

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					Sorry! Error, can't find voter equipment data
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 8 }}>
			<Box mb={3}>
				<Typography variant="h4" gutterBottom fontWeight={600} align="center">
					Voting Equipment Counts By State
				</Typography>
			</Box>

			<TableContainer sx={{ maxHeight: 600, padding: 3, position: "relative" }}>
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
									minWidth: 200,
								}}
							>
								State
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 200,
								}}
							>
								DRE no VVPAT
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 200,
								}}
							>
								DRE with VVPAT
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 200,
								}}
							>
								Ballot Marking Device
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									minWidth: 150,
								}}
							>
								Scanner
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
									sx={{
										"&:nth-of-type(even)": { backgroundColor: "#fafafa" },
									}}
								>
									<TableCell
										component="th"
										scope="row"
										sx={{
											fontWeight: 500,
											position: "sticky",
											left: 0,
											backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
											zIndex: 1,
										}}
									>
										{/* [PATCH]: make the state name a link to the history page per GUI-14 */}
										<Typography
											component={RouterLink}
											to={`/voting-equipment-history/${encodeURIComponent(
												row.stateName
											)}`}
											variant="body2"
											color="primary"
											sx={{
												textDecoration: "none",
												"&:hover": { textDecoration: "underline" },
											}}
										>
											{row.stateName}
										</Typography>
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											backgroundColor: "#e3f2fd",
										}}
									>
										{row.dreNoVvpatNum.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											backgroundColor: "#e3f2fd",
										}}
									>
										{row.dreWithVvpatNum.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											backgroundColor: "#e3f2fd",
										}}
									>
										{row.ballotMarkingDeviceNum.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											backgroundColor: "#e3f2fd",
										}}
									>
										{row.scannerNum.toLocaleString()}
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
					pt: 2,
					px: 6,
				}}
			>
				<Box display="flex" alignItems="center" gap={2}>
					<TextField
						size="small"
						placeholder="State name..."
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
					<Chip label={`${filteredData.length} models`} color="primary" size="small" />
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
};

export default EveryStateEquipmentTable;
