import React from "react";
import { useMemo } from "react";
import { Box } from "@mui/material";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";

import {
    getProvisionalBallotData,
    getProvisionalBallotCategories,
    getChoroplethData,
} from "../data/provisionalBallotData";
import ProvisionalBallotBarChart from "../charts/ProvisionalBallotBarChart";
import ProvisionalBallotTable from "../tables/ProvisionalBallotTable";

interface ProvisionalBallotTabProps {
	stateName: string;
}

const ProvisionalBallotTab = ({ stateName }: ProvisionalBallotTabProps) => {
    // Get provisional ballot data
    const provisionalData = useMemo(() => {
        return getProvisionalBallotData(stateName);
    }, [stateName]);
    
    // Get choropleth data (shared with Registration tab)
    const choroplethData = useMemo(() => {
        return getChoroplethData(stateName);
    }, [stateName]);
    console.log("Choropleth Data:", choroplethData);

	return (
		<Box sx={{ 
			p: 0, 
			height: "calc(100vh - 180px)", 
			display: "flex", 
			flexDirection: "column" 
		}}>
			<ProvisionalBallotChoroplethMap
				stateName={stateName}
				data={choroplethData || []}
			/>
            <ProvisionalBallotBarChart 
                data={provisionalData || []} 
                categories={getProvisionalBallotCategories()}
            />
            <ProvisionalBallotTable
                data={provisionalData || []}
            />
		</Box>
	);
};

export default ProvisionalBallotTab;
