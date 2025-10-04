import React from "react";
import USMap from "../components/USMap";
import { Container, Box } from "@mui/material";

const SplashPage: React.FC = () => {
	return (
		<Container
			maxWidth="lg"
			sx={{ height: "100%", display: "flex", alignItems: "center" }}>
			<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
				<USMap />
			</Box>
		</Container>
	);
};

export default SplashPage;
