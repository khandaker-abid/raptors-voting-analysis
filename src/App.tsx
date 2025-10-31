import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Box } from "@mui/material";
import Navigation from "./components/Navigation";
import AppRoutes from "./routes";

const App: React.FC = () => {
	return (
		<Router>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					minHeight: "100vh",
					height: "100vh",
					backgroundColor: "background.default",
					width: "100%",
					overflow: "hidden",
				}}>
				<Navigation />
				<Box component="main" sx={{ flexGrow: 1, flex: 1, width: "100%", mt: "90px", minHeight: 0, display: "flex", flexDirection: "column" }}>
					<AppRoutes />
				</Box>
			</Box>
		</Router>
	);
};

export default App;
