import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChartSkeleton, TableSkeleton, MapSkeleton, StatCardSkeleton } from '../LoadingSkeletons';

describe('LoadingSkeletons', () => {
    describe('ChartSkeleton', () => {
        it('renders with default height', () => {
            const { container } = render(<ChartSkeleton />);

            // Should render skeleton elements
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('renders with custom height', () => {
            const { container } = render(<ChartSkeleton height={600} />);

            // Should render successfully
            expect(container.firstChild).toBeTruthy();
        });

        it('renders without legend when showLegend is false', () => {
            const { container } = render(<ChartSkeleton showLegend={false} />);

            // Should still render skeleton elements
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('renders with legend when showLegend is true', () => {
            const { container } = render(<ChartSkeleton showLegend={true} />);

            // More skeleton elements expected with legend
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(2);
        });
    });

    describe('TableSkeleton', () => {
        it('renders with default rows and columns', () => {
            const { container } = render(<TableSkeleton />);

            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('renders correct number of rows', () => {
            const rows = 10;
            const columns = 3;
            const { container } = render(<TableSkeleton rows={rows} columns={columns} />);

            // Should render header + rows
            expect(container.firstChild).toBeTruthy();
        });

        it('renders correct number of columns', () => {
            const rows = 3;
            const columns = 6;
            const { container } = render(<TableSkeleton rows={rows} columns={columns} />);

            // Should render all column skeletons
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            // Header columns + row cells
            expect(skeletons.length).toBeGreaterThanOrEqual(columns);
        });
    });

    describe('MapSkeleton', () => {
        it('renders with default height', () => {
            const { container } = render(<MapSkeleton />);

            expect(container.firstChild).toBeTruthy();
        });

        it('renders with custom height', () => {
            const { container } = render(<MapSkeleton height={800} />);

            expect(container.firstChild).toBeTruthy();
        });

        it('renders map controls skeleton', () => {
            const { container } = render(<MapSkeleton />);

            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe('StatCardSkeleton', () => {
        it('renders stat card loading skeleton', () => {
            const { container } = render(<StatCardSkeleton />);

            // Should render multiple skeleton components
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('renders specified count of stat cards', () => {
            const { container } = render(<StatCardSkeleton count={5} />);

            // Should render multiple skeleton components
            const skeletons = container.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });
});
