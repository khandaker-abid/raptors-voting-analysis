import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    CircularProgress,
} from "@mui/material";

interface RegisteredVoter {
    id: string;
    firstName: string;
    lastName: string;
    party: "Republican" | "Democratic" | "Unaffiliated" | "Other";
    registrationDate: string;
    address: string;
}

interface Props {
    stateName: string;
    geographicUnit: string;
    open: boolean;
    onClose: () => void;
}

const RegisteredVotersList: React.FC<Props> = ({
    stateName,
    geographicUnit,
    open,
    onClose,
}) => {
    const [voters, setVoters] = useState<RegisteredVoter[]>([]);
    const [filteredVoters, setFilteredVoters] = useState<RegisteredVoter[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [partyFilter, setPartyFilter] = useState<string>("All");

    useEffect(() => {
        if (!open) return;

        setLoading(true);

        // Fetch all voters for this location - filtering is done client-side
        const apiUrl = `http://localhost:8080/api/registration/voters/${encodeURIComponent(stateName)}/${encodeURIComponent(geographicUnit)}?page=0&size=100000`;

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data && data.voters) {
                    const mappedVoters: RegisteredVoter[] = data.voters.map((v: any) => ({
                        id: v.id || `voter-${v.firstName}-${v.lastName}`,
                        firstName: v.firstName || "N/A",
                        lastName: v.lastName || "N/A",
                        party: v.party || "Unaffiliated",
                        registrationDate: v.registrationDate || "N/A",
                        address: v.address || "N/A",
                    }));
                    setVoters(mappedVoters);
                } else {
                    console.warn("No voters found for this location");
                    setVoters([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching voters:", err);
                setVoters([]);
                setLoading(false);
            });
    }, [open, stateName, geographicUnit]);

    useEffect(() => {
        if (partyFilter === "All") {
            setFilteredVoters(voters);
        } else {
            setFilteredVoters(voters.filter((v) => v.party === partyFilter));
        }
        setPage(0); // Reset to first page when filter changes
    }, [voters, partyFilter]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handlePartyFilterChange = (event: any) => {
        setPartyFilter(event.target.value);
    };

    const paginatedVoters = filteredVoters.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Registered Voters - {geographicUnit}, {stateName}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Party Affiliation</InputLabel>
                        <Select
                            value={partyFilter}
                            label="Party Affiliation"
                            onChange={handlePartyFilterChange}
                        >
                            <MenuItem value="All">All Parties</MenuItem>
                            <MenuItem value="Republican">Republican</MenuItem>
                            <MenuItem value="Democratic">Democratic</MenuItem>
                            <MenuItem value="Unaffiliated">Unaffiliated</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Showing {filteredVoters.length.toLocaleString()} registered voters
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                            fontWeight: "bold",
                                            backgroundColor: "#616161",
                                            color: "white",
                                            py: 0.85,
                                            fontSize: "0.95rem",
                                            cursor: "pointer",
									    }}>
                                            <strong>Last Name</strong>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                            fontWeight: "bold",
                                            backgroundColor: "#616161",
                                            color: "white",
                                            py: 0.85,
                                            fontSize: "0.95rem",
                                            cursor: "pointer",
									    }}>
                                            <strong>First Name</strong>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                            fontWeight: "bold",
                                            backgroundColor: "#616161",
                                            color: "white",
                                            py: 0.85,
                                            fontSize: "0.95rem",
                                            cursor: "pointer",
									    }}>
                                            <strong>Political Party</strong>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                            fontWeight: "bold",
                                            backgroundColor: "#616161",
                                            color: "white",
                                            py: 0.85,
                                            fontSize: "0.95rem",
                                            cursor: "pointer",
									    }}>
                                            <strong>Registration Date</strong>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: "bold",
                                                backgroundColor: "#616161",
                                                color: "white",
                                                py: 0.85,
                                                fontSize: "0.95rem",
                                                cursor: "pointer",
                                                width: 220,
                                                minWidth: 180,
                                                maxWidth: 400,
                                            }}
                                        >
                                            <strong>Address</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedVoters.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    No voters found matching the selected filter
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedVoters.map((voter) => (
                                            <TableRow key={voter.id} hover>
                                                <TableCell>{voter.lastName}</TableCell>
                                                <TableCell>{voter.firstName}</TableCell>
                                                <TableCell>
                                                    {voter.party === "Democratic" ? (
                                                        <span style={{ color: "#1976d2", fontWeight: 600 }}>
                                                            {voter.party}
                                                        </span>
                                                    ) : voter.party === "Republican" ? (
                                                        <span style={{ color: "#d32f2f", fontWeight: 600 }}>
                                                            {voter.party}
                                                        </span>
                                                    ) : voter.party === "Unaffiliated" ? (
                                                        <span>{voter.party}</span>
                                                    ) : (
                                                        voter.party
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {voter.registrationDate
                                                        ? (() => {
                                                            const d = new Date(voter.registrationDate);
                                                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                            const dd = String(d.getDate()).padStart(2, '0');
                                                            const yyyy = d.getFullYear();
                                                            return `${mm}-${dd}-${yyyy}`;
                                                        })()
                                                        : ""}
                                                </TableCell>
                                                <TableCell>{voter.address}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[]}
                            component="div"
                            count={filteredVoters.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisteredVotersList;
