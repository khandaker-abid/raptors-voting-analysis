import L from "leaflet";
export function getOptimalTooltipConfig(
    event: L.LeafletMouseEvent,
    map: L.Map
): { direction: "top" | "bottom" | "left" | "right" | "center"; offset: [number, number] } {
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();

    const cursorX = event.originalEvent.clientX - mapRect.left;
    const cursorY = event.originalEvent.clientY - mapRect.top;

    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;

    const EDGE_THRESHOLD = 150;
    const VERTICAL_OFFSET = 20;
    const HORIZONTAL_OFFSET = 20;

    const nearTop = cursorY < EDGE_THRESHOLD;
    const nearBottom = cursorY > mapHeight - EDGE_THRESHOLD;
    const nearLeft = cursorX < EDGE_THRESHOLD;
    const nearRight = cursorX > mapWidth - EDGE_THRESHOLD;

    if (nearTop && !nearBottom) {
        return {
            direction: "bottom",
            offset: [0, VERTICAL_OFFSET]
        };
    } else if (nearBottom && !nearTop) {
        return {
            direction: "top",
            offset: [0, -VERTICAL_OFFSET]
        };
    } else if (nearLeft && !nearRight) {
        return {
            direction: "right",
            offset: [HORIZONTAL_OFFSET, 0]
        };
    } else if (nearRight && !nearLeft) {
        return {
            direction: "left",
            offset: [-HORIZONTAL_OFFSET, 0]
        };
    } else {
        return {
            direction: "top",
            offset: [0, -VERTICAL_OFFSET]
        };
    }
}

export function bindResponsiveTooltip(
    layer: L.Layer,
    content: string,
    _map: L.Map | null
): void {
    (layer as any).bindTooltip(content, {
        permanent: false,
        direction: "auto",
        className: "custom-tooltip",
        opacity: 0.95,
        sticky: true,
        offset: [0, 0],
    });
}
