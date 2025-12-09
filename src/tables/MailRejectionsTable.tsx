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
    TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { MailRejectionRow } from "../data/types";

type SortableColumn = 'geographicUnit' | 'C9b_NoSignature' | 'C9c_SigMismatch' | 'C9d_ReceivedLate' | 'C9e_MissingInfo' | 'C9f_NotRegistered' | 'C9g_WrongEnvelope' | 'C9h_Other' | 'total';
type SortOrder = 'asc' | 'desc';


interface Props { data: MailRejectionRow[]; }


const MailRejectionsTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 5; // Fixed at 5 rows per page (no scrolling, just pagination)
    const [searchTerm, setSearchTerm] = useState("");
    const [sortColumn, setSortColumn] = useState<SortableColumn>('geographicUnit');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const normalizeCountyName = (name: string): string => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm) return data;

        return data.filter((row) =>
            row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [data, searchTerm]);

    const sortedData = useMemo(() => {
        const sorted = [...filteredData];
        sorted.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortColumn === 'geographicUnit') {
                aValue = normalizeCountyName(a.geographicUnit);
                bValue = normalizeCountyName(b.geographicUnit);
            } else {
                aValue = a[sortColumn];
                bValue = b[sortColumn];
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc'
                    ? (aValue as number) - (bValue as number)
                    : (bValue as number) - (aValue as number);
            }
        });
        return sorted;
    }, [filteredData, sortColumn, sortOrder]);

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('asc');
        }
        setPage(0); // Reset to first page when sorting
    };

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
        <Paper sx={{ pt: 0.5, px: 0.5, pb: 0, display: "flex", flexDirection: "column", width: "100%" }}>
            <Box mb={0.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.75}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: "0.95rem" }}>
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
                        sx: { fontSize: "0.85rem", height: "32px" }
                    }}
                    sx={{ minWidth: 180 }}
                />
            </Box>

            {/* These two lines below are the key to getting the table to stay 
                in its grid spot and not increase in width, causing the lower 
                few table cells to be hidden from view */}
            <TableContainer sx={{ mb: 0, overflowX: "auto", overflowY: "hidden" }}>
                <Table size="small" sx={{ width: "max-content", minWidth: "100%" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'geographicUnit'}
                                    direction={sortColumn === 'geographicUnit' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('geographicUnit')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Region
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9b_NoSignature'}
                                    direction={sortColumn === 'C9b_NoSignature' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9b_NoSignature')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    No Signature
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9c_SigMismatch'}
                                    direction={sortColumn === 'C9c_SigMismatch' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9c_SigMismatch')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Signature Mismatch
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9d_ReceivedLate'}
                                    direction={sortColumn === 'C9d_ReceivedLate' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9d_ReceivedLate')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Received Late
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9e_MissingInfo'}
                                    direction={sortColumn === 'C9e_MissingInfo' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9e_MissingInfo')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Missing Info
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9f_NotRegistered'}
                                    direction={sortColumn === 'C9f_NotRegistered' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9f_NotRegistered')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Not Registered
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9g_WrongEnvelope'}
                                    direction={sortColumn === 'C9g_WrongEnvelope' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9g_WrongEnvelope')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Wrong Envelope
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'C9h_Other'}
                                    direction={sortColumn === 'C9h_Other' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('C9h_Other')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Other
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#616161",
                                    color: "white",
                                    py: 0.85,
                                    cursor: "pointer",
                                }}>
                                <TableSortLabel
                                    active={sortColumn === 'total'}
                                    direction={sortColumn === 'total' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('total')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Total
                                </TableSortLabel>
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
                                            {normalizeCountyName(row.geographicUnit)}
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
                    sx={{ minHeight: 0, height: 36, p: 0, '& .MuiToolbar-root': { minHeight: 36, height: 36, padding: '0 8px' } }}
                />
            </Box>
        </Paper>
    );
};


export default MailRejectionsTable;