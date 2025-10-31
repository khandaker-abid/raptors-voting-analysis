// GUI-19: Display registered voters by name
// Clickable EAVS geographic regions showing paginated list of voters
// Filter by political party (Republican/Democratic)
// Required for Maryland (voter registration state)

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
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [partyFilter, setPartyFilter] = useState<string>("All");

    // Fetch voters when dialog opens
    useEffect(() => {
        if (!open) return;

        setLoading(true);

        // Fetch real voter data from API (GUI-19)
        const apiUrl = `http://localhost:8080/api/registration/voters/${encodeURIComponent(stateName)}/${encodeURIComponent(geographicUnit)}?party=${partyFilter}&page=0&size=1000`;

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data && data.voters) {
                    // Map backend response to frontend format
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
                    // No voters found
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

    // Filter voters by party
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
                        <InputLabel>Party Filter</InputLabel>
                        <Select
                            value={partyFilter}
                            label="Party Filter"
                            onChange={handlePartyFilterChange}
                        >
                            <MenuItem value="All">All Parties</MenuItem>
                            <MenuItem value="Republican">Republican</MenuItem>
                            <MenuItem value="Democratic">Democratic</MenuItem>
                            <MenuItem value="Unaffiliated">Unaffiliated</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
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
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Last Name</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>First Name</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Political Party</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Registration Date</strong>
                                        </TableCell>
                                        <TableCell>
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
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color:
                                                                voter.party === "Republican"
                                                                    ? "error.main"
                                                                    : voter.party === "Democratic"
                                                                        ? "primary.main"
                                                                        : "text.secondary",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {voter.party}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{voter.registrationDate}</TableCell>
                                                <TableCell>{voter.address}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
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
