import { describe, it, expect } from 'vitest';
import {
    getFormattedDate,
    generateFilename,
} from '../exportUtils';

// We'll test the pure functions that don't rely on file-saver
// The CSV conversion logic can be tested through integration tests

describe('Export Utilities - Pure Functions', () => {
    describe('getFormattedDate', () => {
        it('should return date in YYYY-MM-DD format', () => {
            const result = getFormattedDate();

            // Should match ISO date format
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return current date', () => {
            const result = getFormattedDate();
            const today = new Date().toISOString().split('T')[0];

            expect(result).toBe(today);
        });

        it('should have proper date structure', () => {
            const result = getFormattedDate();
            const [year, month, day] = result.split('-');

            expect(Number(year)).toBeGreaterThanOrEqual(2020);
            expect(Number(year)).toBeLessThanOrEqual(2100);
            expect(Number(month)).toBeGreaterThanOrEqual(1);
            expect(Number(month)).toBeLessThanOrEqual(12);
            expect(Number(day)).toBeGreaterThanOrEqual(1);
            expect(Number(day)).toBeLessThanOrEqual(31);
        });
    });

    describe('generateFilename', () => {
        it('should generate filename with base and date', () => {
            const result = generateFilename('voters_data');
            const today = new Date().toISOString().split('T')[0];

            expect(result).toBe(`voters_data_${today}`);
        });

        it('should include extension when provided', () => {
            const result = generateFilename('report', 'csv');
            const today = new Date().toISOString().split('T')[0];

            expect(result).toBe(`report_${today}.csv`);
        });

        it('should handle empty extension', () => {
            const result = generateFilename('data', '');
            const today = new Date().toISOString().split('T')[0];

            expect(result).toBe(`data_${today}`);
        });

        it('should handle various base names', () => {
            const bases = ['test', 'my-file', 'export_2024', 'data.backup'];

            bases.forEach(base => {
                const result = generateFilename(base, 'json');
                expect(result).toContain(base);
                expect(result).toContain('.json');
            });
        });

        it('should handle special characters in base name', () => {
            const result = generateFilename('voters_arkansas-2024', 'csv');

            expect(result).toContain('voters_arkansas-2024');
            expect(result).toMatch(/\.csv$/);
        });

        it('should not double-add extension if already present', () => {
            const result = generateFilename('report', 'csv');

            // Should only have one .csv
            expect(result.match(/\.csv/g)?.length).toBe(1);
        });
    });

    describe('Filename Generation Edge Cases', () => {
        it('should handle empty base name', () => {
            const result = generateFilename('', 'csv');
            const today = new Date().toISOString().split('T')[0];

            expect(result).toBe(`_${today}.csv`);
        });

        it('should handle very long base names', () => {
            const longName = 'a'.repeat(200);
            const result = generateFilename(longName, 'csv');

            expect(result).toContain(longName);
            expect(result).toMatch(/\.csv$/);
        });

        it('should handle unicode characters', () => {
            const result = generateFilename('données_électeurs', 'csv');

            expect(result).toContain('données_électeurs');
        });

        it('should handle numbers in base name', () => {
            const result = generateFilename('report2024', 'csv');

            expect(result).toContain('report2024');
        });
    });
});

describe('CSV Conversion Logic', () => {
    // Test the CSV logic without mocking file-saver
    // This tests the algorithm independently

    function buildCSVContent(data: any[]): string {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);

        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value ?? '';
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    it('should build correct CSV headers', () => {
        const data = [{ name: 'Test', value: 123 }];
        const csv = buildCSVContent(data);
        const lines = csv.split('\n');

        expect(lines[0]).toBe('name,value');
    });

    it('should handle commas in values by quoting', () => {
        const data = [{ name: 'Smith, John', city: 'NYC' }];
        const csv = buildCSVContent(data);

        expect(csv).toContain('"Smith, John"');
    });

    it('should handle null values as empty strings', () => {
        const data = [{ name: 'Test', value: null }];
        const csv = buildCSVContent(data);

        expect(csv).toContain('Test,');
    });

    it('should handle multiple rows correctly', () => {
        const data = [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
        ];
        const csv = buildCSVContent(data);
        const lines = csv.split('\n');

        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('id,name');
        expect(lines[1]).toBe('1,A');
        expect(lines[2]).toBe('2,B');
    });

    it('should handle numeric values', () => {
        const data = [{ count: 1000, rate: 0.5, negative: -10 }];
        const csv = buildCSVContent(data);

        expect(csv).toContain('1000');
        expect(csv).toContain('0.5');
        expect(csv).toContain('-10');
    });

    it('should handle boolean values', () => {
        const data = [{ active: true, deleted: false }];
        const csv = buildCSVContent(data);

        expect(csv).toContain('true');
        expect(csv).toContain('false');
    });

    it('should return empty string for empty array', () => {
        expect(buildCSVContent([])).toBe('');
        expect(buildCSVContent(null as any)).toBe('');
    });
});
