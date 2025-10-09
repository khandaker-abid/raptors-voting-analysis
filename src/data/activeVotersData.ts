// 2024 EAVS Active Voters mock generator + helpers used by charts/maps/tables.

export interface ActiveVotersData {
	county: string;
	totalVoters: number;
	activeVoters: number;
	inactiveVoters: number;
	activePercentage: number;
	inactivePercentage: number;
}

const generateActiveVotersData = (
	counties: string[],
	stateName: string
): ActiveVotersData[] => {
	const stateMultipliers: Record<string, number> = {
		"Rhode Island": 1.2, // higher registration density
		"Maryland": 1.1,
		"Arkansas": 0.9,
	};

	const baseMultiplier = stateMultipliers[stateName] || 1.0;

	return counties.map((county) => {
		// Base voter population varies by county
		const baseVoters = Math.floor(
			(1000 + Math.random() * 15000) * baseMultiplier
		);

		// Active voter percentage typically ranges from 75–95%
		const activePct = 75 + Math.random() * 20;
		const activeVoters = Math.floor(baseVoters * (activePct / 100));
		const inactiveVoters = baseVoters - activeVoters;
		const inactivePct = 100 - activePct;

		return {
			county,
			totalVoters: baseVoters,
			activeVoters,
			inactiveVoters,
			activePercentage: Math.round(activePct * 10) / 10,
			inactivePercentage: Math.round(inactivePct * 10) / 10,
		};
	});
};

// -----------------------------
// County lists
// -----------------------------
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

// -----------------------------
// Public API
// -----------------------------
export const getActiveVotersData = (
	stateName: string
): ActiveVotersData[] | null => {
	const detailStates = ["Rhode Island", "Maryland", "Arkansas"];
	if (!detailStates.includes(stateName)) return null;

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

export const getTotalActiveVoters = (data: ActiveVotersData[]): number =>
	data.reduce((total, c) => total + (c.activeVoters || 0), 0);

export const getTotalInactiveVoters = (data: ActiveVotersData[]): number =>
	data.reduce((total, c) => total + (c.inactiveVoters || 0), 0);

export const getTotalVoters = (data: ActiveVotersData[]): number =>
	data.reduce((total, c) => total + (c.totalVoters || 0), 0);

export const getStateActivePercentage = (data: ActiveVotersData[]): number => {
	const totalActive = getTotalActiveVoters(data);
	const total = getTotalVoters(data);
	return total ? Math.round((totalActive / total) * 1000) / 10 : 0;
};

// -----------------------------
// Chart adapter used by <ActiveVotersBarChart />
// NOTE: We return three categories — "Active", "Inactive", and "Total" —
// so the component can extract the chip value from the "Total" bar.
// -----------------------------
export const getActiveVotersChartData = (data: ActiveVotersData[]) => {
	const totalActive = getTotalActiveVoters(data);
	const totalInactive = getTotalInactiveVoters(data);
	const total = totalActive + totalInactive || getTotalVoters(data);

	const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

	return [
		{
			category: "Active",
			count: totalActive,
			percentage: pct(totalActive, total),
		},
		{
			category: "Inactive",
			count: totalInactive,
			percentage: pct(totalInactive, total),
		},
		{
			category: "Total",
			count: total,
			percentage: 100,
		},
	];
};
