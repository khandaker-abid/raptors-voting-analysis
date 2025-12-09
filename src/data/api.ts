/**
 * Centralized API fetch functions for the voting analysis frontend.
 * Vite proxy forwards /api -> http://localhost:8080
 */

import type {
    ActiveVotersRow,
    PollbookDeletionRow,
    MailRejectionRow,
    EquipmentHistorySeries,
    RegistrationTrendPayload,
    BlockBubblePayload,
} from "./types";

// Set to true ONLY for frontend development without backend
const USE_MOCKS = false;

const base = "/api";

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

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}${text ? `\n${text}` : ""}`);
    }
    return res.json() as Promise<T>;
}

async function tryUrls<T>(urls: string[], label: string, mockData?: T): Promise<T> {
    if (USE_MOCKS && mockData !== undefined) {
        return mockData;
    }

    let lastErr: unknown = null;
    for (const u of urls) {
        try {
            return await fetchJson<T>(u);
        } catch (err) {
            lastErr = err;
        }
    }

    throw lastErr instanceof Error
        ? lastErr
        : new Error(`All API endpoints failed for ${label}. Backend may be offline.`);
}

export async function fetchActiveVoters(state: string): Promise<ActiveVotersRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/active-voters?year=2024`,
        `${base}/eavs/${abbr}/active-voters?year=2024`,
        `${base}/eavs/active-voters?state=${s}&year=2024`,
    ];

    return tryUrls(urls, `active-voters (${state})`);
}

export async function fetchProvisionalBallots(state: string): Promise<any[]> {
    const s = encodeURIComponent(state.toUpperCase());
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/provisional-ballots?year=2024`,
        `${base}/eavs/${abbr}/provisional-ballots?year=2024`,
        `${base}/eavs/provisional-ballots?state=${s}&year=2024`,
    ];

    return tryUrls(urls, `provisional-ballots (${state})`);
}

export async function fetchPollbookDeletions(state: string): Promise<PollbookDeletionRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/pollbook-deletions?year=2024`,
        `${base}/eavs/${abbr}/pollbook-deletions?year=2024`,
        `${base}/eavs/pollbook-deletions?state=${s}&year=2024`,
        `${base}/pollbook-deletions?state=${s}&year=2024`,
    ];

    return tryUrls(urls, `pollbook-deletions (${state})`);
}

export async function fetchMailRejections(state: string): Promise<MailRejectionRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/eavs/${s}/mail-rejections?year=2024`,
        `${base}/eavs/${abbr}/mail-rejections?year=2024`,
        `${base}/eavs/mail-rejections?state=${s}&year=2024`,
        `${base}/mail-rejections?state=${s}&year=2024`,
    ];

    return tryUrls(urls, `mail-rejections (${state})`);
}

export async function fetchEquipmentHistory(state: string): Promise<EquipmentHistorySeries[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/equipment/history/${s}`,
        `${base}/equipment/history/${abbr}`,
        `${base}/equipment/history?state=${s}`,
        `${base}/equipment/history?state=${abbr}`,
    ];

    return tryUrls(urls, `equipment-history (${state})`);
}

export async function fetchRegistrationTrends(state: string): Promise<RegistrationTrendPayload> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/registration/trends/${s}?years=2016,2020,2024`,
        `${base}/registration/trends/${abbr}?years=2016,2020,2024`,
        `${base}/registration/trends?state=${s}&years=2016,2020,2024`,
    ];

    return tryUrls(urls, `registration-trends (${state})`);
}

export async function fetchBlockBubbles(state: string): Promise<BlockBubblePayload> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/registration/blocks/${s}`,
        `${base}/registration/blocks/${abbr}`,
        `${base}/registration/blocks?state=${s}`,
    ];

    return tryUrls(urls, `registration-block-bubbles (${state})`);
}

export async function fetchPartyComparison(): Promise<any> {
    const urls = [
        `${base}/comparison/party-states`,
    ];

    return tryUrls(urls, `party-comparison`);
}

export async function fetchEquipmentAllStates(): Promise<any[]> {
    const urls = [
        `${base}/equipment/all-states`,
    ];

    return tryUrls(urls, `equipment-all-states`);
}

export async function fetchEquipmentSummary(): Promise<any[]> {
    const urls = [
        `${base}/equipment/summary`,
    ];

    return tryUrls(urls, `equipment-summary`);
}

