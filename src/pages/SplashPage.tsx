import React from "react";
import USMap from "../components/USMap";
import { Box } from "@mui/material";

const SplashPage: React.FC = () => {
	return (
		<Box
			sx={{
				height: "calc(100vh - 90px)", // Full viewport height minus nav bar (90px)
				width: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 0,
				margin: 0,
				overflow: "hidden",
			}}>
			<USMap />
		</Box>
	);
};

export default SplashPage;
