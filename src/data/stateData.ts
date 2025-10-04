// State center points and geographical data
export interface StateInfo {
	name: string;
	abbreviation: string;
	cvapPercentage?: number;
	party?: "Republican" | "Democratic";
	detailStateType?: {
		registrationType: "opt-in" | "opt-out";
		electionDayRegistration: boolean;
		specialAnalysisType?: string;
	};
}

export const stateData: StateInfo[] = [
	// Detail states with CVAP data
	{
		name: "Rhode Island",
		abbreviation: "RI",
		cvapPercentage: 78.2,
		party: "Democratic",
		detailStateType: {
			registrationType: "opt-out",
			electionDayRegistration: false,
		},
	},
	{
		name: "Maryland",
		abbreviation: "MD",
		cvapPercentage: 81.3,
		party: "Democratic",
		detailStateType: {
			registrationType: "opt-out",
			electionDayRegistration: true,
		},
	},
	{
		name: "Arkansas",
		abbreviation: "AR",
		cvapPercentage: 76.8,
		party: "Republican",
		detailStateType: {
			registrationType: "opt-in",
			electionDayRegistration: false,
			specialAnalysisType: "detailed voter registration",
		},
	},

	// Other states
	{ name: "Alabama", abbreviation: "AL", party: "Republican" },
	{ name: "Arizona", abbreviation: "AZ" },
	{ name: "California", abbreviation: "CA", party: "Democratic" },
	{ name: "Colorado", abbreviation: "CO", party: "Democratic" },
	{ name: "Connecticut", abbreviation: "CT", party: "Democratic" },
	{ name: "Delaware", abbreviation: "DE", party: "Democratic" },
	{ name: "Florida", abbreviation: "FL", party: "Republican" },
	{ name: "Georgia", abbreviation: "GA" },
	{ name: "Idaho", abbreviation: "ID", party: "Republican" },
	{ name: "Illinois", abbreviation: "IL", party: "Democratic" },
	{ name: "Indiana", abbreviation: "IN", party: "Republican" },
	{ name: "Iowa", abbreviation: "IA", party: "Republican" },
	{ name: "Kansas", abbreviation: "KS", party: "Republican" },
	{ name: "Kentucky", abbreviation: "KY", party: "Republican" },
	{ name: "Louisiana", abbreviation: "LA", party: "Republican" },
	{ name: "Maine", abbreviation: "ME", party: "Democratic" },
	{ name: "Massachusetts", abbreviation: "MA", party: "Democratic" },
	{ name: "Michigan", abbreviation: "MI" },
	{ name: "Minnesota", abbreviation: "MN", party: "Democratic" },
	{ name: "Mississippi", abbreviation: "MS", party: "Republican" },
	{ name: "Missouri", abbreviation: "MO", party: "Republican" },
	{ name: "Montana", abbreviation: "MT", party: "Republican" },
	{ name: "Nebraska", abbreviation: "NE", party: "Republican" },
	{ name: "Nevada", abbreviation: "NV" },
	{ name: "New Hampshire", abbreviation: "NH" },
	{ name: "New Jersey", abbreviation: "NJ", party: "Democratic" },
	{ name: "New Mexico", abbreviation: "NM", party: "Democratic" },
	{ name: "New York", abbreviation: "NY", party: "Democratic" },
	{ name: "North Carolina", abbreviation: "NC" },
	{ name: "North Dakota", abbreviation: "ND", party: "Republican" },
	{ name: "Ohio", abbreviation: "OH", party: "Republican" },
	{ name: "Oklahoma", abbreviation: "OK", party: "Republican" },
	{ name: "Oregon", abbreviation: "OR", party: "Democratic" },
	{ name: "Pennsylvania", abbreviation: "PA" },
	{ name: "South Carolina", abbreviation: "SC", party: "Republican" },
	{ name: "South Dakota", abbreviation: "SD", party: "Republican" },
	{ name: "Tennessee", abbreviation: "TN", party: "Republican" },
	{ name: "Texas", abbreviation: "TX", party: "Republican" },
	{ name: "Utah", abbreviation: "UT", party: "Republican" },
	{ name: "Vermont", abbreviation: "VT", party: "Democratic" },
	{ name: "Virginia", abbreviation: "VA", party: "Democratic" },
	{ name: "Washington", abbreviation: "WA", party: "Democratic" },
	{ name: "West Virginia", abbreviation: "WV", party: "Republican" },
	{ name: "Wisconsin", abbreviation: "WI" },
	{ name: "Wyoming", abbreviation: "WY", party: "Republican" },
];

