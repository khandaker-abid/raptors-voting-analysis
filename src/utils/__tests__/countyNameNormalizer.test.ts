/**
 * Test suite for county name normalization utilities
 * Ensures consistent matching across Maryland, Arkansas, and Rhode Island
 */

import { describe, it, expect } from 'vitest';
import { normalizeCountyName, normalizeCountyNameWithVariants, createCountyLookupMap } from '../countyNameNormalizer';

describe('normalizeCountyName', () => {
    // Maryland test cases - apostrophes
    it('should normalize Maryland county names with apostrophes', () => {
        expect(normalizeCountyName("Prince George's County")).toBe("prince georges county");
        expect(normalizeCountyName("PRINCE GEORGES COUNTY")).toBe("prince georges county");
        expect(normalizeCountyName("Prince Georges County")).toBe("prince georges county");

        expect(normalizeCountyName("St. Mary's County")).toBe("st marys county");
        expect(normalizeCountyName("ST. MARYS COUNTY")).toBe("st marys county");
        expect(normalizeCountyName("St Marys County")).toBe("st marys county");

        expect(normalizeCountyName("Queen Anne's County")).toBe("queen annes county");
        expect(normalizeCountyName("QUEEN ANNES COUNTY")).toBe("queen annes county");
    });

    // Arkansas test cases - periods
    it('should normalize Arkansas county names with periods', () => {
        expect(normalizeCountyName("St. Francis County")).toBe("st francis county");
        expect(normalizeCountyName("ST. FRANCIS COUNTY")).toBe("st francis county");
        expect(normalizeCountyName("St Francis County")).toBe("st francis county");
    });

    // Rhode Island test cases - towns
    it('should normalize Rhode Island town names', () => {
        expect(normalizeCountyName("BARRINGTON TOWN")).toBe("barrington town");
        expect(normalizeCountyName("Barrington Town")).toBe("barrington town");
        expect(normalizeCountyName("CENTRAL FALLS CITY")).toBe("central falls city");
    });

    // Edge cases
    it('should handle multiple spaces', () => {
        expect(normalizeCountyName("Prince  George's   County")).toBe("prince georges county");
    });

    it('should handle curly apostrophes', () => {
        expect(normalizeCountyName("Prince George's County")).toBe("prince georges county");
    });

    it('should handle mixed case', () => {
        expect(normalizeCountyName("pRiNcE gEoRgE's cOuNtY")).toBe("prince georges county");
    });
});

describe('normalizeCountyNameWithVariants', () => {
    it('should provide multiple variants for matching', () => {
        const result = normalizeCountyNameWithVariants("Prince George's County");
        expect(result.full).toBe("prince georges county");
        expect(result.withoutCounty).toBe("prince georges");
        expect(result.withCounty).toBe("prince georges county");
    });

    it('should handle towns', () => {
        const result = normalizeCountyNameWithVariants("BARRINGTON TOWN");
        expect(result.full).toBe("barrington town");
        expect(result.withoutCounty).toBe("barrington");
        expect(result.withCounty).toBe("barrington county");
    });
});

describe('createCountyLookupMap', () => {
    interface TestData {
        name: string;
        value: number;
    }

    it('should create lookup with multiple keys per entry', () => {
        const data: TestData[] = [
            { name: "Prince George's County", value: 100 },
            { name: "St. Mary's County", value: 200 },
        ];

        const lookup = createCountyLookupMap(
            data,
            (item) => item.name,
            (item) => item.value
        );

        // Should find with original name (normalized)
        expect(lookup.get("prince georges county")).toBe(100);
        // Should find without apostrophe
        expect(lookup.get("prince georges county")).toBe(100);
        // Should find without "county"
        expect(lookup.get("prince georges")).toBe(100);

        // St. Mary's tests
        expect(lookup.get("st marys county")).toBe(200);
        expect(lookup.get("st marys")).toBe(200);
    });

    it('should handle database names (no apostrophes) matching GeoJSON names (with apostrophes)', () => {
        // Simulate database data (from MongoDB EAVS)
        const dbData: TestData[] = [
            { name: "PRINCE GEORGES COUNTY", value: 653940 },
            { name: "QUEEN ANNES COUNTY", value: 41922 },
            { name: "ST. MARYS COUNTY", value: 85258 },
        ];

        const lookup = createCountyLookupMap(
            dbData,
            (item) => item.name,
            (item) => item.value
        );

        // Simulate GeoJSON names (with apostrophes)
        expect(lookup.get(normalizeCountyName("Prince George's County"))).toBe(653940);
        expect(lookup.get(normalizeCountyName("Queen Anne's County"))).toBe(41922);
        expect(lookup.get(normalizeCountyName("St. Mary's County"))).toBe(85258);
    });

    it('should work for all three states', () => {
        const data: TestData[] = [
            // Maryland
            { name: "PRINCE GEORGES COUNTY", value: 1 },
            { name: "ST. MARYS COUNTY", value: 2 },
            // Arkansas  
            { name: "ST. FRANCIS COUNTY", value: 3 },
            // Rhode Island
            { name: "BARRINGTON TOWN", value: 4 },
        ];

        const lookup = createCountyLookupMap(
            data,
            (item) => item.name,
            (item) => item.value
        );

        // Test Maryland
        expect(lookup.get(normalizeCountyName("Prince George's County"))).toBe(1);
        expect(lookup.get(normalizeCountyName("St. Mary's County"))).toBe(2);

        // Test Arkansas
        expect(lookup.get(normalizeCountyName("St. Francis County"))).toBe(3);

        // Test Rhode Island
        expect(lookup.get(normalizeCountyName("Barrington Town"))).toBe(4);
    });
});
