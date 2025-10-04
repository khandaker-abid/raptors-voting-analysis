import React from "react";
import { Route, Routes } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import StateDetailPage from "./pages/StateDetailPage";
import PartyComparisonPage from "./pages/PartyComparisonPage";
import OptInOptOutComparison from "./components/OptInOptOutComparison";
import RepublicanDemocraticComparison from "./components/RepublicanDemocraticComparison";
import SameDayRegistrationComparison from "./components/SameDayRegistrationComparison";
import EarlyVotingPartyComparison from "./components/EarlyVotingPartyComparison";
import DropBoxVotingBubbleChart from "./components/DropBoxVotingBubbleChart";
import BubbleChartWithRegression from "./components/BubbleChartWithRegression";

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<SplashPage />} />
			<Route path="/state/:stateName" element={<StateDetailPage />} />
			<Route path="/party-comparison" element={<PartyComparisonPage />} />
			<Route
				path="/opt-in-opt-out-comparison"
				element={<OptInOptOutComparison />}
			/>
			<Route
				path="/republican-democratic-comparison"
				element={<RepublicanDemocraticComparison />}
			/>
			<Route
				path="/same-day-registration-comparison"
				element={<SameDayRegistrationComparison />}
			/>
			<Route
				path="/early-voting-party-comparison"
				element={<EarlyVotingPartyComparison />}
			/>
			<Route
				path="/drop-box-voting-bubble-chart"
				element={<DropBoxVotingBubbleChart />}
			/>
			<Route
				path="/bubble-chart-with-regression"
				element={<BubbleChartWithRegression />}
			/>
		</Routes>
	);
};

export default AppRoutes;
