import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
    showDetails?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error details for debugging
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Send error to logging service (future enhancement)
        // logErrorToService(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Call optional reset callback
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 300,
                        p: 3,
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            maxWidth: 600,
                            textAlign: 'center',
                        }}
                    >
                        <ErrorOutlineIcon
                            sx={{
                                fontSize: 64,
                                color: 'error.main',
                                mb: 2,
                            }}
                        />

                        <Typography variant="h5" gutterBottom>
                            Something went wrong
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            We encountered an unexpected error. Please try refreshing the page
                            or contact support if the problem persists.
                        </Typography>

                        {this.props.showDetails && this.state.error && (
                            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Error Details:
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    {this.state.error.toString()}
                                </Typography>
                                {this.state.errorInfo && (
                                    <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                            {this.state.errorInfo.componentStack}
                                        </Typography>
                                    </Box>
                                )}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={this.handleReset}
                            >
                                Try Again
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => window.location.href = '/'}
                            >
                                Go to Home
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for smaller error boundaries
 */
interface ChartErrorBoundaryProps {
    children: ReactNode;
    chartName?: string;
}

export const ChartErrorBoundary: React.FC<ChartErrorBoundaryProps> = ({
    children,
    chartName = 'Chart',
}) => {
    const fallback = (
        <Alert severity="error" sx={{ m: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
                Failed to load {chartName}
            </Typography>
            <Typography variant="body2">
                There was an error rendering this chart. Please try refreshing the page.
            </Typography>
        </Alert>
    );

    return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};
