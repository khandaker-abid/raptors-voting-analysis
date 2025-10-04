// 2024 EAVS Active Voters data structure
export interface ActiveVotersData {
	county: string;
	totalVoters: number;
	activeVoters: number;
	inactiveVoters: number;
	activePercentage: number;
	inactivePercentage: number;
}

// Mock data generation based on realistic voter registration patterns
const generateActiveVotersData = (
	counties: string[],
	stateName: string,
): ActiveVotersData[] => {
	const stateMultipliers: Record<string, number> = {
		"Rhode Island": 1.2, // Higher registration rate
		"Maryland": 1.1, // High registration rate
		"Arkansas": 0.9, // Average registration rate
	};

	const baseMultiplier = stateMultipliers[stateName] || 1.0;

	return counties.map((county) => {
		// Base voter population varies by county
		const baseVoters = Math.floor(
			(1000 + Math.random() * 15000) * baseMultiplier,
		);

		// Active voter percentage typically ranges from 75-95%
		const activePercentage = 75 + Math.random() * 20;
		const activeVoters = Math.floor(baseVoters * (activePercentage / 100));
		const inactiveVoters = baseVoters - activeVoters;
		const inactivePercentage = 100 - activePercentage;

		return {
			county,
			totalVoters: baseVoters,
			activeVoters,
			inactiveVoters,
			activePercentage: Math.round(activePercentage * 10) / 10,
			inactivePercentage: Math.round(inactivePercentage * 10) / 10,
		};
	});
};

// County lists for each state
const rhodeIslandCounties = [
	"Bristol County",
	"Kent County",
	"Newport County",
	"Providence County",
	"Washington County",
];

const marylandCounties = [
	"Allegany County",
	"Anne Arundel County",
	"Baltimore County",
	"Calvert County",
	"Caroline County",
	"Carroll County",
	"Cecil County",
	"Charles County",
	"Dorchester County",
	"Frederick County",
	"Garrett County",
	"Harford County",
	"Howard County",
	"Kent County",
	"Montgomery County",
	"Prince George's County",
	"Queen Anne's County",
	"Somerset County",
	"St. Mary's County",
	"Talbot County",
	"Washington County",
	"Wicomico County",
	"Worcester County",
	"Baltimore City",
];

const arkansasCounties = [
	"Arkansas County",
	"Ashley County",
	"Baxter County",
	"Benton County",
	"Boone County",
	"Bradley County",
	"Calhoun County",
	"Carroll County",
	"Chicot County",
	"Clark County",
	"Clay County",
	"Cleburne County",
	"Cleveland County",
	"Columbia County",
	"Conway County",
	"Craighead County",
	"Crawford County",
	"Crittenden County",
	"Cross County",
	"Dallas County",
	"Desha County",
	"Drew County",
	"Faulkner County",
	"Franklin County",
	"Fulton County",
	"Garland County",
	"Grant County",
	"Greene County",
	"Hempstead County",
	"Hot Spring County",
	"Howard County",
	"Independence County",
	"Izard County",
	"Jackson County",
	"Jefferson County",
	"Johnson County",
	"Lafayette County",
	"Lawrence County",
	"Lee County",
	"Lincoln County",
	"Little River County",
	"Logan County",
	"Lonoke County",
	"Madison County",
	"Marion County",
	"Miller County",
	"Mississippi County",
	"Monroe County",
	"Montgomery County",
	"Nevada County",
	"Newton County",
	"Ouachita County",
	"Perry County",
	"Phillips County",
	"Pike County",
	"Poinsett County",
	"Polk County",
	"Pope County",
	"Prairie County",
	"Pulaski County",
	"Randolph County",
	"Saline County",
	"Scott County",
	"Searcy County",
	"Sebastian County",
	"Sevier County",
	"Sharp County",
	"St. Francis County",
	"Stone County",
	"Union County",
	"Van Buren County",
	"Washington County",
	"White County",
	"Woodruff County",
	"Yell County",
];

export const getActiveVotersData = (
	stateName: string,
): ActiveVotersData[] | null => {
	const detailStates = ["Rhode Island", "Maryland", "Arkansas"];

	if (!detailStates.includes(stateName)) {
		return null;
	}

	let counties: string[];
	switch (stateName) {
		case "Rhode Island":
			counties = rhodeIslandCounties;
			break;
		case "Maryland":
			counties = marylandCounties;
			break;
		case "Arkansas":
			counties = arkansasCounties;
			break;
		default:
			return null;
	}

	return generateActiveVotersData(counties, stateName);
};

// Helper functions
export const getTotalActiveVoters = (data: ActiveVotersData[]): number => {
	return data.reduce((total, county) => total + county.activeVoters, 0);
};

export const getTotalInactiveVoters = (data: ActiveVotersData[]): number => {
	return data.reduce((total, county) => total + county.inactiveVoters, 0);
};

export const getTotalVoters = (data: ActiveVotersData[]): number => {
	return data.reduce((total, county) => total + county.totalVoters, 0);
};

export const getStateActivePercentage = (data: ActiveVotersData[]): number => {
	const totalActive = getTotalActiveVoters(data);
	const totalVoters = getTotalVoters(data);
	return Math.round((totalActive / totalVoters) * 1000) / 10;
};

export const getActiveVotersChartData = (data: ActiveVotersData[]) => {
	const totalActive = getTotalActiveVoters(data);
	const totalInactive = getTotalInactiveVoters(data);

	return [
		{
			category: "Active Voters",
			count: totalActive,
			percentage:
				Math.round((totalActive / (totalActive + totalInactive)) * 1000) / 10,
			color: "#4caf50",
		},
		{
			category: "Inactive Voters",
			count: totalInactive,
			percentage:
				Math.round((totalInactive / (totalActive + totalInactive)) * 1000) / 10,
			color: "#ff9800",
		},
	];
};