export async function fetchEquipmentVsRejected(state: string): Promise<any[]> {
    const urls = [
        `${base}/equipment/vs-rejected/${state}`,
    ];

    return tryUrls(urls, `equipment-vs-rejected (${state})`);
}

export async function fetchStateEquipmentDetails(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    const url = `${base}/equipment/state/${s}/details`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch equipment details for ${state}:`, error);
        return [];
    }
}

export async function fetchStateRegisteredVoters(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/registration/state/${s}`,
        `${base}/registration/state/${abbr}`,
        `${base}/data/state-registered-voters/${s}`,
        `${base}/data/state-registered-voters/${abbr}`,
    ];

    return tryUrls(urls, `state-registered-voters (${state})`);
}

export async function fetchOptInOutComparison(): Promise<any[]> {
    const urls = [
        `${base}/registration/opt-in-out-comparison`,
    ];

    return tryUrls(urls, `opt-in-out-comparison`);
}

export async function fetchEarlyVotingComparison(): Promise<any[]> {
    const urls = [
        `${base}/registration/early-voting/comparison`,
    ];

    return tryUrls(urls, `early-voting-comparison`);
}

export async function fetchDropboxBubbles(state: string, year?: number): Promise<any[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    // Use 2020 for Arkansas (has drop box data), 2024 for Maryland and Rhode Island
    const defaultYear = state === "Arkansas" ? 2020 : 2024;
    const queryYear = year || defaultYear;

    const urls = [
        `${base}/eavs/dropbox-bubbles/${s}?year=${queryYear}`,
        `${base}/eavs/dropbox-bubbles/${abbr}?year=${queryYear}`,
    ];

    return tryUrls(urls, `dropbox-bubbles (${state})`);
}

export async function fetchRegisteredVoters(
    state: string,
    county: string,
    party?: string,
    page: number = 0,
    size: number = 1000
): Promise<any> {
    const s = encodeURIComponent(state);
    const c = encodeURIComponent(county);
    const partyParam = party && party !== "all" ? `&party=${encodeURIComponent(party)}` : "";

    const urls = [
        `${base}/registration/voters/${s}/${c}?page=${page}&size=${size}${partyParam}`,
    ];

    return tryUrls(urls, `registered-voters (${state}, ${county})`);
}

export async function fetchEquipmentTypes(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    const urls = [
        `${base}/equipment/${s}/types`,
        `${base}/equipment/${abbr}/types`,
    ];

    return tryUrls(urls, `equipment-types (${state})`);
}

export async function fetchGinglesData(state: string, demographic: string = "white"): Promise<any> {
    const s = encodeURIComponent(state);

    const urls = [
        `${base}/preclearance/gingles/${s}?demographic=${demographic}`,
    ];

    return tryUrls(urls, `gingles-analysis (${state}, ${demographic})`);
}

export async function fetchEIEquipmentData(state: string, demographic?: string): Promise<any> {
    const s = encodeURIComponent(state);
    const demoParam = demographic ? `?demographic=${encodeURIComponent(demographic)}` : "";

    const urls = [
        `${base}/preclearance/ei-equipment/${s}${demoParam}`,
    ];

    return tryUrls(urls, `ei-equipment (${state})`);
}

export async function fetchEIRejectedData(state: string, demographic?: string): Promise<any> {
    const s = encodeURIComponent(state);
    const demoParam = demographic ? `?demographic=${encodeURIComponent(demographic)}` : "";

    const urls = [
        `${base}/preclearance/ei-rejected/${s}${demoParam}`,
    ];

    return tryUrls(urls, `ei-rejected (${state})`);
}

export async function fetchEquipmentAgeAllStates(): Promise<any[]> {
    const urls = [
        `${base}/equipment/age/all-states`,
    ];

    return tryUrls(urls, `equipment-age-all-states`);
}

export async function fetchEquipmentVsRejectedWithRegression(state: string): Promise<{
    dataPoints: any[];
    regressionLines: Array<{
        party: "R" | "D";
        coefficients: { a: number; b: number };
        r2: number;
        type: "power" | "linear";
    }>;
}> {
    const s = encodeURIComponent(state);
    const urls = [
        `${base}/equipment/vs-rejected-with-regression/${s}`,
    ];

    return tryUrls(urls, `equipment-vs-rejected-regression (${state})`);
}
