import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	Box,
	Container,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import theme from "../theme";

const Navigation: React.FC = () => {
	const location = useLocation();

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				top: 0,
				left: 0,
				right: 0,
				zIndex: 1100,
				background: theme.palette.primary.main,
				borderBottom: "1px solid rgba(255,255,255,0.1)",
				minHeight: 90,
				height: "auto",
				flexShrink: 0,
			}}>
			<Container maxWidth="lg">
				<Toolbar sx={{ px: 0, minHeight: { xs: 90, sm: 90 }, height: "auto" }}>
					<Typography
						variant="h5"
						component={Link}
						to="/"
						sx={{
							flexGrow: 1,
							fontWeight: 700,
							letterSpacing: "-0.02em",
							display: "flex",
							alignItems: "center",
							whiteSpace: "nowrap",
							mr: 4,
							textDecoration: "none",
							color: "inherit",
							cursor: "pointer",
							transition: "opacity 0.2s ease",
							"&:hover": {
								opacity: 0.85,
							},
						}}>
						<Box
							component="img"
							src="/toronto-raptors-logo.png"
							alt="Toronto Raptors Logo"
							sx={{ height: 60, width: 60, mr: 1.5, display: "inline-block", verticalAlign: "middle", borderRadius: "50%", objectFit: 'cover', flexShrink: 0 }}
						/>
						Raptors Electoral Insight Hub
					</Typography>
					<Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
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
							to="/voting-equipment-summary"
							variant={location.pathname === "/voting-equipment-summary" ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor":
									location.pathname === "/voting-equipment-summary"
										? "rgba(255,255,255,0.15)"
										: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border":
									location.pathname === "/voting-equipment-summary"
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid transparent",
							}}>
							Voting Equipment Summary
						</Button>
						<Button
							color="inherit"
							component={Link}
							to="/party-comparison"
							variant={location.pathname === "/party-comparison" ? "outlined" : "text"}
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
							Compare Parties
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
