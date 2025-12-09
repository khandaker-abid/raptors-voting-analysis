/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for maintainability
 */

// =============================================================================
// UI Layout Constants
// =============================================================================

/** Standard chart container heights (in pixels) */
export const CHART_HEIGHTS = {
    SMALL: 300,
    MEDIUM: 400,
    STANDARD: 500,
    LARGE: 600,
} as const;

/** Z-index layering system */
export const Z_INDEX = {
    DROPDOWN: 100,
    MODAL_BACKDROP: 900,
    MODAL: 1000,
    TOOLTIP: 1100,
    OVERLAY: 1200,
    NOTIFICATION: 1300,
} as const;

// =============================================================================
// Table/Pagination Constants
// =============================================================================

/** Default rows per page for paginated tables */
export const DEFAULT_ROWS_PER_PAGE = 5;

/** Available rows per page options */
export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;

// =============================================================================
// API Constants
// =============================================================================

/** Base API path (proxied by Vite in development) */
export const API_BASE_PATH = "/api";

/** Default data year for EAVS queries */
export const DEFAULT_EAVS_YEAR = 2024;

/** Available EAVS data years */
export const EAVS_YEARS = [2016, 2020, 2024] as const;

// =============================================================================
// Map/Geographic Constants
// =============================================================================

/** Detailed states with county-level data */
export const DETAIL_STATES = ["Arkansas", "Maryland", "Rhode Island"] as const;

/** Map zoom levels */
export const MAP_ZOOM = {
    US_OVERVIEW: 4,
    STATE_VIEW: 7,
    COUNTY_VIEW: 9,
} as const;

/** Map bounds padding factor */
export const MAP_BOUNDS_PADDING = 0.1;

// =============================================================================
// Color Constants
// =============================================================================

/** Standard color palette for charts */
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

/** Table header background color */
export const TABLE_HEADER_BG = "#616161";

/** Equipment type color mapping */
export const EQUIPMENT_COLORS: Record<string, string> = {
    "DRE no VVPAT": "#E53935",
    "DRE with VVPAT": "#FB8C00",
    "Ballot Marking Device": "#43A047",
    "Scanner": "#1E88E5",
    "MIXED": "#9E9E9E",
} as const;

// =============================================================================
// Animation Constants
// =============================================================================

/** Standard animation durations (in milliseconds) */
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    CHART_ENTRY: 800,
} as const;

// =============================================================================
// Validation Constants
// =============================================================================

/** Percentage bounds (0-100) */
export const PERCENTAGE_BOUNDS = {
    MIN: 0,
    MAX: 100,
} as const;

/** Minimum search term length for filtering */
export const MIN_SEARCH_LENGTH = 0;

// =============================================================================
// Display Format Constants
// =============================================================================

/** Number formatting options */
export const NUMBER_FORMAT = {
    /** Decimal places for percentages */
    PERCENTAGE_DECIMALS: 1,
    /** Locale for number formatting */
    LOCALE: "en-US",
} as const;
