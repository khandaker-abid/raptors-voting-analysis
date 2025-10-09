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
import type { EveryStateAllModelsData } from "../data/everyStateAllModelsData.ts";
import axios from "axios";
import { API_URL } from "../data/api.ts";

interface StateVotingEquipmentTableProps {
	stateName: string;
}

const StateVotingEquipmentTable: React.FC<StateVotingEquipmentTableProps> = ({
    stateName
}) => { 
    const [data, setData] = useState<EveryStateAllModelsData[]>([]);
    const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
			try {
				const response = await axios.get<EveryStateAllModelsData[]>(`${API_URL}/per-state-equipment/${stateName}`);
				setData(response.data);
			} catch (err) {
				console.log(err)
				console.error(err);
			}
		};
		fetchData();
    }, []);

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!searchTerm) return data;

		return data.filter((row) =>
			row.make.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a,b) => a.make.localeCompare(b.make));
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
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No detailed voter equipment data available for this state.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 5 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					{stateName} Voting Equipment Information
				</Typography>
				<Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
					<TextField
						size="small"
						placeholder="Model name..."
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
						label={`${filteredData.length} models`}
						color="primary"
						size="small"
					/>
				</Box>
			</Box>

			<TableContainer sx={{ maxHeight: 600, p: 3, position: "relative" }}>
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
								Model
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Quantity
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Equipment Type
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Description
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Age (years)
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								OS
							</TableCell>
                            <TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Certification
							</TableCell>
                            <TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Scan Rate
							</TableCell>
                            <TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Error Rate
							</TableCell>
                            <TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Reliability
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row) => (
								<TableRow
									key={row.id}
									hover
									sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
									<TableCell
										component="th"
										scope="row"
										sx={{
											fontWeight: 500,
											position: "sticky",
											left: 0,
											backgroundColor: row.isAvailable === true ? "white" : "#FF746C",
											zIndex: 1,
										}}>
										{row.make}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
										}}>
										{row.quantity.toLocaleString()}
									</TableCell>

									<TableCell align="left">
										<Typography
											variant="body2">
											{row.equipmentType}
										</Typography>
									</TableCell>

									<TableCell align="left">
										<Typography
											variant="body2">
											{row.description}
										</Typography>
									</TableCell>

                                    <TableCell
										align="right"
										sx={{
										}}>
										{row.age.toLocaleString()}
									</TableCell>

									<TableCell align="left">
										<Typography
											variant="body2">
											{row.os}
										</Typography>
									</TableCell>

									<TableCell align="left">
										<Typography
											variant="body2">
											{row.certification}
										</Typography>
									</TableCell>

                                    <TableCell
										align="right"
										sx={{}}>
										{row.scanRate.toLocaleString()}
									</TableCell>

                        			<TableCell
                                        align="right"						 
                                        sx={{
											fontWeight: "bold",
											color: "#880808"
									    }}>
											{row.errorRate}
									</TableCell>

                        			<TableCell 
										align="right"  
										sx={{
											fontWeight: "bold",
											color: "primary.main"
										}}>
											{row.reliability}
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

export default StateVotingEquipmentTable;