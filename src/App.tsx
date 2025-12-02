import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Navigation from "./components/Navigation";
import AppRoutes from "./routes";

const AppContent: React.FC = () => {
	const location = useLocation();
	const isStateDetailPage = location.pathname.startsWith("/state/");

	return (
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
			{!isStateDetailPage && <Navigation />}
			<Box 
				component="main" 
				sx={{ 
					flexGrow: 1, 
					flex: 1, 
					width: "100%", 
					mt: isStateDetailPage ? 0 : "90px", 
					minHeight: 0, 
					display: "flex", 
					flexDirection: "column" 
				}}
			>
				<AppRoutes />
			</Box>
		</Box>
	);
};

const App: React.FC = () => {
	return (
		<Router>
			<AppContent />
		</Router>
	);
};

export default App;
