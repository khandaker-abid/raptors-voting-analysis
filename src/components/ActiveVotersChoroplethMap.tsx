import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Alert, useTheme } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ActiveVotersRow } from "../data/types";
import { bindResponsiveTooltip } from "../utils/leafletTooltipHelper";
import { createCountyLookupMap, normalizeCountyName } from "../utils/countyNameNormalizer";

interface ActiveVotersChoroplethMapProps {
	stateName: string;
	data: ActiveVotersRow[];
	/** Change value to force-clear hover */
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

const ActiveVotersChoroplethMap: React.FC<ActiveVotersChoroplethMapProps> = ({
	stateName,
	data,
	resetHoverKey,
}) => {
	const theme = useTheme();
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
	const mapRef = useRef<L.Map | null>(null);
	const geoRef = useRef<L.GeoJSON | null>(null);
	const hoveredRef = useRef<L.Path | null>(null);

	const clearHover = () => {
		if (hoveredRef.current) {
			try {
				geoRef.current?.resetStyle(hoveredRef.current as any);
				if ((hoveredRef.current as any).closeTooltip) {
					(hoveredRef.current as any).closeTooltip();
				}
			} catch {
				// ignore reset/tooltip errors from Leaflet during rapid hover changes
			}
			hoveredRef.current = null;
		}
	};

	const COLOR_PALETTE = useMemo(() => {
		return [
			theme.palette.grey[200],
			theme.palette.grey[300],
			theme.palette.grey[400],
			theme.palette.grey[500],
			theme.palette.grey[600],
			theme.palette.grey[700],
			theme.palette.grey[800],
		];
	}, [theme]);

	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const percentages = data.map((d) => d.activePercentage);
		const maxPercentage = Math.max(...percentages);
		const minPercentage = Math.min(...percentages);

		return (value: number) => {
			if (value === 0) return theme.palette.grey[100]; // Special color for no data
			if (maxPercentage === minPercentage)
				return COLOR_PALETTE[COLOR_PALETTE.length - 1];
			const ratio = (value - minPercentage) / (maxPercentage - minPercentage || 1);
			const index = Math.floor(ratio * (COLOR_PALETTE.length - 1));
			return COLOR_PALETTE[Math.min(index, COLOR_PALETTE.length - 1)];
		};
	}, [data, COLOR_PALETTE, theme]);

	const dataLookup = useMemo(() => {
		return createCountyLookupMap(
			data,
			(item) => item.geographicUnit,
			(item) => item
		);
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

				const countyData = (await response.json()) as FeatureCollection;
				if (!countyData || !countyData.features) {
					throw new Error("County GeoJSON data is invalid or empty");
				}

				const features = countyData.features.filter(
					(feature) =>
						(feature.properties as any)?.ste_name &&
						(feature.properties as any).ste_name.includes(stateName)
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
						(feature.geometry as any).coordinates[0].forEach((coord: any) => {
							bounds.extend([coord[1], coord[0]]); // [lat, lng]
						});
					} else if (feature.geometry.type === "MultiPolygon") {
						(feature.geometry as any).coordinates.forEach((polygon: any) => {
							polygon[0].forEach((coord: any) => {
								bounds.extend([coord[1], coord[0]]);
							});
						});
					}
				});

				// Add 25% padding for tooltip space at edges
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

	const getFeatureStyle = (feature?: Feature) => {
		if (!feature || !colorScale) {
			return {
				fillColor: theme.palette.grey[100],
				weight: 1,
				opacity: 1,
				color: theme.palette.grey[400],
				dashArray: "",
				fillOpacity: 0.9,
			};
		}

		const countyFeature = feature as CountyFeature;
		const countyName = countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const normalizedName = normalizeCountyName(countyName);
		const countyData = dataLookup.get(normalizedName);

		const activePercentage = countyData?.activePercentage || 0;
		const fillColor = colorScale(activePercentage);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#fff",
			dashArray: "",
			fillOpacity: 0.9,
		};
	};

	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const countyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const normalizedName = normalizeCountyName(countyName);
		const countyData = dataLookup.get(normalizedName);

		const activeVoters = countyData?.activeVoters || 0;
		const totalVoters = countyData?.totalVoters || 0;
		const activePercentage = countyData?.activePercentage || 0;

		const tooltipContent = `
      	<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">${countyName}</div>
      	<div style="font-size: 13px;">Active Voters: <strong>${activeVoters.toLocaleString()}</strong></div>
      	<div style="font-size: 13px;">Total Voters: <strong>${totalVoters.toLocaleString()}</strong></div>
      	<div style="font-size: 13px;">Active Percentage: <strong>${activePercentage.toFixed(1)}%</strong></div>
      	${activePercentage === 0
				? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">No data available</div>'
				: ""
			}
		`;

		bindResponsiveTooltip(layer, tooltipContent, mapRef.current);

		layer.on({
			mouseover: (e: any) => {
				const targetLayer = e.target as L.Path;
				hoveredRef.current = targetLayer;
				targetLayer.setStyle({
					weight: 3,
					color: theme.palette.primary.dark,
					dashArray: "",
					fillOpacity: 1.0,
				});
				if ((targetLayer as any).bringToFront) {
					(targetLayer as any).bringToFront();
				}
				if (!targetLayer.isTooltipOpen()) {
					targetLayer.openTooltip();
				}
			},
			mouseout: (e: any) => {
				geoRef.current?.resetStyle(e.target as any);
				if (hoveredRef.current === e.target) hoveredRef.current = null;
				try {
					(e.target as L.Path).closeTooltip();
				} catch {
					// ignore tooltip close errors
				}
			},
		});
	};

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

	useEffect(() => {
		clearHover();
	}, [resetHoverKey]);

	if (loading) {
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

	return (
		<Paper sx={{ p: 0.5, px: 2, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box mb={1}>
				<Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: "0.95rem" }}>
					Active Voters Distribution
				</Typography>
			</Box>

			<Box
				sx={{
					flex: 1,
					border: `1px solid ${theme.palette.grey[300]}`,
					borderRadius: 2,
					overflow: "hidden",
					minHeight: 0,
					mb: 0.5,
					padding: 0,
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

			<Box>
				<Typography variant="body2" gutterBottom fontWeight={600} fontSize="0.85rem">
					Color Scale (Active Voter %)
				</Typography>
				<Box>
					<Box
						display="flex"
						height={24}
						border={`1px solid ${theme.palette.grey[300]}`}
						borderRadius={1}
						overflow="hidden"
						mb={0.5}
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

					<Box sx={{ position: "relative", height: "1.5rem" }}>
						{Array.from({ length: COLOR_PALETTE.length + 1 }, (_, i) => {
							const ratio = i / COLOR_PALETTE.length;
							const value = minPercentage === maxPercentage ? minPercentage : minPercentage + ratio * (maxPercentage - minPercentage);
							const percentPosition = ratio * 100;
							return (
								<Typography
									key={i}
									variant="caption"
									sx={{
										position: "absolute",
										left: `${percentPosition}%`,
										transform: "translateX(-50%)",
										fontSize: "0.7rem",
										color: "text.secondary",
										fontWeight: 500,
										whiteSpace: "nowrap",
									}}
								>
									{value.toFixed(1)}%
								</Typography>
							);
						})}
					</Box>
				</Box>
				{(stateName === "Rhode Island" || stateName === "Vermont" || stateName === "Connecticut" || stateName === "Massachusetts") && (
					<Typography variant="caption" color="primary.main" display="block" mt={0.5} fontSize="0.7rem" fontStyle="italic">
						Note: {stateName} reports data at the town level. Values shown have been aggregated to county level for map display consistency.
					</Typography>
				)}
			</Box>
		</Paper>
	);
};

export default ActiveVotersChoroplethMap;
