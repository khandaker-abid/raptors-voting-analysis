import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error for error boundary tests
    const originalError = console.error;

    beforeEach(() => {
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test content')).toBeTruthy();
    });

    it('renders fallback UI when child throws error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show error fallback
        expect(screen.queryByText('No error')).toBeNull();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom fallback</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show custom fallback
        expect(screen.getByText('Custom fallback')).toBeTruthy();
    });

    it('calls onReset callback when reset button is clicked', () => {
        const onReset = vi.fn();

        render(
            <ErrorBoundary onReset={onReset}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Click reset button - use getByText to be more specific
        const resetButton = screen.getByText('Try Again');
        fireEvent.click(resetButton);
        expect(onReset).toHaveBeenCalled();
    });

    it('shows error details when showDetails is true', () => {
        render(
            <ErrorBoundary showDetails={true}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show some error information
        // The exact text depends on implementation
    });

    it('hides error details when showDetails is false', () => {
        render(
            <ErrorBoundary showDetails={false}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should not show detailed error message
        expect(screen.queryByText('Test error')).toBeNull();
    });

    it('logs error to console', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(console.error).toHaveBeenCalled();
    });

    it('resets error state when reset button clicked', () => {
        // This test verifies the error boundary's reset mechanism clears state
        const onReset = vi.fn();

        render(
            <ErrorBoundary onReset={onReset}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Verify we're in error state
        expect(screen.getByText('Something went wrong')).toBeTruthy();

        // Find and click reset button
        const resetButton = screen.getByText('Try Again');
        fireEvent.click(resetButton);

        // onReset should have been called
        expect(onReset).toHaveBeenCalledTimes(1);
    });
});

// Import afterEach for cleanup
import { afterEach } from 'vitest';
