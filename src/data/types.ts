// Centralized shared types used by multiple components
export type Year = 2016 | 2020 | 2024;


export interface ChoroplethDatum {
    geographicUnit: string; // county/town/etc. display name
    value: number; // count
    percentOfTotal?: number; // 0..100 (for choropleths by %)
}


export interface ActiveVotersRow {
    geographicUnit: string; // EAVS unit name
    activeVoters: number;
    totalVoters: number;
    inactiveVoters: number;
    activePercentage: number; // 0..100
}


export interface PollbookDeletionRow {
    geographicUnit: string;
    // A12b–A12h; keys map to server fields exactly
    A12b_Death: number;
    A12c_Moved: number;
    A12d_Felon: number;
    A12e_MentalIncap: number;
    A12f_Requested: number;
    A12g_FailedToVote: number;
    A12h_Other: number;
    total: number;
    deletionPercentage: number; // 0..100 of total deletions
}


export interface MailRejectionRow {
    geographicUnit: string;
    // C9b–C9q (subset shown; server sends full set)
    C9b_NoSignature: number;
    C9c_SigMismatch: number;
    C9d_ReceivedLate: number;
    C9e_MissingInfo: number;
    C9f_NotRegistered: number;
    C9g_WrongEnvelope: number;
    C9h_Other: number; // add all through C9q on the backend as applicable
    total: number;
    rejectionPercentage: number; // 0..100 of total rejected
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
    geographicUnitOrder2024: string[]; // ascending by 2024 registered count
    byYear: {
        2016: number[]; // aligned to geographicUnitOrder2024
        2020: number[];
        2024: number[];
    };
}


export interface BlockBubblePoint {
    lat: number;
    lng: number;
    dominantParty: "R" | "D";
}

export interface BlockBubblePayload {
    state: string;
    points: BlockBubblePoint[];
}