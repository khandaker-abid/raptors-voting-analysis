import React from "react";
import {
	Box,
	Container,
	Typography,
	Link,
	Divider,
	IconButton,
	Chip,
} from "@mui/material";
import { GitHub, Email } from "@mui/icons-material";

const Footer: React.FC = () => {
	const currentYear = new Date().getFullYear();

	return (
		<Box
			component="footer"
			sx={{
				bgcolor: "primary.main",
				color: "primary.contrastText",
				py: 6,
				mt: "auto",
			}}>
			<Container maxWidth="lg">
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
						gap: 4,
						mb: 4,
					}}>
					{/* About Section */}
					<Box>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
							Voting Data Explorer
						</Typography>
						<Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
							Empowering democracy through data visualization and analysis.
							Explore voting trends, equipment usage, and electoral patterns
							across the United States with our interactive platform.
						</Typography>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Chip
								label="Open Source"
								size="small"
								variant="outlined"
								sx={{ color: "inherit", borderColor: "inherit" }}
							/>
							<Chip
								label="2024 Election Data"
								size="small"
								variant="outlined"
								sx={{ color: "inherit", borderColor: "inherit" }}
							/>
							<Chip
								label="Interactive Maps"
								size="small"
								variant="outlined"
								sx={{ color: "inherit", borderColor: "inherit" }}
							/>
						</Box>
					</Box>

					{/* Featured States */}
					<Box>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
							Featured States
						</Typography>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							<Link
								href="/state/Rhode%20Island"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}>
								Rhode Island
							</Link>
							<Link
								href="/state/West%20Virginia"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}>
								West Virginia
							</Link>
							<Link
								href="/state/Arkansas"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}>
								Arkansas
							</Link>
							<Link
								href="/party-comparison"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}>
								Party Comparisons
							</Link>
						</Box>
					</Box>

					{/* Connect Section */}
					<Box>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
							Connect & Resources
						</Typography>
						<Box
							sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
							<Link
								href="https://github.com"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}
								target="_blank"
								rel="noopener noreferrer">
								Source Code
							</Link>
							<Link
								href="https://fec.gov"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}
								target="_blank"
								rel="noopener noreferrer">
								FEC Data
							</Link>
							<Link
								href="https://census.gov"
								color="inherit"
								underline="hover"
								sx={{ opacity: 0.9 }}
								target="_blank"
								rel="noopener noreferrer">
								Census Bureau
							</Link>
						</Box>
						<Box sx={{ display: "flex", gap: 1 }}>
							<IconButton
								color="inherit"
								size="small"
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								sx={{ "opacity": 0.8, "&:hover": { opacity: 1 } }}>
								<GitHub fontSize="small" />
							</IconButton>
							<IconButton
								color="inherit"
								size="small"
								href="mailto:contact@votingexplorer.com"
								sx={{ "opacity": 0.8, "&:hover": { opacity: 1 } }}>
								<Email fontSize="small" />
							</IconButton>
						</Box>
					</Box>
				</Box>

				<Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 3 }} />

				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						justifyContent: "space-between",
						alignItems: "center",
						gap: 2,
					}}>
					<Typography variant="body2" sx={{ opacity: 0.8 }}>
						© {currentYear} Voting Data Explorer. Built for democracy,
						transparency, and civic engagement.
					</Typography>
					<Box sx={{ display: "flex", gap: 3 }}>
						<Link
							href="#"
							color="inherit"
							underline="hover"
							variant="body2"
							sx={{ opacity: 0.8 }}>
							Privacy Policy
						</Link>
						<Link
							href="#"
							color="inherit"
							underline="hover"
							variant="body2"
							sx={{ opacity: 0.8 }}>
							Terms of Use
						</Link>
						<Link
							href="#"
							color="inherit"
							underline="hover"
							variant="body2"
							sx={{ opacity: 0.8 }}>
							Data Sources
						</Link>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};

export default Footer;
