import React, { useState } from "react";
import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	Box,
	Container,
	Menu,
	MenuItem,
	MenuList,
	ListSubheader,
	Divider,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const Navigation: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [comparisonMenuAnchor, setComparisonMenuAnchor] =
		useState<null | HTMLElement>(null);
	const [chartsMenuAnchor, setChartsMenuAnchor] = useState<null | HTMLElement>(
		null,
	);

	const handleComparisonMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setComparisonMenuAnchor(event.currentTarget);
	};

	const handleComparisonMenuClose = () => {
		setComparisonMenuAnchor(null);
	};

	const handleChartsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setChartsMenuAnchor(event.currentTarget);
	};

	const handleChartsMenuClose = () => {
		setChartsMenuAnchor(null);
	};

	const handleNavigate = (path: string) => {
		navigate(path);
		setComparisonMenuAnchor(null);
		setChartsMenuAnchor(null);
	};

	const isComparisonPage = location.pathname.includes("comparison");
	const isChartPage =
		location.pathname.includes("chart") || location.pathname.includes("bubble");
	const isResetPage = location.pathname.includes("reset");

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

						{/* Comparisons Dropdown */}
						<Button
							color="inherit"
							onClick={handleComparisonMenuOpen}
							endIcon={<ExpandMoreIcon />}
							variant={isComparisonPage ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor": isComparisonPage
									? "rgba(255,255,255,0.15)"
									: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border": isComparisonPage
									? "1px solid rgba(255,255,255,0.3)"
									: "1px solid transparent",
							}}>
							Comparisons
						</Button>

						{/* Charts Dropdown */}
						<Button
							color="inherit"
							onClick={handleChartsMenuOpen}
							endIcon={<ExpandMoreIcon />}
							variant={isChartPage ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor": isChartPage
									? "rgba(255,255,255,0.15)"
									: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border": isChartPage
									? "1px solid rgba(255,255,255,0.3)"
									: "1px solid transparent",
							}}>
							Charts
						</Button>

						{/* Reset Page Button */}
						<Button
							color="inherit"
							component={Link}
							to="/reset-page"
							variant={isResetPage ? "outlined" : "text"}
							sx={{
								"textDecoration": "none",
								"borderRadius": 2,
								"px": 3,
								"fontWeight": 600,
								"backgroundColor": isResetPage
									? "rgba(255,255,255,0.15)"
									: "transparent",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
								},
								"border": isResetPage
									? "1px solid rgba(255,255,255,0.3)"
									: "1px solid transparent",
							}}>
							Reset
						</Button>

						{/* Comparisons Menu */}
						<Menu
							anchorEl={comparisonMenuAnchor}
							open={Boolean(comparisonMenuAnchor)}
							onClose={handleComparisonMenuClose}
							anchorOrigin={{
								vertical: "bottom",
								horizontal: "right",
							}}
							transformOrigin={{
								vertical: "top",
								horizontal: "right",
							}}>
							<MenuList dense>
								<ListSubheader>Analysis Tools</ListSubheader>
								<MenuItem
									onClick={() => handleNavigate("/party-comparison")}
									selected={location.pathname === "/party-comparison"}>
									Party Analysis
								</MenuItem>
								<MenuItem
									onClick={() =>
										handleNavigate("/early-voting-party-comparison")
									}
									selected={
										location.pathname === "/early-voting-party-comparison"
									}>
									Early Voting by Party
								</MenuItem>
								<Divider />
								<ListSubheader>Registration Systems</ListSubheader>
								<MenuItem
									onClick={() => handleNavigate("/opt-in-opt-out-comparison")}
									selected={location.pathname === "/opt-in-opt-out-comparison"}>
									Opt-In vs Opt-Out Systems
								</MenuItem>
								<MenuItem
									onClick={() =>
										handleNavigate("/republican-democratic-comparison")
									}
									selected={
										location.pathname === "/republican-democratic-comparison"
									}>
									Republican vs Democratic States
								</MenuItem>
								<MenuItem
									onClick={() =>
										handleNavigate("/same-day-registration-comparison")
									}
									selected={
										location.pathname === "/same-day-registration-comparison"
									}>
									Same-Day Registration Impact
								</MenuItem>
							</MenuList>
						</Menu>

						{/* Charts Menu */}
						<Menu
							anchorEl={chartsMenuAnchor}
							open={Boolean(chartsMenuAnchor)}
							onClose={handleChartsMenuClose}
							anchorOrigin={{
								vertical: "bottom",
								horizontal: "right",
							}}
							transformOrigin={{
								vertical: "top",
								horizontal: "right",
							}}>
							<MenuList dense>
								<ListSubheader>Visualization Tools</ListSubheader>
								<MenuItem
									onClick={() =>
										handleNavigate("/drop-box-voting-bubble-chart")
									}
									selected={
										location.pathname === "/drop-box-voting-bubble-chart"
									}>
									Drop Box Voting Bubble Chart
								</MenuItem>
								<MenuItem
									onClick={() =>
										handleNavigate("/bubble-chart-with-regression")
									}
									selected={
										location.pathname === "/bubble-chart-with-regression"
									}>
									Advanced Bubble Chart & Regression
								</MenuItem>
							</MenuList>
						</Menu>
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Navigation;
