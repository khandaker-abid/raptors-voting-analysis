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
						🗳️ Raptors Voter's Compass
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
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Navigation;
