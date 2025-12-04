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

    // Fetch equipment types data when stateName changes
    useEffect(() => {
        if (!stateName) return;

        // Reset state when stateName changes
        setEquipmentTypesData([]);

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
                <EquipmentQualityVsRejectionsChart stateName={stateName} />
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
