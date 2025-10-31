// Centralized fetcc// Vite proxy should forward /api -> http://localhost:8080

// State name -> USPS abbreviation (used by URL fallbacks)= "/api";

// State name -> USPS abbreviation (used by URL fallbacks) for the Java backend (or local mocks).

import type {
    ActiveVotersRow,
    PollbookDeletionRow,
    MailRejectionRow,
    EquipmentHistorySeries,
    RegistrationTrendPayload,
    BlockBubblePayload,
} from "./types";

// -------------------------------------------------------------------
// Mock Data Toggle
// -------------------------------------------------------------------
// Set to true ONLY for frontend development without backend
// When false (default), API errors will be shown to user - NO FALLBACK
const USE_MOCKS = false;

// Vite proxy should forward /api -> http://localhost:8080
const base = "/api";
// Turn ON to always use mocks (frontend-only development).
// When true, if all real URL attempts fail (500/404/etc.), we’ll
// gracefully fall back to mock data so the UI keeps working.

// Vite proxy should forward /api -> http://localhost:8080

// State name -> USPS abbreviation (used by URL fallbacks)
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
 * If all fail and USE_MOCKS is false: throw error (NO FALLBACK)
 * If all fail and USE_MOCKS is true: return mock data for development
 */
async function tryUrls<T>(urls: string[], label: string, mockData?: T): Promise<T> {
    // If USE_MOCKS is enabled and mock data is provided, return it immediately
    if (USE_MOCKS && mockData !== undefined) {
        console.log(`[api] Using mock data for ${label}`);
        return mockData;
    }

    // Try real API endpoints
    let lastErr: unknown = null;
    for (const u of urls) {
        try {
            return await fetchJson<T>(u);
        } catch (err) {
            lastErr = err;
            console.warn(`[api] failed: ${u}`, err);
        }
    }

    // All APIs failed - throw error (no fallback to mock data)
    throw lastErr instanceof Error
        ? lastErr
        : new Error(`All API endpoints failed for ${label}. Backend may be offline.`);
}

// -------------------------------------------------------------------
// Endpoint wrappers
// -------------------------------------------------------------------

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
        `${base}/pollbook-deletions?state=${s}&year=2024`, // legacy/alt
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
        `${base}/mail-rejections?state=${s}&year=2024`, // legacy/alt
    ];

    return tryUrls(urls, `mail-rejections (${state})`);
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

/**
 * GUI-15 & GUI-22: Fetch party comparison data
 * Compares Republican vs Democratic vs Split states
 */
export async function fetchPartyComparison(): Promise<any> {
    const urls = [
        `${base}/comparison/party-states`,
    ];

    return tryUrls(urls, `party-comparison`);
}

/**
 * GUI-12: Fetch equipment data for all states (table view)
 */
export async function fetchEquipmentAllStates(): Promise<any[]> {
    const urls = [
        `${base}/equipment/all-states`,
    ];

    return tryUrls(urls, `equipment-all-states`);
}

/**
 * GUI-13: Fetch equipment summary by provider/model
 */
export async function fetchEquipmentSummary(): Promise<any[]> {
    const urls = [
        `${base}/equipment/summary`,
    ];


    return tryUrls(urls, `equipment-summary`);
}

/**
 * GUI-25: Fetch equipment quality vs rejected ballots
 */
export async function fetchEquipmentVsRejected(state: string): Promise<any[]> {
    const urls = [
        `${base}/equipment/vs-rejected/${state}`,
    ];


    return tryUrls(urls, `equipment-vs-rejected (${state})`);
}

/**
 * GUI-21: Fetch opt-in/opt-out registration comparison
 */
export async function fetchOptInOutComparison(): Promise<any[]> {
    const urls = [
        `${base}/registration/opt-in-out-comparison`,
    ];


    return tryUrls(urls, `opt-in-out-comparison`);
}

/**
 * GUI-23: Fetch early voting comparison
 */
export async function fetchEarlyVotingComparison(): Promise<any[]> {
    const urls = [
        `${base}/registration/early-voting/comparison`,
    ];


    return tryUrls(urls, `early-voting-comparison`);
}

/**
 * GUI-24: Fetch drop box voting bubble chart data
 * Shows relationship between drop box voting and Republican vote percentage
 * Arkansas has drop box data for 2020, Maryland for 2024
 */
export async function fetchDropboxBubbles(state: string, year?: number): Promise<any[]> {
    const s = encodeURIComponent(state);
    const abbr = STATE_TO_ABBR[state] || state.slice(0, 2).toUpperCase();

    // Use 2020 for Arkansas (has drop box data), 2024 for Maryland
    const defaultYear = state === "Arkansas" ? 2020 : 2024;
    const queryYear = year || defaultYear;

    const urls = [
        `${base}/eavs/dropbox-bubbles/${s}?year=${queryYear}`,
        `${base}/eavs/dropbox-bubbles/${abbr}?year=${queryYear}`,
    ];


    return tryUrls(urls, `dropbox-bubbles (${state})`);
}

/**
 * GUI-19: Fetch registered voters by county/region
 * Returns paginated list of voters with party affiliation
 */
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

export const API_URL = 'http://localhost:8080/api/data';