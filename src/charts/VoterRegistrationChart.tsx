import React from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
);

const VoterRegistrationChart: React.FC = () => {
	const data = {
		labels: ["January", "February", "March", "April", "May", "June", "July"],
		datasets: [
			{
				label: "Voter Registrations",
				data: [65, 59, 80, 81, 56, 55, 40],
				fill: false,
				borderColor: "rgba(75,192,192,1)",
				tension: 0.1,
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
				text: "Voter Registration Trends",
			},
		},
	};

	return <Line data={data} options={options} />;
};

export default VoterRegistrationChart;
