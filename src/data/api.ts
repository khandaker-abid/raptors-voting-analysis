// Centralized, typed fetch helpers for the Java backend (or local mocks).

import type {
    ActiveVotersRow,
    PollbookDeletionRow,
    MailRejectionRow,
    EquipmentHistorySeries,
    RegistrationTrendPayload,
    BlockBubblePayload,
} from "./types";

// -------------------------------------------------------------------
// Dev toggles
// -------------------------------------------------------------------
// Turn ON to always use mocks (frontend-only development).
const USE_MOCKS = false;
// When true, if all real URL attempts fail (500/404/etc.), we’ll
// gracefully fall back to mock data so the UI keeps working.
const AUTO_FALLBACK_TO_MOCK_ON_ERROR = true;

// Vite proxy should forward /api -> http://localhost:8080
const base = "/api";

// -------------------------------------------------------------------
// State name -> USPS abbreviation (used by URL fallbacks)
// -------------------------------------------------------------------
const STATE_TO_ABBR: Record<string, string> = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    "District of Columbia": "DC",
};

// -------------------------------------------------------------------
// Small, realistic mock payloads
// -------------------------------------------------------------------
const M_ACTIVE: ActiveVotersRow[] = [
    {
        geographicUnit: "Sample County A",
        activeVoters: 70000,
        inactiveVoters: 12000,
        totalVoters: 82000,
        activePercentage: 85,
    },
    {
        geographicUnit: "Sample County B",
        activeVoters: 150000,
        inactiveVoters: 20000,
        totalVoters: 170000,
        activePercentage: 88,
    },
];

const M_POLL: PollbookDeletionRow[] = [
    {
        geographicUnit: "Sample County A",
        A12b_Death: 120,
        A12c_Moved: 900,
        A12d_Felon: 20,
        A12e_MentalIncap: 5,
        A12f_Requested: 60,
        A12g_FailedToVote: 300,
        A12h_Other: 40,
        total: 1445,
        deletionPercentage: 100 * (1445 / (1445 + 2000)),
    },
    {
        geographicUnit: "Sample County B",
        A12b_Death: 180,
        A12c_Moved: 1100,
        A12d_Felon: 25,
        A12e_MentalIncap: 7,
        A12f_Requested: 90,
        A12g_FailedToVote: 400,
        A12h_Other: 60,
        total: 1862,
        deletionPercentage: 100 * (1862 / (1862 + 2500)),
    },
];

const M_MAIL: MailRejectionRow[] = [
    {
        geographicUnit: "Sample County A",
        C9b_NoSignature: 40,
        C9c_SigMismatch: 25,
        C9d_ReceivedLate: 60,
        C9e_MissingInfo: 15,
        C9f_NotRegistered: 5,
        C9g_WrongEnvelope: 10,
        C9h_Other: 8,
        total: 163,
        rejectionPercentage: 100 * (163 / 2000),
    },
    {
        geographicUnit: "Sample County B",
        C9b_NoSignature: 55,
        C9c_SigMismatch: 40,
        C9d_ReceivedLate: 80,
        C9e_MissingInfo: 20,
        C9f_NotRegistered: 8,
        C9g_WrongEnvelope: 12,
        C9h_Other: 10,
        total: 225,
        rejectionPercentage: 100 * (225 / 2500),
    },
];

const M_EHIST: EquipmentHistorySeries[] = [
    { category: "DRE no VVPAT", byYear: { 2016: 500, 2018: 300, 2020: 100, 2022: 50, 2024: 10 } },
    { category: "DRE with VVPAT", byYear: { 2016: 200, 2018: 220, 2020: 240, 2022: 260, 2024: 280 } },
    { category: "Ballot Marking Device", byYear: { 2016: 150, 2018: 180, 2020: 220, 2022: 250, 2024: 290 } },
    { category: "Scanner", byYear: { 2016: 800, 2018: 820, 2020: 850, 2022: 880, 2024: 900 } },
];

