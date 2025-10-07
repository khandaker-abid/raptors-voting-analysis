import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { getCountyCount, getStateShape } from "../data/stateShapes";

interface ProvisionalBallotChoroplethMapProps {
	stateName: string;
	data: Array<{
		county: string;
		E1a: number;
		lat?: number;
		lng?: number;
	}>;
}

const ProvisionalBallotChoroplethMap: React.FC<
	ProvisionalBallotChoroplethMapProps
> = ({ stateName, data }) => {
	const svgRef = useRef<SVGSVGElement>(null);

	// Calculate color scale
	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const values = data.map((d) => d.E1a);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);

		// Create 7 color bins for monochromatic scale
		return d3
			.scaleQuantize<string>()
			.domain([minValue, maxValue])
			.range([
				"#e3f2fd",
				"#bbdefb",
				"#90caf9",
				"#64b5f6",
				"#42a5f5",
				"#2196f3",
				"#1976d2",
			]);
	}, [data]);

	useEffect(() => {
		if (!svgRef.current || !data || data.length === 0 || !colorScale) return;

		const width = 800;
		const height = 600;

		// Clear previous content
		d3.select(svgRef.current).selectAll("*").remove();

		// Create SVG
		const svg = d3
			.select(svgRef.current)
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", `0 0 ${width} ${height}`)
			.attr("preserveAspectRatio", "xMidYMid meet")
			.style("background", "#f9f9f9");

		// Get state shape data with county boundaries
		const stateShape = getStateShape(stateName);
		const hasCountyBoundaries =
			stateShape.counties && stateShape.counties.length > 0;

		const g = svg.append("g");

		// Create tooltip
		const tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "choropleth-tooltip")
			.style("position", "absolute")
			.style("padding", "12px")
			.style("background", "rgba(0, 0, 0, 0.9)")
			.style("color", "white")
			.style("border-radius", "8px")
			.style("pointer-events", "none")
			.style("opacity", 0)
			.style("font-size", "13px")
			.style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
			.style("z-index", "9999");

		if (hasCountyBoundaries) {
			// Use actual county boundaries
			const [vx, vy, vw, vh] = stateShape.viewBox.split(" ").map(Number);

			// Calculate scale and translation to fit in the container
			const padding = 50;
			const scaleX = (width - padding * 2) / vw;
			const scaleY = (height - padding * 2) / vh;
			const scale = Math.min(scaleX, scaleY);

			const translateX = (width - vw * scale) / 2;
			const translateY = (height - vh * scale) / 2;

			g.attr(
				"transform",
				`translate(${translateX - vx * scale}, ${
					translateY - vy * scale
				}) scale(${scale})`,
			);

			// Draw state outline first
			g.append("path")
				.attr("d", stateShape.path)
				.attr("fill", "none")
				.attr("stroke", "#666")
				.attr("stroke-width", 2)
				.attr("opacity", 0.3);

			// Draw counties with choropleth coloring
			if (stateShape.counties) {
				stateShape.counties.forEach((county) => {
					const countyData = data.find((d) => d.county === county.name);
					const fillColor = countyData ? colorScale(countyData.E1a) : "#f0f0f0";
					const ballotCount = countyData?.E1a || 0;

					g.append("path")
						.attr("d", county.path)
						.attr("fill", fillColor)
						.attr("stroke", "#fff")
						.attr("stroke-width", 1.5)
						.style("cursor", "pointer")
						.style("transition", "all 0.2s ease")
						.on("mouseover", function (event) {
							d3.select(this)
								.attr("stroke", "#333")
								.attr("stroke-width", 3)
								.attr("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))");

							tooltip
								.style("opacity", 1)
								.html(
									`
									<div style="font-weight: bold; margin-bottom: 4px;">${county.name} County</div>
									<div>Provisional Ballots: <span style="color: #81c784;">${ballotCount.toLocaleString()}</span></div>
									${
										ballotCount === 0
											? '<div style="color: #ffab91; font-size: 11px; margin-top: 2px;">No data available</div>'
											: ""
									}
								`,
								)
								.style("left", event.pageX + 10 + "px")
								.style("top", event.pageY - 10 + "px");
						})
						.on("mouseout", function () {
							d3.select(this)
								.attr("stroke", "#fff")
								.attr("stroke-width", 1.5)
								.attr("filter", "none");

							tooltip.style("opacity", 0);
						});
				});
			}
		} else {
			// Fallback to grid layout for states without county boundary data
			const gridSize = Math.ceil(Math.sqrt(data.length));
			const cellWidth = width / gridSize;
			const cellHeight = height / gridSize;

			g.selectAll("rect")
				.data(data)
				.enter()
				.append("rect")
				.attr("x", (_d, i) => (i % gridSize) * cellWidth + 10)
				.attr("y", (_d, i) => Math.floor(i / gridSize) * cellHeight + 10)
				.attr("width", cellWidth - 20)
				.attr("height", cellHeight - 20)
				.attr("fill", (d) => colorScale(d.E1a))
				.attr("stroke", "#fff")
				.attr("stroke-width", 2)
				.attr("rx", 8)
				.style("cursor", "pointer")
				.style("transition", "all 0.2s ease")
				.on("mouseover", function (event, d) {
					d3.select(this)
						.attr("stroke", "#333")
						.attr("stroke-width", 3)
						.attr("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))");

					tooltip
						.style("opacity", 1)
						.html(
							`
							<div style="font-weight: bold; margin-bottom: 4px;">${d.county}</div>
							<div>Provisional Ballots: <span style="color: #81c784;">${d.E1a.toLocaleString()}</span></div>
						`,
						)
						.style("left", event.pageX + 10 + "px")
						.style("top", event.pageY - 10 + "px");
				})
				.on("mouseout", function () {
					d3.select(this)
						.attr("stroke", "#fff")
						.attr("stroke-width", 2)
						.attr("filter", "none");

					tooltip.style("opacity", 0);
				});

			// Add county labels for grid layout
			g.selectAll("text")
				.data(data)
				.enter()
				.append("text")
				.attr("x", (_d, i) => (i % gridSize) * cellWidth + cellWidth / 2)
				.attr(
					"y",
					(_d, i) => Math.floor(i / gridSize) * cellHeight + cellHeight / 2,
				)
				.attr("text-anchor", "middle")
				.attr("dominant-baseline", "middle")
				.attr("font-size", "10px")
				.attr("font-weight", "600")
				.attr("fill", (d) => {
					const color = colorScale(d.E1a);
					const rgb = d3.rgb(color);
					const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
					return brightness > 128 ? "#333" : "#fff";
				})
				.attr("pointer-events", "none")
				.text((d) =>
					d.county.length > 8 ? d.county.substring(0, 6) + "..." : d.county,
				);
		}

		// Cleanup function
		return () => {
			d3.select("body").selectAll(".choropleth-tooltip").remove();
		};
	}, [stateName, data, colorScale]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No choropleth data available for this state.
				</Typography>
			</Paper>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.E1a));
	const minValue = Math.min(...data.map((d) => d.E1a));
	const totalBallots = data.reduce((sum, d) => sum + d.E1a, 0);

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Provisional Ballots Distribution - {stateName}
				</Typography>
				<Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
					<Chip
						label={`${getCountyCount(stateName)} Counties/Towns`}
						size="small"
						color="primary"
					/>
					<Chip
						label={`Total: ${totalBallots.toLocaleString()} ballots`}
						size="small"
					/>
					<Chip
						label={`Range: ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}`}
						size="small"
					/>
				</Box>
			</Box>

			<Box display="flex" justifyContent="center" mb={3}>
				<svg ref={svgRef} className="responsive-svg"></svg>
			</Box>

			{/* Color Legend */}
			<Box>
				<Typography variant="subtitle2" gutterBottom fontWeight={600}>
					Color Scale (E1a - Total Provisional Ballots Cast)
				</Typography>
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="caption" sx={{ minWidth: 50 }}>
						{minValue}
					</Typography>
					<Box
						display="flex"
						height={30}
						flex={1}
						border="1px solid #e0e0e0"
						borderRadius={1}
						overflow="hidden">
						{colorScale &&
							colorScale.range().map((color, index) => (
								<Box
									key={index}
									sx={{
										flex: 1,
										backgroundColor: color,
										height: "100%",
									}}
								/>
							))}
					</Box>
					<Typography
						variant="caption"
						sx={{ minWidth: 50, textAlign: "right" }}>
						{maxValue}
					</Typography>
				</Box>
				<Typography
					variant="caption"
					color="text.secondary"
					display="block"
					mt={1}>
					Monochromatic scale with 7 color bins showing provisional ballot
					distribution across counties
				</Typography>
			</Box>
		</Paper>
	);
};

export default ProvisionalBallotChoroplethMap;
