/**
 * Regression line calculation utilities for GUI-26
 * Implements linear least squares regression for bubble charts
 */

export interface Point {
    x: number;
    y: number;
}

export interface LinearCoefficients {
    slope: number;
    intercept: number;
    r2: number; // Coefficient of determination
}

export interface PowerCoefficients {
    a: number; // Coefficient
    b: number; // Exponent
    r2: number; // Coefficient of determination
}

/**
 * Calculate linear regression (y = mx + b)
 * Uses ordinary least squares method
 */
export function calculateLinearRegression(
    points: Point[]
): LinearCoefficients {
    if (points.length < 2) {
        return { slope: 0, intercept: 0, r2: 0 };
    }

    const n = points.length;

    // Calculate sums
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
        sumY2 += point.y * point.y;
    }

    // Calculate slope (m) and intercept (b)
    const denominator = n * sumX2 - sumX * sumX;

    if (Math.abs(denominator) < 1e-10) {
        // Vertical line or all points have same x
        return { slope: 0, intercept: sumY / n, r2: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination)
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    for (const point of points) {
        const predicted = slope * point.x + intercept;
        ssTotal += (point.y - meanY) ** 2;
        ssResidual += (point.y - predicted) ** 2;
    }

    const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    return {
        slope: Math.round(slope * 1000) / 1000,
        intercept: Math.round(intercept * 1000) / 1000,
        r2: Math.round(r2 * 1000) / 1000,
    };
}

/**
 * Calculate power regression (y = a * x^b)
 * Uses logarithmic transformation and linear regression
 * Best for non-linear relationships
 */
export function calculatePowerRegression(
    points: Point[]
): PowerCoefficients {
    if (points.length < 2) {
        return { a: 0, b: 1, r2: 0 };
    }

    // Filter out points where x or y is <= 0 (can't take log)
    const validPoints = points.filter((p) => p.x > 0 && p.y > 0);

    if (validPoints.length < 2) {
        // Fall back to linear regression
        const linear = calculateLinearRegression(points);
        return {
            a: linear.intercept,
            b: linear.slope > 0 ? 1 : 0,
            r2: linear.r2,
        };
    }

    // Transform to log space: ln(y) = ln(a) + b*ln(x)
    const logPoints: Point[] = validPoints.map((p) => ({
        x: Math.log(p.x),
        y: Math.log(p.y),
    }));

    // Perform linear regression in log space
    const logRegression = calculateLinearRegression(logPoints);

    // Transform back: a = e^intercept, b = slope
    const a = Math.exp(logRegression.intercept);
    const b = logRegression.slope;

    // Calculate R² in original space
    const meanY = validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length;
    let ssTotal = 0;
    let ssResidual = 0;

    for (const point of validPoints) {
        const predicted = a * Math.pow(point.x, b);
        ssTotal += (point.y - meanY) ** 2;
        ssResidual += (point.y - predicted) ** 2;
    }

    const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    return {
        a: Math.round(a * 1000) / 1000,
        b: Math.round(b * 1000) / 1000,
        r2: Math.round(r2 * 1000) / 1000,
    };
}

/**
 * Generate line points from linear regression coefficients
 */
export function generateLinearLinePoints(
    coef: LinearCoefficients,
    xMin: number,
    xMax: number,
    numPoints: number = 50
): Point[] {
    const points: Point[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
        const x = xMin + i * step;
        const y = coef.slope * x + coef.intercept;
        points.push({ x, y });
    }

    return points;
}

/**
 * Generate line points from power regression coefficients
 */
export function generatePowerLinePoints(
    coef: PowerCoefficients,
    xMin: number,
    xMax: number,
    numPoints: number = 50
): Point[] {
    const points: Point[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
        const x = Math.max(0.01, xMin + i * step); // Avoid x=0 for power function
        const y = coef.a * Math.pow(x, coef.b);
        points.push({ x, y });
    }

    return points;
}

/**
 * Clamp value between 0 and 1 (for percentages)
 */
export function clamp01(value: number): number {
    return Math.max(0, Math.min(100, value));
}
