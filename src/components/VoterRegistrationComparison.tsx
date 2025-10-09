import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { getOptInOutComparisonData } from "../data/mockComparisons";

interface ComparisonRow {
  state: string;
  registrationRate: number;
  turnoutRate: number;
  registrationAbsolute: number;
  turnoutAbsolute: number;
}

const VoterRegistrationComparison: React.FC = () => {
  const [data, setData] = useState<ComparisonRow[] | null>(null);

  const handleCompare = () => {
    const comparisonData = getOptInOutComparisonData();
    setData(comparisonData);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Compare Voter Registration: Opt-in vs Opt-out
      </Typography>

      {!data && (
        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" onClick={handleCompare}>
            Compare States
          </Button>
        </Box>
      )}

      {data && (
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>State</TableCell>
              <TableCell align="right">Reg. %</TableCell>
              <TableCell align="right">Reg. Absolute</TableCell>
              <TableCell align="right">Turnout %</TableCell>
              <TableCell align="right">Turnout Absolute</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.state}>
                <TableCell>{row.state}</TableCell>
                <TableCell align="right">{row.registrationRate}%</TableCell>
                <TableCell align="right">
                  {row.registrationAbsolute.toLocaleString()}
                </TableCell>
                <TableCell align="right">{row.turnoutRate}%</TableCell>
                <TableCell align="right">
                  {row.turnoutAbsolute.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default VoterRegistrationComparison;
