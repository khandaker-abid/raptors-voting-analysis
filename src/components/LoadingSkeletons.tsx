import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface ChartSkeletonProps {
    height?: number;
    showLegend?: boolean;
}

/**
 * Skeleton loader for charts while data is being fetched
 */
export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
    height = 400,
    showLegend = true,
}) => {
    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Title */}
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />

            {/* Subtitle/Description */}
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 3 }} />

            {/* Legend (optional) */}
            {showLegend && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Skeleton variant="rectangular" width={80} height={20} />
                    <Skeleton variant="rectangular" width={80} height={20} />
                    <Skeleton variant="rectangular" width={80} height={20} />
                </Box>
            )}

            {/* Chart area */}
            <Skeleton
                variant="rectangular"
                width="100%"
                height={height}
                sx={{ borderRadius: 1 }}
            />
        </Box>
    );
};

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

/**
 * Skeleton loader for tables while data is being fetched
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 4,
}) => {
    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Table header */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton
                        key={`header-${i}`}
                        variant="rectangular"
                        width={`${100 / columns}%`}
                        height={40}
                    />
                ))}
            </Box>

            {/* Table rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <Box key={`row-${rowIndex}`} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            variant="text"
                            width={`${100 / columns}%`}
                            height={30}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

interface MapSkeletonProps {
    height?: number;
}

/**
 * Skeleton loader for maps while tiles are loading
 */
export const MapSkeleton: React.FC<MapSkeletonProps> = ({ height = 500 }) => {
    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Map controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="rectangular" width={150} height={40} />
                <Skeleton variant="rectangular" width={100} height={40} />
            </Box>

            {/* Map area with grid pattern to simulate map tiles */}
            <Box
                sx={{
                    width: '100%',
                    height,
                    background: `
            repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.05),
              rgba(0,0,0,0.05) 50px,
              rgba(0,0,0,0.02) 50px,
              rgba(0,0,0,0.02) 100px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(0,0,0,0.05),
              rgba(0,0,0,0.05) 50px,
              rgba(0,0,0,0.02) 50px,
              rgba(0,0,0,0.02) 100px
            )
          `,
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Animated shimmer effect */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.3) 50%,
              transparent
            )`,
                        animation: 'shimmer 2s infinite',
                        '@keyframes shimmer': {
                            '0%': { transform: 'translateX(-100%)' },
                            '100%': { transform: 'translateX(100%)' },
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

interface StatCardSkeletonProps {
    count?: number;
}

/**
 * Skeleton loader for stat cards
 */
export const StatCardSkeleton: React.FC<StatCardSkeletonProps> = ({ count = 3 }) => {
    return (
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            {Array.from({ length: count }).map((_, i) => (
                <Box
                    key={`stat-${i}`}
                    sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" height={40} />
                </Box>
            ))}
        </Box>
    );
};
