import React, { useState, useMemo } from "react";
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
import DropBoxBubbleChart from "../charts/DropBoxBubbleChart";
import { calculatePowerRegression } from "../utils/regression";

const RegistrationComparisonPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const optInOutData = getOptInOutComparisonData();
  const partyData = getPartyComparisonData();
  const earlyVotingData = getEarlyVotingComparisonData();
  const dropBoxData = getDropBoxVotingData();

  // Calculate regression lines for drop box bubble chart (GUI-26)
  const dropBoxRegressionLines = useMemo(() => {
    const democraticPoints = dropBoxData
      .filter((d) => d.party === "D")
      .map((d) => ({ x: d.republicanPct, y: d.dropBoxPct }));

    const republicanPoints = dropBoxData
      .filter((d) => d.party === "R")
      .map((d) => ({ x: d.republicanPct, y: d.dropBoxPct }));

    const dRegression = calculatePowerRegression(democraticPoints);
    const rRegression = calculatePowerRegression(republicanPoints);

    return [
      {
        party: "D" as const,
        coefficients: { a: dRegression.a, b: dRegression.b },
        r2: dRegression.r2,
      },
      {
        party: "R" as const,
        coefficients: { a: rRegression.a, b: rRegression.b },
        r2: rRegression.r2,
      },
    ];
  }, [dropBoxData]);

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
        {/* GUI-21: Opt-in vs Opt-out Comparison */}
        {tabValue === 0 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center">
              Opt-in vs Opt-out States (GUI-21)
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Comparing voter registration and turnout rates (2024 EAVS data)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>State</strong></TableCell>
                  <TableCell><strong>Registration Type</strong></TableCell>
                  <TableCell><strong>Same-Day Registration</strong></TableCell>
                  <TableCell align="right"><strong>Registered Voters</strong></TableCell>
                  <TableCell align="right"><strong>Registration Rate (%)</strong></TableCell>
                  <TableCell align="right"><strong>Votes Cast</strong></TableCell>
                  <TableCell align="right"><strong>Turnout Rate (%)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {optInOutData.map((row) => (
                  <TableRow key={row.state}>
                    <TableCell>{row.state}</TableCell>
                    <TableCell>{row.registrationType || "N/A"}</TableCell>
                    <TableCell>{row.sameDayRegistration ? "Yes" : "No"}</TableCell>
                    <TableCell align="right">{row.registeredVoters?.toLocaleString() || "N/A"}</TableCell>
                    <TableCell align="right">{row.registrationRate}%</TableCell>
                    <TableCell align="right">{row.votesCast?.toLocaleString() || "N/A"}</TableCell>
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

        {/* GUI-23: Early Voting Comparison */}
        {tabValue === 2 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center">
              Early Voting Comparison (GUI-23)
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Republican vs Democratic states - 2024 EAVS data
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>State</strong></TableCell>
                  <TableCell align="right"><strong>Total Early Votes</strong></TableCell>
                  <TableCell align="right"><strong>Total Early %</strong></TableCell>
                  <TableCell align="right"><strong>Mail Ballots</strong></TableCell>
                  <TableCell align="right"><strong>Mail %</strong></TableCell>
                  <TableCell align="right"><strong>Early In-Person</strong></TableCell>
                  <TableCell align="right"><strong>In-Person %</strong></TableCell>
                  <TableCell align="right"><strong>Drop Box</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {earlyVotingData.map((row: any) => (
                  <TableRow key={row.state}>
                    <TableCell>{row.state}</TableCell>
                    <TableCell align="right">
                      {row.total.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">{row.totalPct}%</TableCell>
                    <TableCell align="right">{row.mail?.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.mailPct}%</TableCell>
                    <TableCell align="right">{row.inPerson?.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.inPersonPct}%</TableCell>
                    <TableCell align="right">{row.dropBox?.toLocaleString() || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Percentages calculated based on total votes cast in each state
            </Typography>
          </Paper>
        )}

        {tabValue === 3 && (
          <DropBoxBubbleChart data={dropBoxData} regressionLines={dropBoxRegressionLines} />
        )}
      </Box>
    </Container>
  );
};

export default RegistrationComparisonPage;
