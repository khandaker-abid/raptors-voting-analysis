import React from "react";
import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	Box,
	Container,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const Navigation: React.FC = () => {
	const location = useLocation();

	return (
		<AppBar
			position="static"
			elevation={0}
			sx={{
				background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
				borderBottom: "1px solid rgba(255,255,255,0.1)",
			}}>
			<Container maxWidth="lg">
				<Toolbar sx={{ px: 0 }}>
					<Typography
						variant="h5"
						component="div"
						sx={{
							flexGrow: 1,
							fontWeight: 700,
							letterSpacing: "-0.02em",
						}}>
						🗳️ Voting Data Explorer
					</Typography>
					<Box sx={{ display: "flex", gap: 1 }}>
						<Button
							color="inherit"
							component={Link}
							to="/"
							variant={location.pathname === "/" ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor":
									location.pathname === "/"
										? "rgba(255,255,255,0.15)"
										: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border":
									location.pathname === "/"
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid transparent",
							}}>
							Home
						</Button>

						<Button
							color="inherit"
							component={Link}
							to="/party-comparison"
							variant={
								location.pathname === "/party-comparison" ? "outlined" : "text"
							}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor":
									location.pathname === "/party-comparison"
										? "rgba(255,255,255,0.15)"
										: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border":
									location.pathname === "/party-comparison"
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid transparent",
							}}>
							Party Comparison
						</Button>

						{/* ✅ New Navigation Link for GUI-21 to GUI-23 */}
						<Button
							color="inherit"
							component={Link}
							to="/registration-comparison"
							variant={
								location.pathname === "/registration-comparison"
									? "outlined"
									: "text"
							}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor":
									location.pathname === "/registration-comparison"
										? "rgba(255,255,255,0.15)"
										: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border":
									location.pathname === "/registration-comparison"
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid transparent",
							}}>
							Registration Comparison
						</Button>
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Navigation;
