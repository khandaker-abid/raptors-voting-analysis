import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from "@mui/material";
import {
  getOptInOutComparisonData,
  getPartyComparisonData,
  getEarlyVotingComparisonData,
  getDropBoxVotingData,
} from "../data/mockComparisons";
import DropBoxBubbleChart from "../components/DropBoxBubbleChart";

const RegistrationComparisonPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const optInOutData = getOptInOutComparisonData();
  const partyData = getPartyComparisonData();
  const earlyVotingData = getEarlyVotingComparisonData();
  const dropBoxData = getDropBoxVotingData();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: "100vh" }}>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{
          fontWeight: 700,
          mb: 2,
          background: "linear-gradient(90deg,#1976d2,#42a5f5)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Registration & Early Voting Comparisons (2024 - Mock Data)
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Opt-in vs Opt-out" />
          <Tab label="Party Comparison" />
          <Tab label="Early Voting" />
          <Tab label="Drop Box Voting" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ height: "calc(100% - 120px)" }}>
        {tabValue === 0 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center">
              Opt-in vs Opt-out States
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>State</TableCell>
                  <TableCell align="right">Reg. %</TableCell>
                  <TableCell align="right">Turnout %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {optInOutData.map((row) => (
                  <TableRow key={row.state}>
                    <TableCell>{row.state}</TableCell>
                    <TableCell align="right">{row.registrationRate}%</TableCell>
                    <TableCell align="right">{row.turnoutRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center">
              Democratic vs Republican States
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>State</TableCell>
                  <TableCell align="right">Reg. %</TableCell>
                  <TableCell align="right">Turnout %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partyData.map((row) => (
                  <TableRow key={row.state}>
                    <TableCell>{row.state}</TableCell>
                    <TableCell align="right">{row.registrationRate}%</TableCell>
                    <TableCell align="right">{row.turnoutRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center">
              Early Voting Comparison
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>State</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Mail</TableCell>
                  <TableCell align="right">In-Person</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {earlyVotingData.map((row) => (
                  <TableRow key={row.state}>
                    <TableCell>{row.state}</TableCell>
                    <TableCell align="right">
                      {row.total.toLocaleString()} ({row.totalPct}%)
                    </TableCell>
                    <TableCell align="right">{row.mail.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.inPerson.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {tabValue === 3 && (
          <DropBoxBubbleChart data={dropBoxData} />
        )}
      </Box>
    </Container>
  );
};

export default RegistrationComparisonPage;
