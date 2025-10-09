import React from "react";
import { Container, Typography, Paper, Box, Button, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PartyComparisonTable from "../tables/PartyComparisonTable";

const PartyComparisonPage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Container sx={{ py: 4 }}>
			<Box display="flex" alignItems="center" gap={2} mb={4}>
				{/* <Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate("/")}
					variant="outlined">
					Back to Home
				</Button>
				probably not necessary since there's a home button, left just in case though
				*/}
				<Typography variant="h4" component="h1">
					Party-Based Comparisons
				</Typography>
			</Box>

			<Box display="flex" flexDirection="column" gap={3}>
				<Paper sx={{ padding: 3 }}>
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box display="flex" flexDirection="column">
								<Typography variant="h6" gutterBottom>
									Republican vs. Democratic States Analysis
								</Typography>
								<Typography variant="body1" paragraph>
									Compare voting patterns, turnout rates, and registration trends
									between Republican and Democratic states.
								</Typography>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<PartyComparisonTable republicanStateName="Arkansas" democraticStateName="Rhode Island"/>
						</AccordionDetails>
					</Accordion>
				</Paper>

				<Paper sx={{ padding: 3 }}>
					<Typography variant="h6" gutterBottom>
						Voting Rights Comparison
					</Typography>
					<Typography variant="body1" paragraph>
						Analysis of voting accessibility, ballot access, and registration
						requirements across party-controlled states.
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Interactive charts and tables coming soon.
					</Typography>
				</Paper>

				<Paper sx={{ padding: 3 }}>
					<Typography variant="h6" gutterBottom>
						Historical Trends
					</Typography>
					<Typography variant="body1" paragraph>
						Track changes in voting patterns and equipment usage from 2016 to
						2024 by political affiliation.
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Time-series visualizations in development.
					</Typography>
				</Paper>
			</Box>
		</Container>
	);
};

export default PartyComparisonPage;
