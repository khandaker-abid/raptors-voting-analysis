import { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import ProvisionalBallotChoroplethMap from "../components/ProvisionalBallotChoroplethMap";
import { fetchProvisionalBallots } from "../data/api";

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
    const [data, setData] = useState<any[] | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    // Fetch provisional ballot data when stateName changes
    useEffect(() => {
        if (!stateName) return;

        // Reset state when stateName changes
        setData(undefined);
        setError(null);

        let alive = true;
        (async () => {
            try {
                const rows = await fetchProvisionalBallots(stateName);
                if (alive) setData(rows);
            } catch (e: any) {
                if (alive) {
                    setError(e?.message || "Failed to fetch data");
                    setData([]); // stop loading spinner
                }
            }
        })();

        return () => {
            alive = false; // cleanup on unmount
        };
    }, [stateName]);
    console.log("Provisional Ballot Data:", data);

    // Get provisional ballot data
    const provisionalData = useMemo(() => {
        return getProvisionalBallotData(stateName);
    }, [stateName]);
    
    // Get choropleth data (shared with Registration tab)
    const choroplethData = useMemo(() => {
        return getChoroplethData(stateName);
    }, [stateName]);
    //console.log("Choropleth Data:", choroplethData);

	return (
		<Box sx={{ 
			p: 0, 
			height: "calc(100vh - 60px)", 
			display: "grid",
			gridTemplateColumns: "40% 60%",
			gridTemplateRows: "1fr 1fr",
			gap: 0
		}}>
			<Box sx={{ gridColumn: "1", gridRow: "1 / 3", overflow: "hidden" }}>
				<ProvisionalBallotChoroplethMap
					stateName={stateName}
					data={choroplethData || []}
				/>
			</Box>
            
			<Box sx={{ 
				gridColumn: "2", 
				gridRow: "1",
				overflow: "hidden"
			}}>
				<ProvisionalBallotBarChart 
					data={provisionalData || []} 
					categories={getProvisionalBallotCategories()}
				/>
			</Box>
			
			<Box sx={{ 
				gridColumn: "2", 
				gridRow: "2",
				overflow: "hidden",
				height: "100%"
			}}>
				<ProvisionalBallotTable
					data={provisionalData || []}
				/>
			</Box>
		</Box>
	);
};

export default ProvisionalBallotTab;
