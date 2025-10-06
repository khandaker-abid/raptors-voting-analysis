import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	Box,
	Container,
} from "@mui/material";
import logo from "../assets/raptors+compass.png";
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
						<Box
							component="img"
							src={logo}
							alt="Raptors Compass"
							sx={{ height: 70, width: 70, mr: 1.5, display: "inline-block", verticalAlign: "middle", borderRadius: 1, objectFit: 'cover' }}
						/>
						Raptors Voter's Compass
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
							to="/per-state-voting-equipment"
							variant={location.pathname === "/per-state-voting-equipment" ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor":
									location.pathname === "/per-state-voting-equipment"
										? "rgba(255,255,255,0.15)"
										: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border":
									location.pathname === "/per-state-voting-equipment"
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid transparent",
							}}>
							State Voting Equipment
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
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Navigation;
