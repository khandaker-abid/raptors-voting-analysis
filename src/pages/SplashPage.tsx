import React, { useEffect } from "react";
import USMap from "../components/USMap";
import QuickAccessWidget from "../components/QuickAccessWidget";
import { Box } from "@mui/material";

const SplashPage: React.FC = () => {
	// Removed equipment age feature - not part of core use cases
	// Just show the state map
	useEffect(() => {
		// No data loading needed for simple state map
	}, []);

	return (
		<Box
			sx={{
				height: "calc(100vh - 90px)",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				padding: 0,
				margin: 0,
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Just show the state map - full page like before */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<USMap />
			</Box>

			{/* Quick Access Widget - floating overlay on the right */}
			<QuickAccessWidget />
		</Box>
	);
};

export default SplashPage;
