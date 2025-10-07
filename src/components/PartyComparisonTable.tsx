// components/PartyComparisonTable.tsx
import React from "react";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material";

interface PartyStateData {
  state: string;
  registrationRate: number;
  turnoutRate: number;
  earlyVotingAbs?: number;
  earlyVotingPct?: number;
}

interface Props {
  data: PartyStateData[];
  type: "registration" | "earlyVoting";
}

const PartyComparisonTable: React.FC<Props> = ({ data, type }) => {
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {type === "registration"
          ? "Republican vs Democratic States Registration Comparison"
          : "Republican vs Democratic States Early Voting Comparison"}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>State</TableCell>
            <TableCell>Registration %</TableCell>
            <TableCell>Turnout %</TableCell>
            {type === "earlyVoting" && (
              <>
                <TableCell>Early Votes</TableCell>
                <TableCell>Early Voting %</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.state}>
              <TableCell>{row.state}</TableCell>
              <TableCell>{row.registrationRate}%</TableCell>
              <TableCell>{row.turnoutRate}%</TableCell>
              {type === "earlyVoting" && (
                <>
                  <TableCell>{row.earlyVotingAbs?.toLocaleString()}</TableCell>
                  <TableCell>{row.earlyVotingPct}%</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default PartyComparisonTable;