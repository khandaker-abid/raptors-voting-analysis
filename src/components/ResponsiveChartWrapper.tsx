import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveChartWrapperProps {
    children: React.ReactNode;
    minHeight?: number | string;
}

/**
 * Responsive wrapper for charts that adjusts height and spacing based on screen size
 */
export const ResponsiveChartWrapper: React.FC<ResponsiveChartWrapperProps> = ({
    children,
    minHeight = 300,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    // Adjust chart height based on screen size
    const chartHeight = isMobile ? 300 : isTablet ? 400 : 500;

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                height: `${chartHeight}px`,
                overflowX: 'auto',
                overflowY: 'visible',
                // Ensure touch scrolling works smoothly on mobile
                WebkitOverflowScrolling: 'touch',
                // Add padding on mobile for better touch targets
                px: isMobile ? 1 : 2,
                py: isMobile ? 1 : 2,
            }}
        >
            {children}
        </Box>
    );
};
