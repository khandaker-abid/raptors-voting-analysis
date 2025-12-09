import { describe, it, expect } from 'vitest';
import {
    calculateLinearRegression,
    calculatePowerRegression,
    generateLinearLinePoints,
    generatePowerLinePoints,
    clamp01,
    type Point,
    type LinearCoefficients,
    type PowerCoefficients,
} from '../regression';

describe('Regression Utilities', () => {
    describe('calculateLinearRegression', () => {
        it('should return zeros for less than 2 points', () => {
            expect(calculateLinearRegression([])).toEqual({ slope: 0, intercept: 0, r2: 0 });
            expect(calculateLinearRegression([{ x: 1, y: 1 }])).toEqual({ slope: 0, intercept: 0, r2: 0 });
        });

        it('should calculate perfect positive correlation', () => {
            const points: Point[] = [
                { x: 1, y: 2 },
                { x: 2, y: 4 },
                { x: 3, y: 6 },
                { x: 4, y: 8 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(2);
            expect(result.intercept).toBe(0);
            expect(result.r2).toBe(1);
        });

        it('should calculate perfect negative correlation', () => {
            const points: Point[] = [
                { x: 1, y: 10 },
                { x: 2, y: 8 },
                { x: 3, y: 6 },
                { x: 4, y: 4 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(-2);
            expect(result.intercept).toBe(12);
            expect(result.r2).toBe(1);
        });

        it('should handle horizontal line (zero slope)', () => {
            const points: Point[] = [
                { x: 1, y: 5 },
                { x: 2, y: 5 },
                { x: 3, y: 5 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(0);
            expect(result.intercept).toBe(5);
        });

        it('should handle vertical line (very small denominator)', () => {
            const points: Point[] = [
                { x: 5, y: 1 },
                { x: 5, y: 2 },
                { x: 5, y: 3 },
            ];

            const result = calculateLinearRegression(points);

            // When all x values are the same, the slope should be 0 and
            // intercept should be the mean of y values
            expect(result.slope).toBe(0);
            expect(result.intercept).toBe(2); // mean of 1, 2, 3
        });

        it('should calculate regression with noise (imperfect correlation)', () => {
            const points: Point[] = [
                { x: 1, y: 2.1 },
                { x: 2, y: 3.9 },
                { x: 3, y: 6.2 },
                { x: 4, y: 7.8 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBeGreaterThan(1.5);
            expect(result.slope).toBeLessThan(2.5);
            expect(result.r2).toBeGreaterThan(0.95);
            expect(result.r2).toBeLessThanOrEqual(1);
        });

        it('should round values to 3 decimal places', () => {
            const points: Point[] = [
                { x: 0, y: 1.23456789 },
                { x: 1, y: 2.34567891 },
                { x: 2, y: 3.45678912 },
            ];

            const result = calculateLinearRegression(points);

            // Check that values have at most 3 decimal places
            const slopeDecimals = (result.slope.toString().split('.')[1] || '').length;
            const interceptDecimals = (result.intercept.toString().split('.')[1] || '').length;
            const r2Decimals = (result.r2.toString().split('.')[1] || '').length;

            expect(slopeDecimals).toBeLessThanOrEqual(3);
            expect(interceptDecimals).toBeLessThanOrEqual(3);
            expect(r2Decimals).toBeLessThanOrEqual(3);
        });

        it('should handle large numbers', () => {
            const points: Point[] = [
                { x: 1000000, y: 2000000 },
                { x: 2000000, y: 4000000 },
                { x: 3000000, y: 6000000 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(2);
            expect(result.intercept).toBe(0);
            expect(result.r2).toBe(1);
        });

        it('should handle negative values', () => {
            const points: Point[] = [
                { x: -2, y: -4 },
                { x: -1, y: -2 },
                { x: 0, y: 0 },
                { x: 1, y: 2 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(2);
            expect(result.intercept).toBe(0);
            expect(result.r2).toBe(1);
        });

        it('should handle two points exactly', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 10, y: 20 },
            ];

            const result = calculateLinearRegression(points);

            expect(result.slope).toBe(2);
            expect(result.intercept).toBe(0);
            expect(result.r2).toBe(1);
        });
    });

    describe('calculatePowerRegression', () => {
        it('should return defaults for less than 2 points', () => {
            expect(calculatePowerRegression([])).toEqual({ a: 0, b: 1, r2: 0 });
            expect(calculatePowerRegression([{ x: 1, y: 1 }])).toEqual({ a: 0, b: 1, r2: 0 });
        });

        it('should calculate perfect power relationship (y = x^2)', () => {
            const points: Point[] = [
                { x: 1, y: 1 },
                { x: 2, y: 4 },
                { x: 3, y: 9 },
                { x: 4, y: 16 },
            ];

            const result = calculatePowerRegression(points);

            expect(result.a).toBeCloseTo(1, 1);
            expect(result.b).toBeCloseTo(2, 1);
            expect(result.r2).toBeGreaterThan(0.99);
        });

        it('should calculate power relationship (y = 2 * x^0.5)', () => {
            const points: Point[] = [
                { x: 1, y: 2 },
                { x: 4, y: 4 },
                { x: 9, y: 6 },
                { x: 16, y: 8 },
            ];

            const result = calculatePowerRegression(points);

            expect(result.a).toBeCloseTo(2, 1);
            expect(result.b).toBeCloseTo(0.5, 1);
            expect(result.r2).toBeGreaterThan(0.99);
        });

        it('should filter out non-positive values for log transformation', () => {
            const points: Point[] = [
                { x: -1, y: -2 },  // Should be filtered
                { x: 0, y: 0 },    // Should be filtered
                { x: 1, y: 1 },
                { x: 2, y: 4 },
                { x: 3, y: 9 },
            ];

            const result = calculatePowerRegression(points);

            // Should still calculate valid regression from positive points
            expect(result.a).toBeGreaterThan(0);
            expect(result.b).toBeGreaterThan(0);
        });

        it('should fallback to linear when no valid points for power', () => {
            const points: Point[] = [
                { x: -1, y: 1 },
                { x: -2, y: 2 },
            ];

            const result = calculatePowerRegression(points);

            // Should fallback since all x values are negative
            expect(result).toBeDefined();
        });

        it('should handle y = x (a=1, b=1)', () => {
            const points: Point[] = [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
                { x: 3, y: 3 },
                { x: 4, y: 4 },
            ];

            const result = calculatePowerRegression(points);

            expect(result.a).toBeCloseTo(1, 1);
            expect(result.b).toBeCloseTo(1, 1);
            expect(result.r2).toBeGreaterThan(0.99);
        });
    });

    describe('generateLinearLinePoints', () => {
        it('should generate correct number of points', () => {
            const coef: LinearCoefficients = { slope: 2, intercept: 1, r2: 1 };

            const points10 = generateLinearLinePoints(coef, 0, 10, 10);
            const points50 = generateLinearLinePoints(coef, 0, 10);  // default 50 points

            expect(points10).toHaveLength(10);
            expect(points50).toHaveLength(50);
        });

        it('should generate points following y = mx + b', () => {
            const coef: LinearCoefficients = { slope: 2, intercept: 1, r2: 1 };

            const points = generateLinearLinePoints(coef, 0, 10, 11);

            points.forEach(p => {
                const expectedY = coef.slope * p.x + coef.intercept;
                expect(p.y).toBeCloseTo(expectedY, 5);
            });
        });

        it('should span the correct x range', () => {
            const coef: LinearCoefficients = { slope: 1, intercept: 0, r2: 1 };

            const points = generateLinearLinePoints(coef, 5, 15, 10);

            expect(points[0].x).toBe(5);
            expect(points[points.length - 1].x).toBeCloseTo(15, 5);
        });

        it('should handle negative ranges', () => {
            const coef: LinearCoefficients = { slope: -1, intercept: 10, r2: 1 };

            const points = generateLinearLinePoints(coef, -10, 0, 11);

            expect(points[0].x).toBe(-10);
            expect(points[0].y).toBe(20);  // -1 * -10 + 10
            expect(points[10].x).toBe(0);
            expect(points[10].y).toBe(10);  // -1 * 0 + 10
        });
    });

    describe('generatePowerLinePoints', () => {
        it('should generate correct number of points', () => {
            const coef: PowerCoefficients = { a: 1, b: 2, r2: 1 };

            const points10 = generatePowerLinePoints(coef, 1, 10, 10);
            const points50 = generatePowerLinePoints(coef, 1, 10);  // default 50 points

            expect(points10).toHaveLength(10);
            expect(points50).toHaveLength(50);
        });

        it('should generate points following y = a * x^b', () => {
            const coef: PowerCoefficients = { a: 2, b: 3, r2: 1 };

            const points = generatePowerLinePoints(coef, 1, 5, 5);

            points.forEach(p => {
                const expectedY = coef.a * Math.pow(p.x, coef.b);
                expect(p.y).toBeCloseTo(expectedY, 5);
            });
        });

        it('should avoid x=0 for power function', () => {
            const coef: PowerCoefficients = { a: 1, b: 0.5, r2: 1 };

            const points = generatePowerLinePoints(coef, 0, 10, 10);

            // First point should not be exactly 0
            expect(points[0].x).toBeGreaterThan(0);
            expect(points[0].x).toBe(0.01);
        });

        it('should handle fractional exponents', () => {
            const coef: PowerCoefficients = { a: 1, b: 0.5, r2: 1 };  // y = sqrt(x)

            const points = generatePowerLinePoints(coef, 1, 9, 9);

            // Check a few known values
            expect(points[0].y).toBeCloseTo(1, 5);  // sqrt(1) = 1
        });
    });

    describe('clamp01', () => {
        it('should return value if within 0-100 range', () => {
            expect(clamp01(0)).toBe(0);
            expect(clamp01(50)).toBe(50);
            expect(clamp01(100)).toBe(100);
            expect(clamp01(33.33)).toBe(33.33);
        });

        it('should clamp values below 0 to 0', () => {
            expect(clamp01(-1)).toBe(0);
            expect(clamp01(-100)).toBe(0);
            expect(clamp01(-0.0001)).toBe(0);
        });

        it('should clamp values above 100 to 100', () => {
            expect(clamp01(101)).toBe(100);
            expect(clamp01(1000)).toBe(100);
            expect(clamp01(100.0001)).toBe(100);
        });

        it('should handle edge cases', () => {
            expect(clamp01(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
            expect(clamp01(Number.MAX_VALUE)).toBe(100);
            expect(clamp01(-Number.MAX_VALUE)).toBe(0);
        });
    });

    describe('Integration Tests', () => {
        it('should work end-to-end: calculate regression and generate line', () => {
            // Generate some data points
            const dataPoints: Point[] = [
                { x: 1, y: 2 },
                { x: 2, y: 4 },
                { x: 3, y: 6 },
                { x: 4, y: 8 },
                { x: 5, y: 10 },
            ];

            // Calculate regression
            const linearCoef = calculateLinearRegression(dataPoints);

            // Generate line points
            const linePoints = generateLinearLinePoints(linearCoef, 0, 6, 7);

            // Verify the line fits the data
            expect(linearCoef.slope).toBe(2);
            expect(linearCoef.intercept).toBe(0);
            expect(linePoints).toHaveLength(7);
            expect(linePoints[1].y).toBeCloseTo(2, 5);  // at x=1, y should be 2
            expect(linePoints[2].y).toBeCloseTo(4, 5);  // at x=2, y should be 4
        });

        it('should work for power regression end-to-end', () => {
            // Generate quadratic data
            const dataPoints: Point[] = [];
            for (let x = 1; x <= 5; x++) {
                dataPoints.push({ x, y: x * x });
            }

            // Calculate power regression
            const powerCoef = calculatePowerRegression(dataPoints);

            // Generate line points
            const linePoints = generatePowerLinePoints(powerCoef, 1, 5, 5);

            // Verify the fit
            expect(powerCoef.b).toBeCloseTo(2, 1);  // exponent should be ~2
            expect(linePoints).toHaveLength(5);
        });
    });
});
