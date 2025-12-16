import React from "react";
import { Box } from "@mui/material";
import VotingEquipmentRawTable from "../tables/VotingEquipmentRawTable";

const VotingEquipmentRawPage: React.FC = () => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                bgcolor: "#f5f5f5",
                p: 2,
                height: "calc(100vh - 90px)",
                overflow: "auto",
            }}
        >
            <VotingEquipmentRawTable />
        </Box>
    );
};

export default VotingEquipmentRawPage;
