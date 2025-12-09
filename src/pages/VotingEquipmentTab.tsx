import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchEquipmentTypes } from "../data/api";
import StateVotingEquipmentTable from "../tables/StateVotingEquipmentTable";
import VotingEquipmentTypeChoropleth from "../components/VotingEquipmentTypeChoropleth";
import EquipmentQualityVsRejectionsChart from "../charts/EquipmentQualityVsRejectionsChart";

interface VotingEquipmentTabProps {
    stateName: string;
}

const VotingEquipmentTab = ({ stateName }: VotingEquipmentTabProps) => {
    const [equipmentTypesData, setEquipmentTypesData] = useState<any[]>([]);
    const [equipmentQualityData, setEquipmentQualityData] = useState<any[]>([]);

    useEffect(() => {
        if (!stateName) return;

        setEquipmentTypesData([]);
        setEquipmentQualityData([]);

        let alive = true;
        (async () => {
            try {
                const equipmentTypes = await fetchEquipmentTypes(stateName);
                if (alive) setEquipmentTypesData(equipmentTypes);
            } catch (e: any) {
                if (alive) {
                    setEquipmentTypesData([]); // stop loading spinner
                }
            }

            try {
                const response = await fetch(
                    `http://localhost:8080/api/equipment/vs-rejected/${encodeURIComponent(stateName)}`
                );
                if (response.ok) {
                    const result = await response.json();
                    if (alive) setEquipmentQualityData(result);
                }
            } catch (e: any) {
                if (alive) {
                    setEquipmentQualityData([]); // stop loading spinner
                }
            }
        })();

        return () => {
            alive = false; // cleanup on unmount
        };
    }, [stateName]);

    return (
        <Box
            sx={{
                p: 0,
                height: "calc(100vh - 60px)",
                display: "grid",
                gridTemplateColumns: "50% 50%",
                gridTemplateRows: "70% 30%",
                gap: 0,
            }}
        >
            {/* Choropleth - Top Left */}
            <Box sx={{ gridColumn: "1", gridRow: "1", overflow: "hidden" }}>
                <VotingEquipmentTypeChoropleth
                    key={stateName}
                    stateName={stateName}
                    data={equipmentTypesData}
                />
            </Box>

            {/* Equipment Quality Chart - Top Right */}
            <Box sx={{ gridColumn: "2", gridRow: "1", overflow: "hidden" }}>
                <EquipmentQualityVsRejectionsChart 
                    stateName={stateName} 
                    data={equipmentQualityData.length > 0 ? equipmentQualityData.map((item: any) => ({
                        county: item.county,
                        equipmentQuality: item.equipmentQuality,
                        rejectionRate: item.rejectedPct > 1 ? item.rejectedPct : item.rejectedPct * 100,
                        party: item.party,
                    })) : undefined}
                />
            </Box>

            {/* Equipment Table - Bottom Spanning Both Columns */}
            <Box
                sx={{
                    gridColumn: "1 / 3",
                    gridRow: "2",
                    overflow: "hidden",
                    height: "100%",
                }}
            >
                <StateVotingEquipmentTable stateName={stateName} />
            </Box>
        </Box>
    );
};

export default VotingEquipmentTab;
