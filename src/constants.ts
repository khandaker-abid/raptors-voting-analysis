/**
 * Application-wide constants for the voting analysis frontend.
 * Centralizes configuration values to avoid magic numbers and ensure consistency.
 */

/** Standard chart heights for different visualization contexts */
export const CHART_HEIGHTS = {
    SMALL: 300,
    MEDIUM: 400,
    STANDARD: 500,
    LARGE: 600,
} as const;

/** Z-index layering for UI components */
export const Z_INDEX = {
    DROPDOWN: 100,
    MODAL_BACKDROP: 900,
    MODAL: 1000,
    TOOLTIP: 1100,
    OVERLAY: 1200,
    NOTIFICATION: 1300,
} as const;

export const DEFAULT_ROWS_PER_PAGE = 5;
export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;

export const API_BASE_PATH = "/api";
export const DEFAULT_EAVS_YEAR = 2024;
export const EAVS_YEARS = [2016, 2020, 2024] as const;

export const DETAIL_STATES = ["Arkansas", "Maryland", "Rhode Island"] as const;

export const MAP_ZOOM = {
    US_OVERVIEW: 4,
    STATE_VIEW: 7,
    COUNTY_VIEW: 9,
} as const;

export const MAP_BOUNDS_PADDING = 0.1;

export const CHART_COLORS = {
    PRIMARY: "#1976d2",
    SECONDARY: "#dc004e",
    DEMOCRATIC: "#2196F3",
    REPUBLICAN: "#F44336",
    NEUTRAL: "#9E9E9E",
    SUCCESS: "#4CAF50",
    WARNING: "#FF9800",
    ERROR: "#f44336",
} as const;

export const TABLE_HEADER_BG = "#616161";

export const EQUIPMENT_COLORS: Record<string, string> = {
    "DRE no VVPAT": "#E53935",
    "DRE with VVPAT": "#FB8C00",
    "Ballot Marking Device": "#43A047",
    "Scanner": "#1E88E5",
    "MIXED": "#9E9E9E",
} as const;

export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    CHART_ENTRY: 800,
} as const;

export const PERCENTAGE_BOUNDS = {
    MIN: 0,
    MAX: 100,
} as const;

export const MIN_SEARCH_LENGTH = 0;

export const NUMBER_FORMAT = {
    PERCENTAGE_DECIMALS: 1,
    LOCALE: "en-US",
} as const;