// State center coordinates for map centering
export const stateCenters: Record<string, [number, number]> = {
	"Rhode Island": [-71.5118, 41.6809],
	"West Virginia": [-80.4549, 38.5976],
	"Arkansas": [-91.9623, 34.7465],
	"Alabama": [-86.7911, 32.8067],
	"Arizona": [-111.0937, 34.0489],
	"California": [-119.4179, 36.7783],
	"Colorado": [-105.7821, 39.5501],
	"Connecticut": [-73.0877, 41.6032],
	"Delaware": [-75.5071, 38.9108],
	"Florida": [-81.5158, 27.6648],
	"Georgia": [-82.9071, 32.1656],
	"Idaho": [-114.742, 44.0682],
	"Illinois": [-89.3985, 40.6331],
	"Indiana": [-86.1349, 40.2672],
	"Iowa": [-93.0977, 41.878],
	"Kansas": [-96.7265, 39.0119],
	"Kentucky": [-84.27, 37.8393],
	"Louisiana": [-91.9623, 30.9843],
	"Maine": [-69.4455, 45.2538],
	"Maryland": [-76.6413, 39.0458],
	"Massachusetts": [-71.3824, 42.4072],
	"Michigan": [-85.6024, 44.3148],
	"Minnesota": [-94.6859, 46.7296],
	"Mississippi": [-89.3985, 32.3547],
	"Missouri": [-91.8318, 37.9643],
	"Montana": [-110.3626, 46.8797],
	"Nebraska": [-99.9018, 41.4925],
	"Nevada": [-116.4194, 38.8026],
	"New Hampshire": [-71.5724, 43.1939],
	"New Jersey": [-74.4057, 40.0583],
	"New Mexico": [-105.8701, 34.5199],
	"New York": [-75.4999, 42.6526],
	"North Carolina": [-79.0193, 35.7596],
	"North Dakota": [-101.002, 47.5515],
	"Ohio": [-82.9071, 40.4173],
	"Oklahoma": [-97.0929, 35.0078],
	"Oregon": [-120.5542, 43.8041],
	"Pennsylvania": [-77.1945, 41.2033],
	"South Carolina": [-81.1637, 33.8361],
	"South Dakota": [-99.9018, 43.9695],
	"Tennessee": [-86.5804, 35.5175],
	"Texas": [-99.9018, 31.9686],
	"Utah": [-111.891, 39.321],
	"Vermont": [-72.5778, 44.5588],
	"Virginia": [-78.6569, 37.4316],
	"Washington": [-120.7401, 47.7511],
	"Wisconsin": [-88.7879, 43.7844],
	"Wyoming": [-107.2903, 43.076],
};

// Detail states (with comprehensive data)
export const detailStates = ["Rhode Island", "Maryland", "Arkansas"];

export const getStateCenter = (stateName: string): [number, number] => {
	return stateCenters[stateName] || [-98.5795, 39.8283]; // Default to US center
};

export const isDetailState = (stateName: string): boolean => {
	return detailStates.includes(stateName);
};

export const getDetailStateDescription = (stateName: string): string => {
	const state = stateData.find(s => s.name === stateName);
	if (!state?.detailStateType) return "";

	const { registrationType, electionDayRegistration, specialAnalysisType } = state.detailStateType;
	const partyDominated = state.party ? `${state.party.toLowerCase()}-dominated` : "";

	let description = `Voter registration ${registrationType} state`;

	if (electionDayRegistration) {
		description += " with election day registration";
	} else {
		description += " without election day registration";
	}

	if (partyDominated) {
		description += `, ${partyDominated}`;
	}

	if (specialAnalysisType) {
		description += `, ${specialAnalysisType} state`;
	}

	return description;
};
