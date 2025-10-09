import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
import type { StateVoterRegistrationData } from "../data/stateVoterRegistrationData";
import {getStateVoterRegistrationData} from "../data/stateVoterRegistrationData";
import { API_URL } from "../data/api";

interface StateVoterRegistrationTableProps {
	stateName: string;
}

const StateVoterRegistrationTable: React.FC<StateVoterRegistrationTableProps> = ({
	stateName,
}) => { 
	const [data, setData] = useState<StateVoterRegistrationData[]>([]);
    const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get<StateVoterRegistrationData[]>(`${API_URL}/voter-registration`);
				setData(response.data);
			} catch (err) {
				console.error(err);
			}
		};
		fetchData();
	}, []);

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.regionName.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => (
			a.regionName.localeCompare(b.regionName)
		));
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


	if (!data || data.length === 0) {
		if(data.length === 0) console.log(1)
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					Sorry! No detailed voter registration data available for this state.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Voter Registration Data for {stateName}
				</Typography>
				<Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
					<TextField
						size="small"
						placeholder="Region name..."
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
						label={`${filteredData.length} regions`}
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
								Region Name
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Registered Voter Count
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Republican Count
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Democratic Count
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Unaffiliated Party Count
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => (
								<TableRow
									key={row.regionName}
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
										{row.regionName}
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
											color: "#880808"
										}}>
										{row.republicanCount.toLocaleString()}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "primary.main"
										}}>
										{row.democraticCount.toLocaleString()}
									</TableCell>

                                    <TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "#301934"
										}}>
										{row.unaffiliatedPartyCount.toLocaleString()}
									</TableCell>
								</TableRow>
							))}
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
}

export default StateVoterRegistrationTable;