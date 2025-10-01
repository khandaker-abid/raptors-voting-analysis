import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const VotingEquipmentChart: React.FC = () => {
	const data = {
		labels: ["Vendor A", "Vendor B", "Vendor C"],
		datasets: [
			{
				label: "Voting Equipment",
				data: [300, 50, 100],
				backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
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
				text: "Voting Equipment by Vendor",
			},
		},
	};

	return <Pie data={data} options={options} />;
};

export default VotingEquipmentChart;
