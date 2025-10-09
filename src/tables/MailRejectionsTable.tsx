// GUI - 9
import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { MailRejectionRow } from "../data/types";


interface Props { data: MailRejectionRow[]; }


const MailRejectionsTable: React.FC<Props> = ({ data }) => (
    <Paper sx={{ p: 2 }}>
        <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Region</TableCell>
                        <TableCell align="right">No Signature</TableCell>
                        <TableCell align="right">Signature Mismatch</TableCell>
                        <TableCell align="right">Received Late</TableCell>
                        <TableCell align="right">Missing Info</TableCell>
                        <TableCell align="right">Not Registered</TableCell>
                        <TableCell align="right">Wrong Envelope</TableCell>
                        <TableCell align="right">Other</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.geographicUnit}>
                            <TableCell>{r.geographicUnit}</TableCell>
                            <TableCell align="right">{r.C9b_NoSignature.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9c_SigMismatch.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9d_ReceivedLate.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9e_MissingInfo.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9f_NotRegistered.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9g_WrongEnvelope.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.C9h_Other.toLocaleString()}</TableCell>
                            <TableCell align="right">{r.total.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);


export default MailRejectionsTable;