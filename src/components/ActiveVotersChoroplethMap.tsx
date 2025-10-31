import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Alert, Chip } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ActiveVotersRow } from "../data/types";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";

interface ActiveVotersChoroplethMapProps {
	stateName: string;
	data: ActiveVotersRow[];
	/** Optional: change value (e.g., flip 0/1) when an external dialog closes to force-clear hover */
	resetHoverKey?: number;
}

type CountyFeature = Feature<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;

type CountyGeoJSONData = FeatureCollection<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;

const ActiveVotersChoroplethMap: React.FC<ActiveVotersChoroplethMapProps> = ({
	stateName,
	data,
	resetHoverKey,
}) => {
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	// Track map + GeoJSON + hovered layer so we can reliably clear highlight
	const mapRef = useRef<L.Map | null>(null);
	const geoRef = useRef<L.GeoJSON | null>(null);
	const hoveredRef = useRef<L.Path | null>(null);

	const clearHover = () => {
		if (hoveredRef.current) {
			try {
				geoRef.current?.resetStyle(hoveredRef.current as any);
				// Close tooltip
				if ((hoveredRef.current as any).closeTooltip) {
					(hoveredRef.current as any).closeTooltip();
				}
			} catch {
				// ignore if layer is detached
			}
			hoveredRef.current = null;
		}
	};

	// Gray color palette for visual consistency with Provisional Ballot map
	// Neutral grayscale avoids political colors (no blue/red)
	const COLOR_PALETTE = useMemo(() => {
		return [
			"#e8e8e8", // Very light gray
			"#d0d0d0", // Light gray
			"#b8b8b8", // Medium-light gray
			"#a0a0a0", // Medium gray
			"#888888", // Medium-dark gray
			"#707070", // Dark gray
			"#585858", // Very dark gray
		];
	}, []);

	// Calculate color scale for active voter percentage
	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const percentages = data.map((d) => d.activePercentage);
		const maxPercentage = Math.max(...percentages);
		const minPercentage = Math.min(...percentages);

		return (value: number) => {
			if (value === 0) return "#f5f5f5"; // Special color for no data
			if (maxPercentage === minPercentage)
				return COLOR_PALETTE[COLOR_PALETTE.length - 1];
			const ratio = (value - minPercentage) / (maxPercentage - minPercentage || 1);
			const index = Math.floor(ratio * (COLOR_PALETTE.length - 1));
			return COLOR_PALETTE[Math.min(index, COLOR_PALETTE.length - 1)];
		};
	}, [data, COLOR_PALETTE]);

	// Create a data lookup map for efficient county data retrieval
	const dataLookup = useMemo(() => {
		const lookup = new Map<string, ActiveVotersRow>();
		data.forEach((item) => {
			const normalizedCounty = item.geographicUnit.toLowerCase().replace(/\s+/g, " ").trim();
			lookup.set(normalizedCounty, item);

			const withoutCounty = normalizedCounty.replace(/\s+county$/, "");
			if (withoutCounty !== normalizedCounty) {
				lookup.set(withoutCounty, item);
			}
		});
		return lookup;
	}, [data]);

	useEffect(() => {
		const loadMapData = async () => {
			if (!stateName) return;

			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/georef-united-states-of-america-county.geojson");

				if (!response.ok) {
					throw new Error(`Failed to fetch county data: ${response.statusText}`);
				}

				const countyData = (await response.json()) as CountyGeoJSONData;

				if (!countyData || !countyData.features) {
					throw new Error("County GeoJSON data is invalid or empty");
				}

				const features = countyData.features.filter(
					(feature: CountyFeature) =>
						feature.properties.ste_name &&
						feature.properties.ste_name.includes(stateName)
				);

				if (features.length === 0) {
					throw new Error(`No county data found for ${stateName}`);
				}

				const featureCollection: FeatureCollection = {
					type: "FeatureCollection",
					features: features,
				};

				const bounds = new L.LatLngBounds([]);
				features.forEach((feature) => {
					if (feature.geometry.type === "Polygon") {
						feature.geometry.coordinates[0].forEach((coord) => {
							bounds.extend([coord[1], coord[0]]); // [lat, lng]
						});
					} else if (feature.geometry.type === "MultiPolygon") {
						feature.geometry.coordinates.forEach((polygon) => {
							polygon[0].forEach((coord) => {
								bounds.extend([coord[1], coord[0]]);
							});
						});
					}
				});

				// Increase padding to 0.25 (25%) to give more space for tooltips at edges
				const paddedBounds = bounds.pad(0.25);
				setMapBounds(paddedBounds);

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading county data:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName]);

	// Style function for counties based on active voters data
	const getFeatureStyle = (feature?: Feature) => {
		if (!feature || !colorScale) {
			return {
				fillColor: "#f5f5f5",
				weight: 1,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.7,
			};
		}

		const countyFeature = feature as CountyFeature;
		const countyName = (
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County"
		)
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim();

		let countyData = dataLookup.get(countyName);
		if (!countyData) {
			const withoutCounty = countyName.replace(/\s+county$/, "");
			countyData = dataLookup.get(withoutCounty);
		}
		if (!countyData) {
			const withCounty = countyName.includes("county")
				? countyName
				: `${countyName} county`;
			countyData = dataLookup.get(withCounty);
		}

		const activePercentage = countyData?.activePercentage || 0;
		const fillColor = colorScale(activePercentage);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#fff",
			dashArray: "",
			fillOpacity: 0.7,
		};
	};

	// Event handlers for GeoJSON features — with robust hover clearing
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const countyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const normalizedName = countyName.toLowerCase().replace(/\s+/g, " ").trim();
		let countyData = dataLookup.get(normalizedName);
		if (!countyData) {
			const withoutCounty = normalizedName.replace(/\s+county$/, "");
			countyData = dataLookup.get(withoutCounty);
		}
		if (!countyData) {
			const withCounty = normalizedName.includes("county")
				? normalizedName
				: `${normalizedName} county`;
			countyData = dataLookup.get(withCounty);
		}

		const activeVoters = countyData?.activeVoters || 0;
		const totalVoters = countyData?.totalVoters || 0;
		const activePercentage = countyData?.activePercentage || 0;

		const tooltipContent = `
      <div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${countyName}</div>
      <div style="font-size: 13px;">Active Voters: <strong>${activeVoters.toLocaleString()}</strong></div>
      <div style="font-size: 13px;">Total Voters: <strong>${totalVoters.toLocaleString()}</strong></div>
      <div style="font-size: 13px;">Active Percentage: <strong>${activePercentage.toFixed(
			1
		)}%</strong></div>
      ${activePercentage === 0
				? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">No data available</div>'
				: ""
			}
    `;

		// Bind tooltip directly - no need to check mapRef.current
		bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

		layer.on({
			mouseover: (e: any) => {
				const targetLayer = e.target as L.Path;
				hoveredRef.current = targetLayer;
				targetLayer.setStyle({
					weight: 3,
					color: "#333",
					dashArray: "",
					fillOpacity: 0.8,
				});
				if ((targetLayer as any).bringToFront) {
					(targetLayer as any).bringToFront();
				}
				// Ensure tooltip opens
				if (!targetLayer.isTooltipOpen()) {
					targetLayer.openTooltip();
				}
			},
			mouseout: (e: any) => {
				geoRef.current?.resetStyle(e.target as any);
				if (hoveredRef.current === e.target) hoveredRef.current = null;
				// Ensure tooltip closes
				try {
					(e.target as L.Path).closeTooltip();
				} catch {
					/* ignore */
				}
			},
		});
	};

	// Clear hover when cursor leaves the map container (covers dialog-open cases)
	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const node = map.getContainer();
		const handleLeave = () => clearHover();

		node.addEventListener("mouseleave", handleLeave);

		return () => {
			node.removeEventListener("mouseleave", handleLeave);
		};
	}, [geoData]);

	// Allow parent to force-clear when a dialog closes
	useEffect(() => {
		clearHover();
	}, [resetHoverKey]); if (loading) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1">Loading map data...</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="error">
					<Typography variant="body2">
						Failed to load county boundaries: {error}
					</Typography>
				</Alert>
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No active voters choropleth data available for this state.
				</Typography>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1">No geographic data available...</Typography>
			</Paper>
		);
	}

	const maxPercentage = Math.max(...data.map((d) => d.activePercentage));
	const minPercentage = Math.min(...data.map((d) => d.activePercentage));
	const avgPercentage =
		data.reduce((sum, d) => sum + d.activePercentage, 0) / data.length;

	return (
		<Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={1}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Active Voters Distribution - {stateName}
				</Typography>
				<Box display="flex" gap={1} flexWrap="wrap">
					<Chip label={`Average: ${avgPercentage.toFixed(1)}%`} size="small" />
					<Chip
						label={`Range: ${minPercentage.toFixed(1)}% – ${maxPercentage.toFixed(1)}%`}
						size="small"
					/>
				</Box>
			</Box>

			{/* Map Container */}
			<Box
				sx={{
					flex: 1,
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					overflow: "hidden",
					minHeight: 0,
					mb: 1,
				}}
			>
				<MapContainer
					ref={(m) => { mapRef.current = m; }}
					bounds={mapBounds || undefined}
					zoom={8}
					zoomSnap={0.1}
					minZoom={6}
					maxZoom={12}
					maxBounds={mapBounds || undefined}
					maxBoundsViscosity={1.0}
					style={{ height: "100%", width: "100%", borderRadius: "8px" }}
					scrollWheelZoom={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
					/>
					<GeoJSON
						ref={geoRef as any}
						data={geoData}
						style={getFeatureStyle}
						onEachFeature={onEachFeature}
					/>
				</MapContainer>
			</Box>

			{/* Color Legend */}
			<Box>
				<Typography variant="body2" gutterBottom fontWeight={600} fontSize="0.85rem">
					Color Scale (Active Voter %)
				</Typography>
				<Box display="flex" alignItems="center" gap={0.5}>
					<Typography variant="caption" sx={{ minWidth: 45, fontSize: "0.75rem" }}>
						{minPercentage.toFixed(1)}%
					</Typography>
					<Box
						display="flex"
						height={24}
						flex={1}
						border="1px solid #e0e0e0"
						borderRadius={1}
						overflow="hidden"
					>
						{COLOR_PALETTE.map((color, index) => (
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
					<Typography variant="caption" sx={{ minWidth: 45, textAlign: "right", fontSize: "0.75rem" }}>
						{maxPercentage.toFixed(1)}%
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary" display="block" mt={0.5} fontSize="0.7rem">
					Interactive choropleth map showing active voter distribution across
					counties. Hover over counties for detailed information.
				</Typography>
			</Box>
		</Paper>
	);
};

export default ActiveVotersChoroplethMap;
