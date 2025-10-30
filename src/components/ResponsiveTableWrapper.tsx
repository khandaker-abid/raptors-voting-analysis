import React from 'react';
import { TableContainer, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveTableWrapperProps {
    children: React.ReactNode;
    maxHeight?: number | string;
}

/**
 * Responsive wrapper for tables that makes them scrollable on mobile
 */
export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
    children,
    maxHeight = 600,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <TableContainer
            sx={{
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                overflowX: 'auto',
                overflowY: 'auto',
                // Smooth scrolling on touch devices
                WebkitOverflowScrolling: 'touch',
                // Make horizontal scroll more obvious on mobile
                '&::-webkit-scrollbar': {
                    height: isMobile ? 8 : 6,
                    width: isMobile ? 8 : 6,
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    borderRadius: 4,
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
                // Add shadow to indicate scrollable content
                background: isMobile
                    ? `
            linear-gradient(90deg, white 30%, rgba(255,255,255,0)),
            linear-gradient(90deg, rgba(255,255,255,0), white 70%) 100% 0,
            radial-gradient(farthest-side at 0 50%, rgba(0,0,0,.2), rgba(0,0,0,0)),
            radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,.2), rgba(0,0,0,0)) 100% 0
          `
                    : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '40px 100%, 40px 100%, 14px 100%, 14px 100%',
                backgroundAttachment: 'local, local, scroll, scroll',
            }}
        >
            {children}
        </TableContainer>
    );
};
