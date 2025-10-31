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
	InputLabel,
	MenuItem,
	FormControl,
	Select,
	CircularProgress
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { fetchRegisteredVoters } from "../data/api";

interface RegionRegisteredVotersData {
	id: string;
	firstName: string;
	lastName: string;
	party: string;
}

interface RegionRegisteredVotersTableProps {
	stateName: string;
	geographicUnitName: string;
}

const RegionRegisteredVotersTable: React.FC<RegionRegisteredVotersTableProps> = ({
	stateName,
	geographicUnitName,
}) => {
	const [data, setData] = useState<RegionRegisteredVotersData[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [party, setParty] = useState("all");

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				// Fetch from real backend API for the specific state and county/region
				const response = await fetchRegisteredVoters(
					stateName,
					geographicUnitName,
					party === "all" ? undefined : party.charAt(0).toUpperCase() + party.slice(1),
					0,
					10000 // Fetch large batch for client-side filtering/sorting
				);

				if (response && response.voters) {
					// Map backend response to frontend format
					const voters: RegionRegisteredVotersData[] = response.voters.map((v: any) => ({
						id: v.id || `${v.firstName}-${v.lastName}`,
						firstName: v.firstName,
						lastName: v.lastName,
						party: v.party
					}));
					setData(voters);
				}
			} catch (err) {
				console.error("Error fetching voter data:", err);
				setData([]);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [stateName, geographicUnitName, party]);

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (party == "all") return data;
		else if (party == "affiliated") return data.filter((x) => x.party.toLowerCase() != "unaffiliated")
		else return data.filter((x) => { return x.party.toLowerCase() == party })
	}, [data, party]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => (
			a.lastName.localeCompare(b.lastName) != 0 ? a.lastName.localeCompare(b.lastName) : a.firstName.localeCompare(b.firstName)
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

	const handleChangeParty = (event: SelectChangeEvent) => {
		setParty(event.target.value);
	}

	if (loading) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<CircularProgress />
				<Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
					Loading voter data...
				</Typography>
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No voter data found for {geographicUnitName} County.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ pb: 3, pl: 5, pr: 5, pt: 2 }}>
			<TableContainer sx={{ maxHeight: 600, pb: 2, position: "relative" }}>
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
								}}
							>
								Last Name
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}
							>
								First Name
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "primary.main",
									color: "white",
								}}
							>
								Affiliated Party
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
									sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}
								>
									<TableCell align="left">
										<Typography variant="body2">{row.lastName}</Typography>
									</TableCell>
									<TableCell align="left">
										<Typography variant="body2">{row.firstName}</Typography>
									</TableCell>
									<TableCell
										align="left"
										sx={{
											fontWeight: "bold",
											color: row.party === "Republican" ? "#880808" : row.party === "Democratic" ? "#1876d2" : "black",
										}}
									>
										{row.party}
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
					px: 2,
				}}
			>
				<Box display="flex" alignItems="center" gap={2}>
					<FormControl sx={{ minWidth: 120 }} size="small">
						<InputLabel id="party-select-small-label">Affiliation</InputLabel>
						<Select
							labelId="party-select-small-label"
							id="party-select-small"
							value={party}
							label="affiliation"
							onChange={handleChangeParty}
						>
							<MenuItem value={"all"}>All Parties</MenuItem>
							<MenuItem value={"affiliated"}>Affiliated to Any Party</MenuItem>
							<MenuItem value={"republican"}>Republican</MenuItem>
							<MenuItem value={"democratic"}>Democratic</MenuItem>
						</Select>
					</FormControl>
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
}

export default RegionRegisteredVotersTable;