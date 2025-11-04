/**
 * Utility for normalizing county/town/jurisdiction names for consistent matching
 * across different data sources (GeoJSON, MongoDB, etc.)
 * 
 * This handles common inconsistencies:
 * - Case differences (PRINCE GEORGES vs Prince George's)
 * - Apostrophes (Prince George's vs Prince Georges)
 * - Periods (St. Mary's vs St Marys)
 * - Whitespace variations
 * - Optional "County" suffix
 */

/**
 * Normalize a geographic unit name for consistent matching.
 * 
 * Examples:
 * - "Prince George's County" -> "prince georges county"
 * - "ST. MARY'S COUNTY" -> "st marys county"
 * - "Queen Anne's County" -> "queen annes county"
 * - "St. Francis County" -> "st francis county"
 * 
 * @param name - The geographic unit name to normalize
 * @returns Normalized name
 */
export function normalizeCountyName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, " ") // Collapse multiple spaces to single space
        .replace(/['']/g, "") // Remove apostrophes (both straight ' and curly ')
        .replace(/\./g, "") // Remove periods
        .trim();
}

/**
 * Normalize a geographic unit name and also return a version without the "county" suffix.
 * 
 * @param name - The geographic unit name to normalize
 * @returns Object with full normalized name and version without "county"
 */
export function normalizeCountyNameWithVariants(name: string): {
    full: string;
    withoutCounty: string;
    withCounty: string;
} {
    const normalized = normalizeCountyName(name);
    const withoutCounty = normalized.replace(/\s+county$/, "").replace(/\s+town$/, "").trim();
    const withCounty = withoutCounty.includes("county") || withoutCounty.includes("town")
        ? withoutCounty
        : `${withoutCounty} county`;

    return {
        full: normalized,
        withoutCounty,
        withCounty,
    };
}

/**
 * Create a lookup map from an array of data with geographic units.
 * Automatically creates multiple keys for each entry to handle different naming conventions.
 * 
 * @param data - Array of data items with geographicUnit property
 * @param valueExtractor - Function to extract the value to store in the map
 * @returns Map with normalized county names as keys
 */
export function createCountyLookupMap<T, V>(
    data: T[],
    geographicUnitExtractor: (item: T) => string,
    valueExtractor: (item: T) => V
): Map<string, V> {
    const lookup = new Map<string, V>();

    data.forEach((item) => {
        const unitName = geographicUnitExtractor(item);
        const value = valueExtractor(item);
        const { full, withoutCounty, withCounty } = normalizeCountyNameWithVariants(unitName);

        // Store under multiple keys for maximum compatibility
        lookup.set(full, value);
        lookup.set(withoutCounty, value);
        if (withCounty !== full && withCounty !== withoutCounty) {
            lookup.set(withCounty, value);
        }
    });

    return lookup;
}
