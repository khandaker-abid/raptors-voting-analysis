import React from "react";
import USMap from "../components/USMap";
import { Container, Typography, Paper, Box } from "@mui/material";

const SplashPage: React.FC = () => {
	return (
		<Container maxWidth="lg" sx={{ py: 6, mx: "auto" }}>
			{/* Hero Section - Centered */}
			<Box
				sx={{
					textAlign: "center",
					mb: 8,
					mx: "auto",
					maxWidth: "900px",
				}}>
				<Typography
					variant="h1"
					component="h1"
					gutterBottom
					sx={{
						fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
						fontWeight: 700,
						background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
						backgroundClip: "text",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						mb: 2,
					}}>
					Voting Data Explorer
				</Typography>
				<Typography
					variant="h4"
					component="h2"
					gutterBottom
					sx={{
						color: "text.secondary",
						fontWeight: 400,
						mb: 3,
					}}>
					Illuminating Democracy Through Data
				</Typography>
				<Typography
					variant="h6"
					paragraph
					sx={{
						color: "text.secondary",
						lineHeight: 1.6,
						maxWidth: "700px",
						mx: "auto",
					}}>
					Dive into the heart of American democracy with our interactive
					platform designed to illuminate voting trends, equipment usage, and
					ballot behaviors across the mainland United States.
				</Typography>
			</Box>

			{/* Map Section - Centered */}
			<Box sx={{ mb: 8, display: "flex", justifyContent: "center" }}>
				<USMap />
			</Box>

			{/* Feature Cards - Centered */}
			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					gap: 4,
					justifyContent: "center",
					alignItems: "stretch",
					maxWidth: "1000px",
					mx: "auto",
				}}>
				<Box sx={{ flex: 1, minWidth: { xs: "100%", md: "400px" } }}>
					<Paper
						elevation={8}
						sx={{
							"p": 4,
							"height": "100%",
							"borderRadius": 3,
							"background": "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
							"transition": "transform 0.2s ease-in-out",
							"&:hover": {
								transform: "translateY(-4px)",
								boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
							},
						}}>
						<Typography
							variant="h5"
							gutterBottom
							sx={{
								fontWeight: 600,
								color: "primary.main",
								textAlign: "center",
							}}>
							🗺️ What You'll Discover
						</Typography>
						<Box
							component="ul"
							sx={{
								"pl": 2,
								"m": 0,
								"& li": { mb: 1, color: "text.secondary" },
							}}>
							<li>
								<strong>State-by-State Insights</strong> for Rhode Island, West
								Virginia, and Arkansas
							</li>
							<li>
								<strong>Interactive Maps & Charts</strong> with county-level
								detail
							</li>
							<li>
								<strong>Party-Based Comparisons</strong> across different states
							</li>
							<li>
								<strong>Historical Trends</strong> from 2016 to 2024
							</li>
						</Box>
					</Paper>
				</Box>
				<Box sx={{ flex: 1, minWidth: { xs: "100%", md: "400px" } }}>
					<Paper
						elevation={8}
						sx={{
							"p": 4,
							"height": "100%",
							"borderRadius": 3,
							"background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							"color": "white",
							"transition": "transform 0.2s ease-in-out",
							"&:hover": {
								transform: "translateY(-4px)",
								boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
							},
						}}>
						<Typography
							variant="h5"
							gutterBottom
							sx={{ fontWeight: 600, textAlign: "center" }}>
							⚖️ Why It Matters
						</Typography>
						<Typography
							variant="body1"
							sx={{ mb: 2, opacity: 0.95, textAlign: "center" }}>
							Understanding voting infrastructure and behavior is key to
							strengthening civic engagement and electoral integrity.
						</Typography>
						<Box
							component="ul"
							sx={{
								"pl": 2,
								"mt": 1,
								"mb": 0,
								"& li": { mb: 1, opacity: 0.9 },
							}}>
							<li>Identify disparities in ballot access</li>
							<li>Evaluate equipment reliability and age</li>
							<li>Compare regional voting patterns</li>
							<li>Inform policy and advocacy efforts</li>
						</Box>
					</Paper>
				</Box>
			</Box>
		</Container>
	);
};

export default SplashPage;
