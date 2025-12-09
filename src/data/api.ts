import type {
    ActiveVotersRow,
    PollbookDeletionRow,
    MailRejectionRow,
    EquipmentHistorySeries,
    RegistrationTrendPayload,
    BlockBubblePayload,
} from "./types";

const API_BASE = "/api";

/**
 * Generic fetch helper with proper error handling
 */
async function fetchApi<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}${text ? `\n${text}` : ""}`);
    }
    return res.json() as Promise<T>;
}

// ============================================================================
// EAVS Data Endpoints
// Backend: EAVSController - /api/eavs/{state}/...
// ============================================================================

export async function fetchActiveVoters(state: string): Promise<ActiveVotersRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    return fetchApi<ActiveVotersRow[]>(`${API_BASE}/eavs/${s}/active-voters?year=2024`);
}

export async function fetchProvisionalBallots(state: string): Promise<any[]> {
    const s = encodeURIComponent(state.toUpperCase());
    return fetchApi<any[]>(`${API_BASE}/eavs/${s}/provisional-ballots?year=2024`);
}

export async function fetchPollbookDeletions(state: string): Promise<PollbookDeletionRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    return fetchApi<PollbookDeletionRow[]>(`${API_BASE}/eavs/${s}/pollbook-deletions?year=2024`);
}

export async function fetchMailRejections(state: string): Promise<MailRejectionRow[]> {
    const s = encodeURIComponent(state.toUpperCase());
    return fetchApi<MailRejectionRow[]>(`${API_BASE}/eavs/${s}/mail-rejections?year=2024`);
}

export async function fetchDropboxBubbles(state: string, year?: number): Promise<any[]> {
    const s = encodeURIComponent(state);
    // Use 2020 for Arkansas (has drop box data), 2024 for Maryland and Rhode Island
    const queryYear = year || (state === "Arkansas" ? 2020 : 2024);
    return fetchApi<any[]>(`${API_BASE}/eavs/dropbox-bubbles/${s}?year=${queryYear}`);
}

// ============================================================================
// Equipment Endpoints
// Backend: EquipmentController - /api/equipment/...
// ============================================================================

export async function fetchEquipmentHistory(state: string): Promise<EquipmentHistorySeries[]> {
    const s = encodeURIComponent(state);
    return fetchApi<EquipmentHistorySeries[]>(`${API_BASE}/equipment/history/${s}`);
}

export async function fetchEquipmentAllStates(): Promise<any[]> {
    return fetchApi<any[]>(`${API_BASE}/equipment/all-states`);
}

export async function fetchEquipmentSummary(): Promise<any[]> {
    return fetchApi<any[]>(`${API_BASE}/equipment/summary`);
}

export async function fetchEquipmentVsRejected(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    return fetchApi<any[]>(`${API_BASE}/equipment/vs-rejected/${s}`);
}

export async function fetchStateEquipmentDetails(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    return fetchApi<any[]>(`${API_BASE}/equipment/state/${s}/details`);
}

export async function fetchEquipmentTypes(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    return fetchApi<any[]>(`${API_BASE}/equipment/${s}/types`);
}

export async function fetchEquipmentAgeAllStates(): Promise<any[]> {
    return fetchApi<any[]>(`${API_BASE}/equipment/age/all-states`);
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
    return fetchApi(`${API_BASE}/equipment/vs-rejected-with-regression/${s}`);
}

// ============================================================================
// Registration Endpoints
// Backend: RegistrationController - /api/registration/...
// ============================================================================

export async function fetchRegistrationTrends(state: string): Promise<RegistrationTrendPayload> {
    const s = encodeURIComponent(state);
    return fetchApi<RegistrationTrendPayload>(`${API_BASE}/registration/trends/${s}?years=2016,2020,2024`);
}

export async function fetchBlockBubbles(state: string): Promise<BlockBubblePayload> {
    const s = encodeURIComponent(state);
    return fetchApi<BlockBubblePayload>(`${API_BASE}/registration/blocks/${s}`);
}

export async function fetchStateRegisteredVoters(state: string): Promise<any[]> {
    const s = encodeURIComponent(state);
    return fetchApi<any[]>(`${API_BASE}/registration/state/${s}`);
}

export async function fetchOptInOutComparison(): Promise<any[]> {
    return fetchApi<any[]>(`${API_BASE}/registration/opt-in-out-comparison`);
}

export async function fetchEarlyVotingComparison(): Promise<any[]> {
    return fetchApi<any[]>(`${API_BASE}/registration/early-voting/comparison`);
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
    return fetchApi<any>(`${API_BASE}/registration/voters/${s}/${c}?page=${page}&size=${size}${partyParam}`);
}

// ============================================================================
// Comparison Endpoints
// Backend: ComparisonController - /api/comparison/...
// ============================================================================

export async function fetchPartyComparison(): Promise<any> {
    return fetchApi<any>(`${API_BASE}/comparison/party-states`);
}

// ============================================================================
// Preclearance / Analysis Endpoints
// Backend: PreclearanceController - /api/preclearance/...
// ============================================================================

export async function fetchGinglesData(state: string, demographic: string = "white"): Promise<any> {
    const s = encodeURIComponent(state);
    return fetchApi<any>(`${API_BASE}/preclearance/gingles/${s}?demographic=${demographic}`);
}

export async function fetchEIEquipmentData(state: string, demographic?: string): Promise<any> {
    const s = encodeURIComponent(state);
    const demoParam = demographic ? `?demographic=${encodeURIComponent(demographic)}` : "";
    return fetchApi<any>(`${API_BASE}/preclearance/ei-equipment/${s}${demoParam}`);
}

export async function fetchEIRejectedData(state: string, demographic?: string): Promise<any> {
    const s = encodeURIComponent(state);
    const demoParam = demographic ? `?demographic=${encodeURIComponent(demographic)}` : "";
    return fetchApi<any>(`${API_BASE}/preclearance/ei-rejected/${s}${demoParam}`);
}
