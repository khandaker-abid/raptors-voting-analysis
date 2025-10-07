// Enhanced provisional ballot data with more realistic values

export interface ProvisionalBallotCategory {
	key: string;
	label: string;
	description: string;
}

export interface ProvisionalBallotData {
	county: string;
	E1a: number; // Total provisional ballots
	E2a: number;
	E2b: number;
	E2c: number;
	E2d: number;
	E2e: number;
	E2f: number;
	E2g: number;
	E2h: number;
	E2i: number;
}

export interface ChoroplethData {
	county: string;
	E1a: number;
	lat?: number;
	lng?: number;
}

export const getProvisionalBallotCategories =
	(): ProvisionalBallotCategory[] => [
		{
			key: "E2a",
			label: "No ID",
			description: "Voter did not provide required identification",
		},
		{
			key: "E2b",
			label: "Not Registered",
			description: "Voter name not found in registration database",
		},
		{
			key: "E2c",
			label: "Wrong Precinct",
			description: "Voter attempted to vote in wrong precinct",
		},
		{
			key: "E2d",
			label: "Wrong Jurisdiction",
			description: "Voter attempted to vote in wrong jurisdiction",
		},
		{
			key: "E2e",
			label: "Incomplete Registration",
			description: "Voter registration application incomplete",
		},
		{
			key: "E2f",
			label: "Ballot Challenged",
			description: "Voter's eligibility challenged by poll watcher",
		},
		{
			key: "E2g",
			label: "Already Voted",
			description: "Records indicate voter already cast a ballot",
		},
		{
			key: "E2h",
			label: "Court Order",
			description: "Court order extended polling hours",
		},
		{
			key: "E2i",
			label: "Other",
			description: "Other reasons for provisional ballot",
		},
	];

// Mock data generation with more realistic distribution
const generateCountyData = (
	countyName: string,
	baseMultiplier: number = 1,
	countyIndex: number = 0,
): ProvisionalBallotData => {
	// Use county name and index for consistent but varied data
	const seed = countyName.length + countyIndex;
	const random = (offset: number) =>
		(((seed + offset) * 9301 + 49297) % 233280) / 233280;

	// Base number of provisional ballots varies by county size
	const base = Math.floor(random(0) * 150 * baseMultiplier) + 25;

	// Different categories have different typical distributions
	const e2a = Math.floor(base * (0.25 + random(1) * 0.15)); // No ID: 25-40%
	const e2b = Math.floor(base * (0.2 + random(2) * 0.1)); // Not Registered: 20-30%
	const e2c = Math.floor(base * (0.15 + random(3) * 0.1)); // Wrong Precinct: 15-25%
	const e2d = Math.floor(base * (0.05 + random(4) * 0.05)); // Wrong Jurisdiction: 5-10%
	const e2e = Math.floor(base * (0.03 + random(5) * 0.05)); // Incomplete Registration: 3-8%
	const e2f = Math.floor(base * (0.02 + random(6) * 0.03)); // Ballot Challenged: 2-5%
	const e2g = Math.floor(base * (0.01 + random(7) * 0.02)); // Already Voted: 1-3%
	const e2h = Math.floor(base * (0.01 + random(8) * 0.02)); // Court Order: 1-3%
	const e2i = Math.floor(base * (0.05 + random(9) * 0.08)); // Other: 5-13%

	const total = e2a + e2b + e2c + e2d + e2e + e2f + e2g + e2h + e2i;

	return {
		county: countyName,
		E1a: total, // Total provisional ballots
		E2a: e2a,
		E2b: e2b,
		E2c: e2c,
		E2d: e2d,
		E2e: e2e,
		E2f: e2f,
		E2g: e2g,
		E2h: e2h,
		E2i: e2i,
	};
};

// State-specific data
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

