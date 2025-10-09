// GUI - 14
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import type { EquipmentHistorySeries } from "../data/types";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


interface Props { data: EquipmentHistorySeries[]; }


const years = [2016, 2018, 2020, 2022, 2024] as const;


const VotingEquipmentHistoryCharts: React.FC<Props> = ({ data }) => {
    const charts = useMemo(() => data.map((series) => ({
        title: series.category,
        dataset: years.map(y => series.byYear[y] ?? 0)
    })), [data]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charts.map((c) => (
                <div key={c.title} className="rounded-2xl shadow p-4 bg-white">
                    <Bar
                        data={{ labels: years.map(String), datasets: [{ label: c.title, data: c.dataset, borderWidth: 1 }] }}
                        options={{
                            responsive: true,
                            plugins: { title: { display: true, text: `Devices by Year — ${c.title}` } },
                            scales: { y: { beginAtZero: true } },
                        }}
                    />
                </div>
            ))}
        </div>
    );
};


export default VotingEquipmentHistoryCharts;