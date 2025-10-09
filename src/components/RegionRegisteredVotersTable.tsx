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
    InputLabel,
    MenuItem,
    FormControl,
    Select
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { RegionRegisteredVotersData } from "../data/regionRegisteredVotersData";
import axios from "axios";
import { API_URL } from "../data/api";

interface RegionRegisteredVotersTableProps {
	geographicUnitName: string;
}

const RegionRegisteredVotersTable: React.FC<RegionRegisteredVotersTableProps> = ({
    geographicUnitName,
}) => { 
	const [data, setData] = useState<RegionRegisteredVotersData[]>([]);
    const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [party, setParty] = useState("all");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get<RegionRegisteredVotersData[]>(`${API_URL}/region-registered-voters/${geographicUnitName}`);
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
		if (party == "all") return data;
        else if (party == "affiliated") return data.filter((x) => x.party.toLowerCase() != "unaffiliated")
		else return data.filter((x) => {return x.party.toLowerCase() == party})
	}, [data, party]);

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a,b) => (
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

	if (!data || data.length === 0) {
		console.log(data?.length)
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					Sorry! Having trouble getting registered voter names. Try again later.
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
							color: row.party === "Republican" ? "#880808" : row.party === "Democratic" ? "primary.main" : "black",
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