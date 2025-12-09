import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  fetchOptInOutComparison,
  fetchPartyComparison,
  fetchEarlyVotingComparison,
} from "../data/api";

const RegistrationComparisonPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [optInOutData, setOptInOutData] = useState<any[]>([]);
  const [partyData, setPartyData] = useState<any[]>([]);
  const [earlyVotingData, setEarlyVotingData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [optInOut, party, earlyVoting] = await Promise.all([
          fetchOptInOutComparison(),
          fetchPartyComparison(),
          fetchEarlyVotingComparison(),
        ]);

        setOptInOutData(optInOut);

        if (party && party.stateDetails) {
          const relevantStates = [];

          if (party.stateDetails.Democratic) {
            const ri = party.stateDetails.Democratic.find((s: any) => s.state && s.state.toUpperCase().includes("RHODE ISLAND"));
            const md = party.stateDetails.Democratic.find((s: any) => s.state && s.state.toUpperCase().includes("MARYLAND"));
            if (ri) relevantStates.push({ state: `${ri.state} (Democratic)`, registrationRate: ri.registrationRate, turnoutRate: ri.turnout });
            if (md) relevantStates.push({ state: `${md.state} (Democratic)`, registrationRate: md.registrationRate, turnoutRate: md.turnout });
          }

          if (party.stateDetails.Republican) {
            const ar = party.stateDetails.Republican.find((s: any) => s.state && s.state.toUpperCase().includes("ARKANSAS"));
            if (ar) relevantStates.push({ state: `${ar.state} (Republican)`, registrationRate: ar.registrationRate, turnoutRate: ar.turnout });
          }

          setPartyData(relevantStates);
        }

        setEarlyVotingData(earlyVoting);

      } catch (err) {
        console.error("Error loading registration comparison data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container
        maxWidth={false}
        sx={{
          height: "calc(100vh - 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        maxWidth={false}
        sx={{
          height: "calc(100vh - 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: "calc(100vh - 90px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Typography
        variant="h5"
        align="center"
        sx={{
          fontWeight: 700,
          mb: 1.5,
          color: "text.primary",
        }}
      >
        Registration & Early Voting Comparisons (2024)
      </Typography>

      <Paper sx={{ mb: 1.5 }}>
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
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {tabValue === 0 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600} align="center">
              Opt-in vs Opt-out States
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mb: 1, display: "block" }}>
              Comparing voter registration and turnout rates (2024 EAVS data)
            </Typography>
            <Box sx={{ overflow: "auto", flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>State</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Registration Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Same-Day Registration</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Registered Voters</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Registration Rate (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Votes Cast</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Turnout Rate (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {optInOutData.map((row) => (
                    <TableRow key={row.state} hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
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
            </Box>
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600} align="center">
              Democratic vs Republican States
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mb: 1, display: "block" }}>
              Comparing registration and turnout rates across political party affiliations
            </Typography>
            <Box sx={{ overflow: "auto", flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>State</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Reg. %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Turnout %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partyData.map((row) => (
                    <TableRow key={row.state} hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                      <TableCell>{row.state}</TableCell>
                      <TableCell align="right">{row.registrationRate}%</TableCell>
                      <TableCell align="right">{row.turnoutRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600} align="center">
              Early Voting Comparison
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mb: 1, display: "block" }}>
              Republican vs Democratic states - 2024 EAVS data
            </Typography>
            <Box sx={{ overflow: "auto", flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>State</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Total Early Votes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Total Early %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Mail Ballots</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Mail %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Early In-Person</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>In-Person %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#616161", color: "white" }}>Drop Box</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earlyVotingData.map((row: any) => (
                    <TableRow key={row.state} hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
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
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Percentages calculated based on total votes cast in each state
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default RegistrationComparisonPage;
