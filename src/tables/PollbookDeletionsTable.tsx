// GUI - 8
import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { PollbookDeletionRow } from "../data/types";


interface Props { data: PollbookDeletionRow[]; }


const PollbookDeletionsTable: React.FC<Props> = ({ data }) => (
    <Paper sx={{ p: 2 }}>
        <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Region</TableCell>
                        <TableCell align="right">A12b Death</TableCell>
                        <TableCell align="right">A12c Moved</TableCell>
                        <TableCell align="right">A12d Felon</TableCell>
                        <TableCell align="right">A12e Mental Incap</TableCell>
                        <TableCell align="right">A12f Requested</TableCell>
                        <TableCell align="right">A12g Failed to Vote</TableCell>
                        <TableCell align="right">A12h Other</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.geographicUnit}>
                            <TableCell>{r.geographicUnit}</TableCell>
                            <TableCell align="right">{r.A12b_Death.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12c_Moved.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12d_Felon.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12e_MentalIncap.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12f_Requested.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12g_FailedToVote.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.A12h_Other.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.total.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);


export default PollbookDeletionsTable;