const M_TRENDS: RegistrationTrendPayload = {
    state: "Mock",
    geographicUnitOrder2024: ["Sample County A", "Sample County B"],
    byYear: {
        2016: [60000, 120000],
        2020: [65000, 140000],
        2024: [82000, 170000],
    },
};

const M_BUBBLES: BlockBubblePayload = {
    state: "Mock",
    points: [
        { lat: 34.7465, lng: -92.2896, dominantParty: "D" },
        { lat: 36.1867, lng: -94.1288, dominantParty: "R" },
    ],
};

// -------------------------------------------------------------------
// Core helpers
// -------------------------------------------------------------------
async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}${text ? `\n${text}` : ""}`);
    }
    return res.json() as Promise<T>;
}

/**
 * Try a list of URL shapes. Return on first success.
 * If all fail and we're in dev (Vite) or AUTO_FALLBACK_TO_MOCK_ON_ERROR/USE_MOCKS is on,
 * return the provided mock instead of throwing — keeps the UI working.
 */
async function tryUrls<T>(urls: string[], mock: T, label: string): Promise<T> {
    if (USE_MOCKS) {
        console.info(`[api] Using mocks for ${label}`);
        return mock;
    }

    let lastErr: unknown = null;
    for (const u of urls) {
        try {
            return await fetchJson<T>(u);
        } catch (err) {
            lastErr = err;
            console.warn(`[api] failed: ${u}`, err);
        }
    }

    if (import.meta.env.DEV || AUTO_FALLBACK_TO_MOCK_ON_ERROR) {
        console.warn(`[api] All endpoints failed for ${label}; using mock data.`);
        return mock;
    }

    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// -------------------------------------------------------------------
// Endpoint wrappers
// -------------------------------------------------------------------

export async function fetchActiveVoters(state: string): Promise<ActiveVotersRow[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/active-voters?year=2024`,
        `${base}/eavs/${abbr}/active-voters?year=2024`,
        `${base}/eavs/active-voters?state=${s}&year=2024`,
    ];

    return tryUrls(urls, M_ACTIVE, `active-voters (${state})`);
}

export async function fetchPollbookDeletions(state: string): Promise<PollbookDeletionRow[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/pollbook-deletions?year=2024`,
        `${base}/eavs/${abbr}/pollbook-deletions?year=2024`,
        `${base}/eavs/pollbook-deletions?state=${s}&year=2024`,
        `${base}/pollbook-deletions?state=${s}&year=2024`, // legacy/alt
    ];

    return tryUrls(urls, M_POLL, `pollbook-deletions (${state})`);
}

export async function fetchMailRejections(state: string): Promise<MailRejectionRow[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/mail-rejections?year=2024`,
        `${base}/eavs/${abbr}/mail-rejections?year=2024`,
        `${base}/eavs/mail-rejections?state=${s}&year=2024`,
        `${base}/mail-rejections?state=${s}&year=2024`, // legacy/alt
    ];

    return tryUrls(urls, M_MAIL, `mail-rejections (${state})`);
}

export async function fetchEquipmentHistory(state: string): Promise<EquipmentHistorySeries[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/equipment/history/${s}`, // preferred
        `${base}/equipment/history/${abbr}`,
        `${base}/equipment/history?state=${s}`,
        `${base}/equipment/history?state=${abbr}`,
    ];

    return tryUrls(urls, M_EHIST, `equipment-history (${state})`);
}

export async function fetchRegistrationTrends(state: string): Promise<RegistrationTrendPayload> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/registration/trends/${s}?years=2016,2020,2024`,
        `${base}/registration/trends/${abbr}?years=2016,2020,2024`,
        `${base}/registration/trends?state=${s}&years=2016,2020,2024`,
    ];

    return tryUrls(urls, M_TRENDS, `registration-trends (${state})`);
}

export async function fetchBlockBubbles(state: string): Promise<BlockBubblePayload> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/registration/blocks/${s}`,
        `${base}/registration/blocks/${abbr}`,
        `${base}/registration/blocks?state=${s}`,
    ];

    return tryUrls(urls, M_BUBBLES, `registration-block-bubbles (${state})`);
}

export const API_URL = 'http://localhost:8080/api/data';