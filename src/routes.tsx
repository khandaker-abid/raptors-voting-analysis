import React from "react";
import { Route, Routes } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import StateDetailPage from "./pages/StateDetailPage";
import PartyComparisonPage from "./pages/PartyComparisonPage";
import VotingEquipmentSummaryPage from "./pages/VotingEquipmentSummaryPage";
import EveryStateEquipmentPage from "./pages/EveryStateEquipmentPage";
// [PATCH] Add VotingEquipmentHistoryPage for GUI-14 (per-state history view)
import VotingEquipmentHistoryPage from "./pages/VotingEquipmentHistoryPage";

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<SplashPage />} />
			<Route path="/state/:stateName" element={<StateDetailPage />} />
			<Route path="/party-comparison" element={<PartyComparisonPage />} />
			<Route
				path="/voting-equipment-summary"
				element={<VotingEquipmentSummaryPage />}
			/>
			<Route
				path="/per-state-voting-equipment"
				element={<EveryStateEquipmentPage />}
			/>
			{/* [PATCH] New route: direct link target from EveryStateEquipmentTable state link */}
			<Route
				path="/voting-equipment-history/:stateName"
				element={<VotingEquipmentHistoryPage />}
			/>
		</Routes>
	);
};

export default AppRoutes;
