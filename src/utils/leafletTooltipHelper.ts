/**
 * Leaflet Tooltip Helper
 * 
 * Provides utilities for dynamically positioning Leaflet tooltips
 * to prevent them from being cut off at map container edges.
 */

import L from "leaflet";

/**
 * Calculate the optimal tooltip direction based on cursor position
 * within the map container to prevent cutoff.
 * 
 * @param event - The Leaflet mouse event
 * @param map - The Leaflet map instance
 * @returns Optimal tooltip direction and offset
 */
export function getOptimalTooltipConfig(
    event: L.LeafletMouseEvent,
    map: L.Map
): { direction: "top" | "bottom" | "left" | "right" | "center"; offset: [number, number] } {
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();

    // Get cursor position relative to map container
    const cursorX = event.originalEvent.clientX - mapRect.left;
    const cursorY = event.originalEvent.clientY - mapRect.top;

    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;

    // Define thresholds for edge detection (in pixels from edge)
    // Increased threshold to handle tooltips better before they reach the edge
    const EDGE_THRESHOLD = 150; // Distance from edge to trigger direction change
    const VERTICAL_OFFSET = 20; // Vertical offset from cursor
    const HORIZONTAL_OFFSET = 20; // Horizontal offset from cursor

    // Check if cursor is near edges
    const nearTop = cursorY < EDGE_THRESHOLD;
    const nearBottom = cursorY > mapHeight - EDGE_THRESHOLD;
    const nearLeft = cursorX < EDGE_THRESHOLD;
    const nearRight = cursorX > mapWidth - EDGE_THRESHOLD;

    // Determine optimal direction
    // Priority: avoid top/bottom cutoff first, then left/right

    if (nearTop && !nearBottom) {
        // Cursor near top - show tooltip below
        return {
            direction: "bottom",
            offset: [0, VERTICAL_OFFSET]
        };
    } else if (nearBottom && !nearTop) {
        // Cursor near bottom - show tooltip above
        return {
            direction: "top",
            offset: [0, -VERTICAL_OFFSET]
        };
    } else if (nearLeft && !nearRight) {
        // Cursor near left - show tooltip to the right
        return {
            direction: "right",
            offset: [HORIZONTAL_OFFSET, 0]
        };
    } else if (nearRight && !nearLeft) {
        // Cursor near right - show tooltip to the left
        return {
            direction: "left",
            offset: [-HORIZONTAL_OFFSET, 0]
        };
    } else {
        // Default: show tooltip above cursor
        return {
            direction: "top",
            offset: [0, -VERTICAL_OFFSET]
        };
    }
}

/**
 * Create a responsive tooltip that adjusts its position based on
 * the cursor location within the map container.
 * 
 * @param layer - The Leaflet layer to bind the tooltip to
 * @param content - HTML content for the tooltip
 * @param _map - The Leaflet map instance (can be null during initialization) - unused but kept for API compatibility
 */
export function bindResponsiveTooltip(
    layer: L.Layer,
    content: string,
    _map: L.Map | null
): void {
    // Create tooltip with smart positioning
    (layer as any).bindTooltip(content, {
        permanent: false,
        direction: "auto", // Let Leaflet handle the direction automatically
        className: "custom-tooltip",
        opacity: 0.95,
        sticky: true, // Follow the cursor
        offset: [0, 0], // No offset needed with sticky mode
    });
}
