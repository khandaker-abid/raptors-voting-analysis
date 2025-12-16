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
import type { PollbookDeletionRow } from "../data/types";

type SortableColumn = 'geographicUnit' | 'A12b_Death' | 'A12c_Moved' | 'A12d_Felon' | 'A12e_MentalIncap' | 'A12f_Requested' | 'A12g_FailedToVote' | 'A12h_Other' | 'total';
type SortOrder = 'asc' | 'desc';

interface Props {
    data: PollbookDeletionRow[];
}

const PollbookDeletionsTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 5; // Fixed at 5 rows per page to match Active Voters
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
            row.geographicUnit.toLowerCase().includes(searchTerm.toLowerCase())
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
                aValue = a[sortColumn] || 0;
                bValue = b[sortColumn] || 0;
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
        <Paper sx={{ pt: 0.5, px: 0.5, pb: 0, display: "flex", flexDirection: "column", width: "100%" }}>
            <Box
                mb={0.5}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
            >
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: "0.95rem" }}>
                    Pollbook Deletions by County
                </Typography>
                <TextField
                    size="small"
                    placeholder="Search county..."
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
                                }}
                            >
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
                                    County
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12b_Death'}
                                    direction={sortColumn === 'A12b_Death' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12b_Death')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Death
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12c_Moved'}
                                    direction={sortColumn === 'A12c_Moved' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12c_Moved')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Moved
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12d_Felon'}
                                    direction={sortColumn === 'A12d_Felon' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12d_Felon')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Felon
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12e_MentalIncap'}
                                    direction={sortColumn === 'A12e_MentalIncap' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12e_MentalIncap')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Mental Incap
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12f_Requested'}
                                    direction={sortColumn === 'A12f_Requested' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12f_Requested')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Requested
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12g_FailedToVote'}
                                    direction={sortColumn === 'A12g_FailedToVote' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12g_FailedToVote')}
                                    sx={{
                                        color: 'white !important',
                                        '&:hover': { color: 'white !important' },
                                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                                        '&.Mui-active': { color: 'white !important' },
                                        '&.Mui-active .MuiTableSortLabel-icon': { color: 'white !important' },
                                    }}>
                                    Failed to Vote
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
                                }}
                            >
                                <TableSortLabel
                                    active={sortColumn === 'A12h_Other'}
                                    direction={sortColumn === 'A12h_Other' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('A12h_Other')}
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
                                }}
                            >
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
                                            }}
                                        >
                                            {normalizeCountyName(row.geographicUnit)}
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
                    sx={{ minHeight: 0, height: 36, p: 0, overflow: "hidden", '& .MuiToolbar-root': { minHeight: 36, height: 36, padding: '0 8px' } }}
                />
            </Box>
        </Paper>
    );
};

export default PollbookDeletionsTable;