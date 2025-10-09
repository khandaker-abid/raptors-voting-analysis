import React from "react";
import VotingEquipmentSummaryTable from "../tables/VotingEquipmentSummaryTable";
import { Box} from "@mui/material";


const VotingEquipmentSummaryPage: React.FC = () => {
	return ( 
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-start',
				bgcolor: '#f5f5f5',
				p: 3, 
				overflow: 'hidden',
			}}>
			<VotingEquipmentSummaryTable />
		</Box>
	);
};

export default VotingEquipmentSummaryPage;