export const getProvisionalBallotData = (
	stateName: string,
): ProvisionalBallotData[] | null => {
	switch (stateName) {
		case "Rhode Island":
			return rhodeIslandCounties.map((county, index) =>
				generateCountyData(county, 1.5, index),
			);
		case "Maryland":
			return marylandCounties.map((county, index) =>
				generateCountyData(county, 1.2, index),
			);
		case "Arkansas":
			return arkansasCounties.map((county, index) =>
				generateCountyData(county, 1.0, index),
			);
		default:
			return null;
	}
};

export const getChoroplethData = (
	stateName: string,
): ChoroplethData[] | null => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return null;

	// State-specific coordinate ranges for more realistic positioning
	let baseLatitude: number,
		baseLongitude: number,
		latRange: number,
		lngRange: number;

	switch (stateName) {
		case "Rhode Island":
			baseLatitude = 41.5;
			baseLongitude = -71.5;
			latRange = 0.8;
			lngRange = 0.8;
			break;
		case "Maryland":
			baseLatitude = 39.0;
			baseLongitude = -76.5;
			latRange = 2.5;
			lngRange = 3.0;
			break;
		case "Arkansas":
			baseLatitude = 34.8;
			baseLongitude = -92.2;
			latRange = 3.5;
			lngRange = 4.0;
			break;
		default:
			baseLatitude = 40.0;
			baseLongitude = -75.0;
			latRange = 2.0;
			lngRange = 2.0;
	}

	return ballotData.map((data, index) => {
		// Generate pseudo-random but consistent coordinates based on county name
		const seed = data.county.length + index;
		const latOffset = (((seed * 17) % 100) / 100) * latRange;
		const lngOffset = (((seed * 23) % 100) / 100) * lngRange;

		return {
			county: data.county,
			E1a: data.E1a,
			lat: baseLatitude + latOffset,
			lng: baseLongitude + lngOffset,
		};
	});
};

// Helper function to get state totals for each category
export const getStateCategoryTotals = (
	stateName: string,
): Record<string, number> => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return {};

	const categories = [
		"E2a",
		"E2b",
		"E2c",
		"E2d",
		"E2e",
		"E2f",
		"E2g",
		"E2h",
		"E2i",
	];
	const totals: Record<string, number> = {};

	categories.forEach((category) => {
		totals[category] = ballotData.reduce((sum, county) => {
			return (
				sum + ((county[category as keyof ProvisionalBallotData] as number) || 0)
			);
		}, 0);
	});

	return totals;
};

// Helper function to get total provisional ballots for a state
export const getStateProvisionalTotal = (stateName: string): number => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return 0;

	return ballotData.reduce((total, county) => total + county.E1a, 0);
};

// Helper function to get county-level provisional ballot percentages
export const getCountyProvisionalPercentages = (
	stateName: string,
): Array<{ county: string; percentage: number }> => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return [];

	const stateTotal = getStateProvisionalTotal(stateName);

	return ballotData.map((county) => ({
		county: county.county,
		percentage: stateTotal > 0 ? (county.E1a / stateTotal) * 100 : 0,
	}));
};

// Helper function to get top counties by provisional ballot count
export const getTopCountiesByProvisionalBallots = (
	stateName: string,
	limit: number = 5,
): ProvisionalBallotData[] => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return [];

	return ballotData.sort((a, b) => b.E1a - a.E1a).slice(0, limit);
};

// Helper function to get state summary statistics
export const getStateProvisionalSummary = (stateName: string) => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return null;

	const totals = ballotData.reduce(
		(acc, county) => ({
			total: acc.total + county.E1a,
			counties: acc.counties + 1,
			min: Math.min(acc.min, county.E1a),
			max: Math.max(acc.max, county.E1a),
		}),
		{ total: 0, counties: 0, min: Infinity, max: 0 },
	);

	const average = totals.total / totals.counties;

	return {
		totalProvisionalBallots: totals.total,
		totalCounties: totals.counties,
		averagePerCounty: Math.round(average),
		minCountyBallots: totals.min,
		maxCountyBallots: totals.max,
	};
};
