import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const USMap: React.FC = () => {
	const svgRef = useRef<SVGSVGElement>(null);
	const navigate = useNavigate();
	const detailStates = useMemo(
		() => ["Rhode Island", "West Virginia", "Arkansas"],
		[],
	);

	useEffect(() => {
		const svg = d3.select(svgRef.current);
		const width = 960;
		const height = 600;

		const projection = d3
			.geoAlbersUsa()
			.scale(1280)
			.translate([width / 2, height / 2]);
		const path = d3.geoPath().projection(projection);

		svg.selectAll("*").remove();

		d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
			.then(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(us: any) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const states = topojson.feature(us, us.objects.states) as any;

					// Filter to only mainland US states (exclude Alaska, Hawaii, and territories)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const mainlandStates = states.features.filter((d: any) => {
						return (
							d.properties.name !== "Alaska" && d.properties.name !== "Hawaii"
						);
					});

					svg
						.selectAll("path")
						.data(mainlandStates)
						.enter()
						.append("path")
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.attr("d", (d: any) => path(d))
						.attr("class", "state")
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.style("fill", (d: any) =>
							detailStates.includes(d.properties.name) ? "#2196F3" : "#e0e0e0",
						)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.style("stroke", (d: any) =>
							detailStates.includes(d.properties.name) ? "#1565C0" : "#bdbdbd",
						)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.style("stroke-width", (d: any) =>
							detailStates.includes(d.properties.name) ? "3px" : "1px",
						)
						.style("cursor", "pointer")
						.style("transition", "all 0.2s ease")
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.on("mouseover", function (_event, d: any) {
							d3.select(this)
								.style("opacity", 0.8)
								.style(
									"stroke-width",
									detailStates.includes(d.properties.name) ? "4px" : "2px",
								);
						})
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.on("mouseout", function (_event, d: any) {
							d3.select(this)
								.style("opacity", 1)
								.style(
									"stroke-width",
									detailStates.includes(d.properties.name) ? "3px" : "1px",
								);
						})
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.on("click", (_event, d: any) => {
							navigate(`/state/${encodeURIComponent(d.properties.name)}`);
						})
						.append("title")
						.text(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(d: any) =>
								`${d.properties.name}${
									detailStates.includes(d.properties.name)
										? " (Detailed Data Available)"
										: ""
								}`,
						);
				},
			)
			.catch((error) => {
				console.error("Error loading US map data:", error);
				// Add a fallback message in the SVG
				svg
					.append("text")
					.attr("x", width / 2)
					.attr("y", height / 2)
					.attr("text-anchor", "middle")
					.style("font-size", "18px")
					.style("fill", "#666")
					.text(
						"Error loading map data. Please check your internet connection.",
					);
			});
	}, [navigate, detailStates]);

	return (
		<Box sx={{ textAlign: "center" }}>
			<Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
				Interactive US States Map
			</Typography>
			<Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
				Click on any state to view its data. States with detailed analysis are
				highlighted in blue.
			</Typography>
			<Box sx={{ display: "flex", justifyContent: "center", mb: 2, gap: 4 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							width: 20,
							height: 20,
							backgroundColor: "#2196F3",
							border: "3px solid #1565C0",
							borderRadius: 1,
						}}
					/>
					<Typography variant="caption">Detail States (RI, WV, AR)</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							width: 20,
							height: 20,
							backgroundColor: "#e0e0e0",
							border: "1px solid #bdbdbd",
							borderRadius: 1,
						}}
					/>
					<Typography variant="caption">Other States</Typography>
				</Box>
			</Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 2,
					backgroundColor: "#fafafa",
				}}>
				<Box
					sx={{
						"maxWidth": "100%",
						"height": "auto",
						"& svg": {
							maxWidth: "100%",
							height: "auto",
						},
					}}>
					<svg ref={svgRef} width={960} height={600}>
						<text x="480" y="300" textAnchor="middle" fill="#666" fontSize="16">
							Loading US States Map...
						</text>
					</svg>
				</Box>
			</Box>
		</Box>
	);
};

export default USMap;
