import React from "react";
import { Route, Routes } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import StateDetailPage from "./pages/StateDetailPage";
import PartyComparisonPage from "./pages/PartyComparisonPage";
import VotingEquipmentSummaryPage from "./pages/VotingEquipmentSummaryPage";
import EveryStateEquipmentPage from "./pages/EveryStateEquipmentPage";

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<SplashPage />} />
			<Route path="/state/:stateName" element={<StateDetailPage />} />
			<Route path="/party-comparison" element={<PartyComparisonPage />} />
			<Route path="/voting-equipment-summary" element={<VotingEquipmentSummaryPage />} />
			<Route path="/per-state-voting-equipment" element={<EveryStateEquipmentPage />} />
		</Routes>
	);
};

export default AppRoutes;
