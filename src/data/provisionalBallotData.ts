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

export const getProvisionalBallotCategories = (): ProvisionalBallotCategory[] => [
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
): ProvisionalBallotData => {
	const base = Math.floor(Math.random() * 100 * baseMultiplier) + 50;
	return {
		county: countyName,
		E1a: base * 10, // Total is sum of all categories
		E2a: Math.floor(base * 2.5),
		E2b: Math.floor(base * 1.8),
		E2c: Math.floor(base * 1.5),
		E2d: Math.floor(base * 0.8),
		E2e: Math.floor(base * 0.6),
		E2f: Math.floor(base * 0.4),
		E2g: Math.floor(base * 0.3),
		E2h: Math.floor(base * 0.2),
		E2i: Math.floor(base * 0.9),
	};
};

// State-specific data
const rhodeIslandCounties = [
	"Bristol",
	"Kent",
	"Newport",
	"Providence",
	"Washington",
];

const westVirginiaCounties = [
	"Barbour",
	"Berkeley",
	"Boone",
	"Braxton",
	"Brooke",
	"Cabell",
	"Calhoun",
	"Clay",
	"Doddridge",
	"Fayette",
	"Gilmer",
	"Grant",
	"Greenbrier",
	"Hampshire",
	"Hancock",
	"Hardy",
	"Harrison",
	"Jackson",
	"Jefferson",
	"Kanawha",
	"Lewis",
	"Lincoln",
	"Logan",
	"Marion",
	"Marshall",
	"Mason",
	"McDowell",
	"Mercer",
];

const arkansasCounties = [
	"Arkansas",
	"Ashley",
	"Baxter",
	"Benton",
	"Boone",
	"Bradley",
	"Calhoun",
	"Carroll",
	"Chicot",
	"Clark",
	"Clay",
	"Cleburne",
	"Cleveland",
	"Columbia",
	"Conway",
	"Craighead",
	"Crawford",
	"Crittenden",
	"Cross",
	"Dallas",
	"Desha",
	"Drew",
	"Faulkner",
	"Franklin",
	"Fulton",
	"Garland",
	"Grant",
	"Greene",
];

export const getProvisionalBallotData = (
	stateName: string,
): ProvisionalBallotData[] | null => {
	switch (stateName) {
		case "Rhode Island":
			return rhodeIslandCounties.map((county) =>
				generateCountyData(county, 1.5),
			);
		case "West Virginia":
			return westVirginiaCounties.map((county) =>
				generateCountyData(county, 1),
			);
		case "Arkansas":
			return arkansasCounties.map((county) => generateCountyData(county, 1.2));
		default:
			return null;
	}
};

export const getChoroplethData = (
	stateName: string,
): ChoroplethData[] | null => {
	const ballotData = getProvisionalBallotData(stateName);
	if (!ballotData) return null;

	return ballotData.map((data, index) => ({
		county: data.county,
		E1a: data.E1a,
		lat: 40 + index * 0.5, // Mock coordinates
		lng: -75 + index * 0.5, // Mock coordinates
	}));
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
