export function normalizeCountyName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/['']/g, "")
        .replace(/\./g, "")
        .trim();
}

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

        lookup.set(full, value);
        lookup.set(withoutCounty, value);
        if (withCounty !== full && withCounty !== withoutCounty) {
            lookup.set(withCounty, value);
        }
    });

    return lookup;
}
