import React from "react";
import { Route, Routes } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import StateDetailPage from "./pages/StateDetailPage";
import PartyComparisonPage from "./pages/PartyComparisonPage";
import RegistrationComparisonPage from "./pages/RegistrationComparisonPage";
import VotingEquipmentSummaryPage from "./pages/VotingEquipmentSummaryPage";
import VotingEquipmentRawPage from "./pages/VotingEquipmentRawPage";
import EveryStateEquipmentPage from "./pages/EveryStateEquipmentPage";
import VotingEquipmentHistoryPage from "./pages/VotingEquipmentHistoryPage";

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<SplashPage />} />
			<Route path="/state/:stateName" element={<StateDetailPage />} />
			<Route path="/party-comparison" element={<PartyComparisonPage />} />
			<Route path="/registration-comparison" element={<RegistrationComparisonPage />} />
			<Route
				path="/voting-equipment-summary"
				element={<VotingEquipmentSummaryPage />}
			/>
			<Route
				path="/voting-equipment-raw"
				element={<VotingEquipmentRawPage />}
			/>
			<Route
				path="/per-state-voting-equipment"
				element={<EveryStateEquipmentPage />}
			/>
			<Route
				path="/voting-equipment-history/:stateName"
				element={<VotingEquipmentHistoryPage />}
			/>
		</Routes>
	);
};

export default AppRoutes;
