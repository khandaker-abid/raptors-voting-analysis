import React from "react";
import EveryStateEquipmentTable from "../components/EveryStateEquipmentTable";
import { Box } from "@mui/material";

const EveryStateEquipmentPage: React.FC = () => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-start',
				minHeight: '100vh',
				bgcolor: '#f5f5f5',
				p: 3, 
				overflow: 'hidden',
			}}>
			<EveryStateEquipmentTable />
		</Box>
	);
};

export default EveryStateEquipmentPage;
