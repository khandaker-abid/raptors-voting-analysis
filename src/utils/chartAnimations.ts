/**
 * Animation configurations for Recharts components
 * 
 * Usage:
 * import { chartAnimationProps } from '../utils/chartAnimations';
 * 
 * <BarChart {...chartAnimationProps}>
 *   <Bar dataKey="value" animationBegin={0} animationDuration={800} />
 * </BarChart>
 */

// Standard animation duration in milliseconds
export const ANIMATION_DURATION = 800;
export const ANIMATION_BEGIN = 0;

// Easing functions
export type EasingFunction =
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'linear';

// Default animation props for Recharts charts
export const chartAnimationProps = {
    animationDuration: ANIMATION_DURATION,
    animationBegin: ANIMATION_BEGIN,
    animationEasing: 'ease-in-out' as EasingFunction,
};

// Animation props for individual chart elements
export const barAnimationProps = {
    animationBegin: 0,
    animationDuration: 800,
    animationEasing: 'ease-out' as EasingFunction,
};

export const lineAnimationProps = {
    animationBegin: 100,
    animationDuration: 1000,
    animationEasing: 'ease-in-out' as EasingFunction,
};

export const pieAnimationProps = {
    animationBegin: 0,
    animationDuration: 800,
    animationEasing: 'ease-out' as EasingFunction,
};

export const scatterAnimationProps = {
    animationBegin: 200,
    animationDuration: 600,
    animationEasing: 'ease-out' as EasingFunction,
};

// Staggered animation for multiple series
export const getStaggeredAnimationProps = (index: number, totalSeries: number) => {
    const staggerDelay = 100; // milliseconds between each series
    return {
        animationBegin: index * staggerDelay,
        animationDuration: ANIMATION_DURATION,
        animationEasing: 'ease-in-out' as EasingFunction,
    };
};

// CSS transition utilities for smooth state changes
export const transitionStyle = {
    default: {
        transition: 'all 0.3s ease-in-out',
    },
    fast: {
        transition: 'all 0.15s ease-in-out',
    },
    slow: {
        transition: 'all 0.6s ease-in-out',
    },
};

// Hover effect styles for interactive elements
export const hoverEffectStyle = {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: 3,
    },
};

// Fade-in animation for components
export const fadeInAnimation = {
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(20px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    animation: 'fadeIn 0.5s ease-in-out',
};

// Slide-in animation for side panels
export const slideInAnimation = (direction: 'left' | 'right' | 'top' | 'bottom') => {
    const transforms = {
        left: 'translateX(-20px)',
        right: 'translateX(20px)',
        top: 'translateY(-20px)',
        bottom: 'translateY(20px)',
    };

    return {
        '@keyframes slideIn': {
            from: { opacity: 0, transform: transforms[direction] },
            to: { opacity: 1, transform: 'translate(0)' },
        },
        animation: 'slideIn 0.4s ease-out',
    };
};

// Pulse animation for loading indicators
export const pulseAnimation = {
    '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
    },
    animation: 'pulse 1.5s ease-in-out infinite',
};

// Smooth scroll behavior
export const smoothScrollToElement = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top,
            behavior: 'smooth',
        });
    }
};
