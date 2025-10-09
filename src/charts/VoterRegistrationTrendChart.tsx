// GUI - 16
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import type { RegistrationTrendPayload } from "../data/types";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


interface Props { trends: RegistrationTrendPayload; }


const VoterRegistrationTrendChart: React.FC<Props> = ({ trends }) => {
    // X axis is the order of EAVS units sorted by 2024 ascending
    const labels = useMemo(() => trends.geographicUnitOrder2024.map((_, i) => `${i + 1}`), [trends]);


    const data = {
        labels,
        datasets: [
            { label: "2016", data: trends.byYear[2016], borderWidth: 2, fill: false },
            { label: "2020", data: trends.byYear[2020], borderWidth: 2, fill: false },
            { label: "2024", data: trends.byYear[2024], borderWidth: 2, fill: false },
        ],
    };
    const options = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: { display: true, text: "Registered Voters by EAVS Unit (ordered by 2024)" },
            tooltip: {
                callbacks: {
                    title: (items: any[]) => {
                        const idx = items?.[0]?.dataIndex ?? 0; return trends.geographicUnitOrder2024[idx];
                    }
                }
            },
        },
        scales: { y: { beginAtZero: true }, x: { title: { display: true, text: "EAVS Units (ascending by 2024)" } } },
    } as const;


    return <Line data={data} options={options} />;
};


export default VoterRegistrationTrendChart;