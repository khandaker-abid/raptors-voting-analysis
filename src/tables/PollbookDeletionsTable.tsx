// GUI - 8
import React, { useState, useMemo } from "react";
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
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { PollbookDeletionRow } from "../data/types";

interface Props {
    data: PollbookDeletionRow[];
}

const PollbookDeletionsTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 5; // Fixed at 5 rows per page to match Active Voters
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm) return data;

        return data.filter((row) =>
            row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    // Sort by total deletions descending
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => (b.total || 0) - (a.total || 0));
    }, [filteredData]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Calculate totals
    const totals = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                A12b_Death: 0,
                A12c_Moved: 0,
                A12d_Felon: 0,
                A12e_MentalIncap: 0,
                A12f_Requested: 0,
                A12g_FailedToVote: 0,
                A12h_Other: 0,
                total: 0,
            };
        }
        return {
            A12b_Death: data.reduce((acc, r) => acc + (r.A12b_Death || 0), 0),
            A12c_Moved: data.reduce((acc, r) => acc + (r.A12c_Moved || 0), 0),
            A12d_Felon: data.reduce((acc, r) => acc + (r.A12d_Felon || 0), 0),
            A12e_MentalIncap: data.reduce((acc, r) => acc + (r.A12e_MentalIncap || 0), 0),
            A12f_Requested: data.reduce((acc, r) => acc + (r.A12f_Requested || 0), 0),
            A12g_FailedToVote: data.reduce((acc, r) => acc + (r.A12g_FailedToVote || 0), 0),
            A12h_Other: data.reduce((acc, r) => acc + (r.A12h_Other || 0), 0),
            total: data.reduce((acc, r) => acc + (r.total || 0), 0),
        };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    No pollbook deletions table data available for this state.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column", width: "100%" }}>
            <Box
                mb={1.5}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
            >
                <Typography variant="h6" fontWeight={600}>
                    Pollbook Deletions by County/Town
                </Typography>
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
                    sx={{ minWidth: 200 }}
                />
            </Box>

            <TableContainer sx={{ position: "relative", overflow: "visible" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                Region
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12b Death
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12c Moved
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12d Felon
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12e Mental Incap
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12f Requested
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12g Failed to Vote
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                A12h Other
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}
                            >
                                Total
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                const globalIndex = page * rowsPerPage + index;
                                const rowBg = globalIndex % 2 === 0 ? "white" : "#fafafa";
                                return (
                                    <TableRow key={row.geographicUnit} hover>
                                        <TableCell
                                            component="th"
                                            scope="row"
                                            sx={{
                                                fontWeight: 500,
                                                backgroundColor: rowBg,
                                            }}
                                        >
                                            {row.geographicUnit}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12b_Death || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12c_Moved || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12d_Felon || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12e_MentalIncap || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12f_Requested || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12g_FailedToVote || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {(row.A12h_Other || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ backgroundColor: rowBg, fontWeight: "bold" }}
                                        >
                                            {(row.total || 0).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                        {/* Totals Row */}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                            <TableCell
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#f5f5f5",
                                }}
                            >
                                TOTAL
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12b_Death.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12c_Moved.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12d_Felon.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12e_MentalIncap.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12f_Requested.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12g_FailedToVote.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.A12h_Other.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totals.total.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box
                sx={{
                    flexShrink: 0,
                    borderTop: "1px solid #e0e0e0",
                    backgroundColor: "white",
                }}
            >
                <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[]}
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
                    sx={{ minHeight: 52 }}
                />
            </Box>
        </Paper>
    );
};

export default PollbookDeletionsTable;