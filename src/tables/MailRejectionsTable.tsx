// GUI - 9
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
import type { MailRejectionRow } from "../data/types";


interface Props { data: MailRejectionRow[]; }


const MailRejectionsTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 5; // Fixed at 5 rows per page (no scrolling, just pagination)
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm) return data;

        return data.filter((row) =>
            row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [data, searchTerm]);

    // Sort by total rejections descending
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => b.total - a.total);
    }, [filteredData]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const totalsByCategory = useMemo(() => {
        if (!data || data.length === 0) return {
            C9b_NoSignature: 0,
            C9c_SigMismatch: 0,
            C9d_ReceivedLate: 0,
            C9e_MissingInfo: 0,
            C9f_NotRegistered: 0,
            C9g_WrongEnvelope: 0,
            C9h_Other: 0,
            total: 0,
        };

        return {
            C9b_NoSignature: data.reduce((sum, row) => sum + row.C9b_NoSignature, 0),
            C9c_SigMismatch: data.reduce((sum, row) => sum + row.C9c_SigMismatch, 0),
            C9d_ReceivedLate: data.reduce((sum, row) => sum + row.C9d_ReceivedLate, 0),
            C9e_MissingInfo: data.reduce((sum, row) => sum + row.C9e_MissingInfo, 0),
            C9f_NotRegistered: data.reduce((sum, row) => sum + row.C9f_NotRegistered, 0),
            C9g_WrongEnvelope: data.reduce((sum, row) => sum + row.C9g_WrongEnvelope, 0),
            C9h_Other: data.reduce((sum, row) => sum + row.C9h_Other, 0),
            total: data.reduce((sum, row) => sum + row.total, 0),
        };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    No mail rejections table data available for this state.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column", width: "100%" }}>
            <Box mb={1.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="h6" fontWeight={600}>
                    Mail Ballot Rejections by County/Town
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
                                }}>
                                Region
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                No Signature
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Signature Mismatch
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Received Late
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Missing Info
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Not Registered
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Wrong Envelope
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
                                Other
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    py: 1.5,
                                }}>
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
                                            }}>
                                            {row.geographicUnit}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9b_NoSignature.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9c_SigMismatch.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9d_ReceivedLate.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9e_MissingInfo.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9f_NotRegistered.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9g_WrongEnvelope.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: rowBg }}>
                                            {row.C9h_Other.toLocaleString()}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: "bold",
                                                backgroundColor: rowBg,
                                            }}>
                                            {row.total.toLocaleString()}
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
                                }}>
                                TOTAL
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9b_NoSignature.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9c_SigMismatch.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9d_ReceivedLate.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9e_MissingInfo.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9f_NotRegistered.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9g_WrongEnvelope.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.C9h_Other.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {totalsByCategory.total.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ flexShrink: 0, borderTop: "1px solid #e0e0e0", backgroundColor: "white" }}>
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


export default MailRejectionsTable;