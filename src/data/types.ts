export type Year = 2016 | 2020 | 2024;
export type PartyCode = "R" | "D" | "U";

export interface ChoroplethDatum {
    geographicUnit: string;
    value: number;
    percentOfTotal?: number;
}

export interface ActiveVotersRow {
    geographicUnit: string;
    activeVoters: number;
    totalVoters: number;
    inactiveVoters: number;
    activePercentage: number;
}

export interface PollbookDeletionRow {
    geographicUnit: string;
    dataYear?: number;
    A12b_Death: number;
    A12c_Moved: number;
    A12d_Felon: number;
    A12e_MentalIncap: number;
    A12f_Requested: number;
    A12g_FailedToVote: number;
    A12h_Other: number;
    total: number;
    deletionPercentage: number;
}

export interface MailRejectionRow {
    geographicUnit: string;
    dataYear?: number;
    C9b_NoSignature: number;
    C9c_SigMismatch: number;
    C9d_ReceivedLate: number;
    C9e_MissingInfo: number;
    C9f_NotRegistered: number;
    C9g_WrongEnvelope: number;
    C9h_Other: number;
    total: number;
    rejectionPercentage: number;
}

export type EquipmentCategory =
    | "DRE no VVPAT"
    | "DRE with VVPAT"
    | "Ballot Marking Device"
    | "Scanner";

export interface EquipmentHistorySeries {
    category: EquipmentCategory;
    byYear: { [Y in 2016 | 2018 | 2020 | 2022 | 2024]?: number };
}

export interface RegistrationTrendPayload {
    state: string;
    geographicUnitOrder2024: string[];
    byYear: {
        2016: number[];
        2020: number[];
        2024: number[];
    };
}

export interface BlockBubblePoint {
    lat: number;
    lng: number;
    dominantParty: PartyCode;
}

export interface BlockBubblePayload {
    state: string;
    points: BlockBubblePoint[];
}

export interface GinglesDataPoint {
    precinct: string;
    democraticPct: number;
    republicanPct: number;
    whitePct: number;
    hispanicPct: number;
    africanAmericanPct: number;
}

export interface RegressionCoefficients {
    a: number;
    b: number;
}

export interface EquipmentQualityBubble {
    county: string;
    equipmentQuality: number;
    rejectionRate: number;
    party: PartyCode;
}

export interface EIProbabilityPoint {
    x: number;
    probability: number;
}

export interface EIDemographicCurve {
    demographic: string;
    data: EIProbabilityPoint[];
    mean?: number;
    stdDev?: number;
}

export interface DropboxBubbleDatum {
    county: string;
    republicanPct: number;
    dropBoxPct: number;
    party: PartyCode;
    totalBallots?: number;
    dataYear?: number;
}