import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
	Box,
	Typography,
	Paper,
	Alert,
	IconButton,
	ButtonGroup,
	Tooltip,
} from "@mui/material";
import { ZoomIn, ZoomOut, CenterFocusStrong } from "@mui/icons-material";
import { getStateShape } from "../data/stateShapes";

interface StateMapProps {
	stateName: string;
	center: [number, number];
	isDetailState: boolean;
}

const StateMap: React.FC<StateMapProps> = ({
	stateName,
	center,
	isDetailState,
}) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const [loading] = useState(false);
	const [error] = useState<string | null>(null);
	const [zoomLevel, setZoomLevel] = useState(1);
	const zoomBehaviorRef = useRef<d3.ZoomBehavior<
		SVGSVGElement,
		unknown
	> | null>(null);

	useEffect(() => {
		if (!svgRef.current || !stateName) return;

		// Clear previous content
		d3.select(svgRef.current).selectAll("*").remove();

		// Get state shape data
		const stateShape = getStateShape(stateName);

		// Create SVG container with consistent dimensions
		const containerWidth = 800;
		const containerHeight = 500;

		// Parse viewBox to understand the state's natural dimensions
		const [vx, vy, vw, vh] = stateShape.viewBox.split(" ").map(Number);

		const svg = d3
			.select(svgRef.current)
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
			.attr("preserveAspectRatio", "xMidYMid meet");

		// Add definitions for gradients and filters
		const defs = svg.append("defs");

		// Add gradient for state fill
		const gradient = defs
			.append("linearGradient")
			.attr("id", "stateGradient")
			.attr("x1", "0%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "100%");

		if (isDetailState) {
			gradient
				.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", "#bbdefb")
				.attr("stop-opacity", 1);
			gradient
				.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", "#e3f2fd")
				.attr("stop-opacity", 1);
		} else {
			gradient
				.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", "#f5f5f5")
				.attr("stop-opacity", 1);
			gradient
				.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", "#eeeeee")
				.attr("stop-opacity", 1);
		}

		// Add drop shadow filter
		const filter = defs
			.append("filter")
			.attr("id", "dropShadow")
			.attr("x", "-50%")
			.attr("y", "-50%")
			.attr("width", "200%")
			.attr("height", "200%");

		filter
			.append("feGaussianBlur")
			.attr("in", "SourceAlpha")
			.attr("stdDeviation", 3);

		filter
			.append("feOffset")
			.attr("dx", 2)
			.attr("dy", 2)
			.attr("result", "offsetblur");

		filter
			.append("feFlood")
			.attr("flood-color", "#000000")
			.attr("flood-opacity", "0.2");

		filter
			.append("feComposite")
			.attr("in2", "offsetblur")
			.attr("operator", "in");

		const feMerge = filter.append("feMerge");
		feMerge.append("feMergeNode");
		feMerge.append("feMergeNode").attr("in", "SourceGraphic");

		// Add background with subtle pattern
		svg
			.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", containerWidth)
			.attr("height", containerHeight)
			.attr("fill", "#fafafa");

		// Add subtle grid pattern
		const gridSize = 40;
		const gridGroup = svg.append("g").attr("opacity", 0.1);

		for (let x = 0; x <= containerWidth; x += gridSize) {
			gridGroup
				.append("line")
				.attr("x1", x)
				.attr("y1", 0)
				.attr("x2", x)
				.attr("y2", containerHeight)
				.attr("stroke", "#ccc")
				.attr("stroke-width", 0.5);
		}

		for (let y = 0; y <= containerHeight; y += gridSize) {
			gridGroup
				.append("line")
				.attr("x1", 0)
				.attr("y1", y)
				.attr("x2", containerWidth)
				.attr("y2", y)
				.attr("stroke", "#ccc")
				.attr("stroke-width", 0.5);
		}

		// Create zoomable group
		const g = svg.append("g").attr("class", "zoomable-content");

		// Calculate scale to fit state in container with proper padding
		const padding = 100;
		const scaleX = (containerWidth - padding * 2) / vw;
		const scaleY = (containerHeight - padding * 2) / vh;
		const scale = Math.min(scaleX, scaleY);

		// Center the state in the container
		const translateX = (containerWidth - vw * scale) / 2;
		const translateY = (containerHeight - vh * scale) / 2;

		// Apply initial transform to fit the state nicely
		g.attr(
			"transform",
			`translate(${translateX - vx * scale}, ${
				translateY - vy * scale
			}) scale(${scale})`,
		);

		// Draw state boundary with animation
		g.append("path")
			.attr("d", stateShape.path)
			.attr("fill", "url(#stateGradient)")
			.attr("stroke", isDetailState ? "#1565c0" : "#9e9e9e")
			.attr("stroke-width", 3)
			.attr("stroke-linejoin", "round")
			.attr("filter", "url(#dropShadow)")
			.attr("opacity", 0)
			.transition()
			.duration(500)
			.attr("opacity", 1);

		// Draw counties if detail state
		if (
			isDetailState &&
			stateShape.counties &&
			stateShape.counties.length > 0
		) {
			const counties = g.append("g").attr("class", "counties");

			// Create a color scale for counties
			const countyColorScale = d3
				.scaleOrdinal()
				.domain(stateShape.counties.map((c) => c.name))
				.range(d3.schemeBlues[3]);

			// Draw county boundaries with enhanced styling
			stateShape.counties.forEach((county, index) => {
				const countyPath = counties
					.append("path")
					.attr("d", county.path)
					.attr("fill", "transparent")
					.attr("stroke", "#64b5f6")
					.attr("stroke-width", 1.5)
					.attr("stroke-dasharray", "3,2")
					.attr("opacity", 0)
					.attr("class", "county-boundary")
					.style("cursor", "pointer");

				// Animate county appearance
				countyPath
					.transition()
					.delay(500 + index * 50)
					.duration(300)
					.attr("opacity", 0.4);

				// Add interactivity
				countyPath
					.on("mouseenter", function () {
						d3.select(this)
							.transition()
							.duration(200)
							.attr("fill", countyColorScale(county.name) as string)
							.attr("fill-opacity", 0.3)
							.attr("stroke", "#1976d2")
							.attr("stroke-width", 2.5)
							.attr("stroke-dasharray", "none")
							.attr("opacity", 1);

						// Show county name
						const [cx, cy] = getPathCenter(county.path);
						counties
							.append("text")
							.attr("class", "county-label")
							.attr("x", cx)
							.attr("y", cy)
							.attr("text-anchor", "middle")
							.attr("font-size", "12")
							.attr("font-weight", "600")
							.attr("fill", "#1976d2")
							.style("pointer-events", "none")
							.text(county.name)
							.attr("opacity", 0)
							.transition()
							.duration(200)
							.attr("opacity", 1);
					})
					.on("mouseleave", function () {
						d3.select(this)
							.transition()
							.duration(200)
							.attr("fill", "transparent")
							.attr("stroke", "#64b5f6")
							.attr("stroke-width", 1.5)
							.attr("stroke-dasharray", "3,2")
							.attr("opacity", 0.4);

						counties.selectAll(".county-label").remove();
					});

				// Add tooltip
				countyPath.append("title").text(`${county.name} County`);
			});
		}

		// Calculate center of the path for label placement
		const centerX = vx + vw / 2;
		const centerY = vy + vh / 2;

		// Add state name label with enhanced styling
		const stateLabel = g
			.append("text")
			.attr("x", centerX)
			.attr("y", centerY - 10)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", Math.min(32, Math.max(16, vw / 15)))
			.attr("font-weight", "700")
			.attr("fill", "#1565c0")
			.attr("stroke", "white")
			.attr("stroke-width", 4)
			.attr("paint-order", "stroke")
			.style("pointer-events", "none")
			.style("text-shadow", "2px 2px 4px rgba(0,0,0,0.1)")
			.text(stateName)
			.attr("opacity", 0);

		// Animate state name appearance
		stateLabel.transition().delay(300).duration(500).attr("opacity", 1);

		// Add coordinates label with better styling
		const coordLabel = g
			.append("text")
			.attr("x", centerX)
			.attr("y", centerY + 25)
			.attr("text-anchor", "middle")
			.attr("font-size", Math.min(14, Math.max(10, vw / 25)))
			.attr("font-weight", "400")
			.attr("fill", "#666")
			.style("pointer-events", "none")
			.text(`${center[1].toFixed(2)}°N, ${Math.abs(center[0]).toFixed(2)}°W`)
			.attr("opacity", 0);

		coordLabel.transition().delay(400).duration(500).attr("opacity", 0.8);

		// Add county count badge if detail state
		if (
			isDetailState &&
			stateShape.counties &&
			stateShape.counties.length > 0
		) {
			const badgeGroup = g.append("g");

			// Create badge background
			const badgeX = vx + vw - 60;
			const badgeY = vy + 30;

			badgeGroup
				.append("rect")
				.attr("x", badgeX - 40)
				.attr("y", badgeY - 15)
				.attr("width", 80)
				.attr("height", 30)
				.attr("rx", 15)
				.attr("fill", "#1976d2")
				.attr("opacity", 0)
				.transition()
				.delay(800)
				.duration(300)
				.attr("opacity", 0.9);

			badgeGroup
				.append("text")
				.attr("x", badgeX)
				.attr("y", badgeY + 3)
				.attr("text-anchor", "middle")
				.attr("font-size", "12")
				.attr("font-weight", "600")
				.attr("fill", "white")
				.text(`${stateShape.counties.length} Counties`)
				.attr("opacity", 0)
				.transition()
				.delay(800)
				.duration(300)
				.attr("opacity", 1);
		}

		// Setup zoom behavior
		const zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.5, 4])
			.on("zoom", (event) => {
				const { transform } = event;
				g.attr("transform", transform);
				setZoomLevel(transform.k);
			});

		zoomBehaviorRef.current = zoom;
		svg.call(zoom);

		// Helper function to get path center
		function getPathCenter(pathString: string): [number, number] {
			const numbers = pathString.match(/[\d.]+/g);
			if (!numbers || numbers.length < 2) return [centerX, centerY];

			const coords: [number, number][] = [];
			for (let i = 0; i < numbers.length; i += 2) {
				if (i + 1 < numbers.length) {
					coords.push([parseFloat(numbers[i]), parseFloat(numbers[i + 1])]);
				}
			}

			if (coords.length === 0) return [centerX, centerY];

			const avgX = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
			const avgY = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

			return [avgX, avgY];
		}
	}, [stateName, center, isDetailState]);

	const handleZoomIn = () => {
		if (zoomBehaviorRef.current && svgRef.current) {
			d3.select(svgRef.current)
				.transition()
				.duration(300)
				.call(zoomBehaviorRef.current.scaleBy, 1.5);
		}
	};

	const handleZoomOut = () => {
		if (zoomBehaviorRef.current && svgRef.current) {
			d3.select(svgRef.current)
				.transition()
				.duration(300)
				.call(zoomBehaviorRef.current.scaleBy, 1 / 1.5);
		}
	};

	const handleResetZoom = () => {
		if (zoomBehaviorRef.current && svgRef.current) {
			d3.select(svgRef.current)
				.transition()
				.duration(500)
				.call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
		}
	};

	if (!stateName) {
		return <Alert severity="warning">No state selected</Alert>;
	}

	return (
		<Paper
			elevation={2}
			sx={{
				p: 3,
				textAlign: "center",
				backgroundColor: "#fff",
				background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
				position: "relative",
			}}>
			<Typography
				variant="h6"
				gutterBottom
				sx={{
					fontWeight: 600,
					color: "#1565c0",
					mb: 1,
				}}>
				{stateName} Geographic View
			</Typography>
			{isDetailState && (
				<Typography
					variant="caption"
					color="text.secondary"
					display="block"
					mb={2}
					sx={{ fontStyle: "italic" }}>
					Interactive county boundaries • Hover to explore
				</Typography>
			)}

			{/* Zoom Controls */}
			<Box
				sx={{
					position: "absolute",
					top: 16,
					right: 16,
					zIndex: 1000,
				}}>
				<ButtonGroup
					orientation="vertical"
					variant="outlined"
					size="small"
					sx={{
						backgroundColor: "rgba(255, 255, 255, 0.9)",
						backdropFilter: "blur(4px)",
						borderRadius: 1,
					}}>
					<Tooltip title="Zoom In">
						<IconButton onClick={handleZoomIn} size="small">
							<ZoomIn />
						</IconButton>
					</Tooltip>
					<Tooltip title="Zoom Out">
						<IconButton onClick={handleZoomOut} size="small">
							<ZoomOut />
						</IconButton>
					</Tooltip>
					<Tooltip title="Reset Zoom">
						<IconButton onClick={handleResetZoom} size="small">
							<CenterFocusStrong />
						</IconButton>
					</Tooltip>
				</ButtonGroup>
			</Box>

			{/* Zoom Level Indicator */}
			<Box
				sx={{
					position: "absolute",
					bottom: 16,
					right: 16,
					backgroundColor: "rgba(0, 0, 0, 0.7)",
					color: "white",
					px: 1,
					py: 0.5,
					borderRadius: 1,
					fontSize: "0.75rem",
					zIndex: 1000,
				}}>
				{Math.round(zoomLevel * 100)}%
			</Box>

			{loading && (
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					minHeight={400}>
					Loading map...
				</Box>
			)}
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			<Box
				display="flex"
				justifyContent="center"
				sx={{
					border: "2px solid #e3f2fd",
					borderRadius: 2,
					overflow: "hidden",
					backgroundColor: "#ffffff",
					minHeight: 450,
					maxHeight: 600,
					boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
					position: "relative",
				}}>
				<svg ref={svgRef} className="interactive-map-svg" />
			</Box>
		</Paper>
	);
};

export default StateMap;
