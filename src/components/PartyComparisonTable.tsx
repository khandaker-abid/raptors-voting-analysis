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
} from "@mui/material";
import type { PartyComparisonData } from "../data/partyComparisonData";
import { getPartyComparisonData } from "../data/partyComparisonData";

interface PartyComparisonTableProps {
	republicanStateName: string;
	democraticStateName: string;
}

const PartyComparisonTable: React.FC<PartyComparisonTableProps> = ({
	republicanStateName,
	democraticStateName,
}) => { 
	const [data, setData] = useState<PartyComparisonData[]>([])
    const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	useEffect(() => {
		const fetchData = async () => {
		try {
			const result = await getPartyComparisonData();
			setData(Array.isArray(result) ? result : []);
		} catch (error) {
			console.error('Error fetching voting equipment data:', error);
		}
		};
		fetchData();
	}, []);

	const filteredData = useMemo(() => {
		if (!data) return [];
		return data;
	}, [data]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a,b) => a.metric.localeCompare(b.metric));
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
					Sorry! Can't find comparison data right now. Try again later.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Party Comparision Data ({republicanStateName} vs. {democraticStateName})
				</Typography>
			</Box>

			<TableContainer sx={{ maxHeight: 600, position: "relative" }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Evaluation Metric
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
									position: "sticky",
									left: 0,
									zIndex: 3,
								}}>
								Republican Data ({republicanStateName})
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}>
								Democratic Data ({democraticStateName})
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((row, index) => (
								<TableRow
									key={row.metric}
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
										{row.metric}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "#880808"
										}}>
										{row.republicanData.toLocaleString()}
									</TableCell>

                                    <TableCell
										align="right"
										sx={{
											fontWeight: "bold",
											color: "primary.main"
										}}>
										{row.democraticData.toLocaleString()}
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

export default PartyComparisonTable;