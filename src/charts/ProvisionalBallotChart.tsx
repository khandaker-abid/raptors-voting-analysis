import React from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
);

const ProvisionalBallotChart: React.FC = () => {
	const data = {
		labels: ["Category 1", "Category 2", "Category 3"],
		datasets: [
			{
				label: "Provisional Ballots",
				data: [12, 19, 3],
				backgroundColor: "rgba(75, 192, 192, 0.6)",
			},
		],
	};

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: "Provisional Ballot Categories",
			},
		},
	};

	return <Bar data={data} options={options} />;
};

export default ProvisionalBallotChart;
