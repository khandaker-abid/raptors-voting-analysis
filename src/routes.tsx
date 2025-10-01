import React from "react";
import { Route, Routes } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import StateDetailPage from "./pages/StateDetailPage";
import PartyComparisonPage from "./pages/PartyComparisonPage";

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<SplashPage />} />
			<Route path="/state/:stateName" element={<StateDetailPage />} />
			<Route path="/party-comparison" element={<PartyComparisonPage />} />
		</Routes>
	);
};

export default AppRoutes;
