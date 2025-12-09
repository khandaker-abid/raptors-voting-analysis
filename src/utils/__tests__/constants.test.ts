/**
 * Test suite for constants
 * Validates that constants are properly defined and consistent
 * 
 * Note: This file uses Vitest. Run with: npx vitest run
 */

import { describe, it, expect } from 'vitest';

import {
    CHART_HEIGHTS,
    Z_INDEX,
    DEFAULT_ROWS_PER_PAGE,
    API_BASE_PATH,
    DEFAULT_EAVS_YEAR,
    EAVS_YEARS,
    DETAIL_STATES,
    MAP_ZOOM,
    CHART_COLORS,
    EQUIPMENT_COLORS,
    PERCENTAGE_BOUNDS,
} from '../../constants';

describe('CHART_HEIGHTS', () => {
    it('should have valid height values', () => {
        expect(CHART_HEIGHTS.SMALL).toBeGreaterThan(0);
        expect(CHART_HEIGHTS.MEDIUM).toBeGreaterThan(CHART_HEIGHTS.SMALL);
        expect(CHART_HEIGHTS.STANDARD).toBeGreaterThan(CHART_HEIGHTS.MEDIUM);
        expect(CHART_HEIGHTS.LARGE).toBeGreaterThan(CHART_HEIGHTS.STANDARD);
    });
});

describe('Z_INDEX', () => {
    it('should have proper layering hierarchy', () => {
        expect(Z_INDEX.DROPDOWN).toBeLessThan(Z_INDEX.MODAL_BACKDROP);
        expect(Z_INDEX.MODAL_BACKDROP).toBeLessThan(Z_INDEX.MODAL);
        expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.TOOLTIP);
        expect(Z_INDEX.TOOLTIP).toBeLessThan(Z_INDEX.OVERLAY);
        expect(Z_INDEX.OVERLAY).toBeLessThan(Z_INDEX.NOTIFICATION);
    });
});

describe('Table Constants', () => {
    it('should have valid default rows per page', () => {
        expect(DEFAULT_ROWS_PER_PAGE).toBeGreaterThan(0);
        expect(Number.isInteger(DEFAULT_ROWS_PER_PAGE)).toBe(true);
    });
});

describe('API Constants', () => {
    it('should have valid API base path', () => {
        expect(API_BASE_PATH).toBe('/api');
    });

    it('should have valid default EAVS year', () => {
        expect(DEFAULT_EAVS_YEAR).toBe(2024);
        expect(EAVS_YEARS).toContain(DEFAULT_EAVS_YEAR);
    });

    it('should have EAVS years in correct order', () => {
        const years = [...EAVS_YEARS];
        expect(years).toEqual([2016, 2020, 2024]);
    });
});

describe('DETAIL_STATES', () => {
    it('should contain expected states', () => {
        expect(DETAIL_STATES).toContain('Arkansas');
        expect(DETAIL_STATES).toContain('Maryland');
        expect(DETAIL_STATES).toContain('Rhode Island');
        expect(DETAIL_STATES.length).toBe(3);
    });
});

describe('MAP_ZOOM', () => {
    it('should have increasing zoom levels', () => {
        expect(MAP_ZOOM.US_OVERVIEW).toBeLessThan(MAP_ZOOM.STATE_VIEW);
        expect(MAP_ZOOM.STATE_VIEW).toBeLessThan(MAP_ZOOM.COUNTY_VIEW);
    });
});

describe('CHART_COLORS', () => {
    it('should have valid hex color values', () => {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        Object.values(CHART_COLORS).forEach(color => {
            expect(color).toMatch(hexColorRegex);
        });
    });

    it('should have distinct party colors', () => {
        expect(CHART_COLORS.DEMOCRATIC).not.toBe(CHART_COLORS.REPUBLICAN);
    });
});

describe('EQUIPMENT_COLORS', () => {
    it('should have colors for all equipment types', () => {
        expect(EQUIPMENT_COLORS['DRE no VVPAT']).toBeDefined();
        expect(EQUIPMENT_COLORS['DRE with VVPAT']).toBeDefined();
        expect(EQUIPMENT_COLORS['Ballot Marking Device']).toBeDefined();
        expect(EQUIPMENT_COLORS['Scanner']).toBeDefined();
        expect(EQUIPMENT_COLORS['MIXED']).toBeDefined();
    });
});

describe('PERCENTAGE_BOUNDS', () => {
    it('should have valid percentage bounds', () => {
        expect(PERCENTAGE_BOUNDS.MIN).toBe(0);
        expect(PERCENTAGE_BOUNDS.MAX).toBe(100);
    });
});
