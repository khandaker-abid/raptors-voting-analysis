// Test setup file for Vitest
import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by many chart libraries
(globalThis as any).ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock IntersectionObserver
(globalThis as any).IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords(): IntersectionObserverEntry[] { return []; }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => true,
    }),
});

// Mock scrollTo
window.scrollTo = () => { };

// Mock canvas context for chart testing
(HTMLCanvasElement.prototype as any).getContext = () => ({
    fillRect: () => { },
    clearRect: () => { },
    getImageData: () => ({ data: new Array(4) }),
    putImageData: () => { },
    createImageData: () => [],
    setTransform: () => { },
    drawImage: () => { },
    save: () => { },
    fillText: () => { },
    restore: () => { },
    beginPath: () => { },
    moveTo: () => { },
    lineTo: () => { },
    closePath: () => { },
    stroke: () => { },
    translate: () => { },
    scale: () => { },
    rotate: () => { },
    arc: () => { },
    fill: () => { },
    measureText: () => ({ width: 0 }),
    transform: () => { },
    rect: () => { },
    clip: () => { },
});

// Suppress console errors during tests (optional)
// const originalError = console.error;
// beforeAll(() => {
//     console.error = (...args) => {
//         if (
//             typeof args[0] === 'string' &&
//             args[0].includes('Warning: ReactDOM.render is no longer supported')
//         ) {
//             return;
//         }
//         originalError.call(console, ...args);
//     };
// });
// afterAll(() => {
//     console.error = originalError;
// });
