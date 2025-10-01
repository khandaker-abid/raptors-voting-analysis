import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Box } from "@mui/material";
import Navigation from "./components/Navigation";
import AppRoutes from "./routes";
import Footer from "./components/Footer";

const App: React.FC = () => {
	return (
		<Router>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					minHeight: "100vh",
					backgroundColor: "background.default",
				}}>
				<Navigation />
				<Box component="main" sx={{ flexGrow: 1 }}>
					<AppRoutes />
				</Box>
				<Footer />
			</Box>
		</Router>
	);
};

export default App;
