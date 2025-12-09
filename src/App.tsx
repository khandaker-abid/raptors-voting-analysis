import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Box, Alert, Typography, Paper } from "@mui/material";
import Navigation from "./components/Navigation";
import AppRoutes from "./routes";

// Error Boundary to catch render errors
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught error:", error, errorInfo);
		this.setState({ errorInfo });
	}

	render() {
		if (this.state.hasError) {
			return (
				<Box sx={{ p: 4, backgroundColor: "#fff3e0", minHeight: "100vh" }}>
					<Paper sx={{ p: 3, backgroundColor: "#fff" }}>
						<Alert severity="error" sx={{ mb: 2 }}>
							<Typography variant="h6">Something went wrong</Typography>
						</Alert>
						<Typography variant="body1" sx={{ mb: 2 }}>
							<strong>Error:</strong> {this.state.error?.message}
						</Typography>
						<Typography variant="body2" component="pre" sx={{
							whiteSpace: "pre-wrap",
							fontSize: "0.8rem",
							backgroundColor: "#f5f5f5",
							p: 2,
							borderRadius: 1,
							overflow: "auto",
							maxHeight: 400
						}}>
							{this.state.error?.stack}
						</Typography>
					</Paper>
				</Box>
			);
		}
		return this.props.children;
	}
}

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
		<ErrorBoundary>
			<Router>
				<AppContent />
			</Router>
		</ErrorBoundary>
	);
};

export default App;
