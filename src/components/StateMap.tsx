/**
 * Interactive state map component using Leaflet.
 * Displays county/jurisdiction boundaries with clickable regions.
 * Supports choropleth overlays and data-driven styling.
 */

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import {
	Box,
	Typography,
	Paper,
	Alert,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import RegionRegisteredVotersTable from "../tables/RegionRegisteredVotersTable";

type CountyFeature = Feature<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;
type StateFeature = Feature<Geometry, { name: string }>;
type CountyGeoJSONData = FeatureCollection<
	Geometry,
	{
		ste_name: string[];
		coty_name: string[];
		coty_name_long: string[];
	}
>;
type StateGeoJSONData = FeatureCollection<Geometry, { name: string }>;

interface StateMapProps {
	stateName: string;
	center: [number, number];
	isDetailState: boolean;
}

const detailStates = ["Rhode Island", "Maryland", "Arkansas"];

const StateMap: React.FC<StateMapProps> = ({
	stateName,
	center,
	isDetailState,
}) => {
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
	const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

	const mapRef = useRef<L.Map | null>(null);
	const geoJsonRef = useRef<L.GeoJSON<any> | null>(null);
	const hoveredLayerRef = useRef<L.Path | null>(null);
	const lastHoveredFeatureRef = useRef<Feature | undefined>(undefined);

	/**
	 * Robust de-highlighter.
	 * - If we know the hovered layer, reset just that.
	 * - If we don't (or caller asks), reset ALL layers.
	 * - Also closes all tooltips.
	 */
	const clearHover = (resetAll = false) => {
		const gj = geoJsonRef.current;
		const hovered = hoveredLayerRef.current as any | null;

		if (!gj) {
			hoveredLayerRef.current = null;
			lastHoveredFeatureRef.current = undefined;
			return;
		}

		if (resetAll || !hovered) {
			gj.getLayers().forEach((l) => {
				try {
					gj.resetStyle(l as any);
					if ((l as any).closeTooltip) {
						(l as any).closeTooltip();
					}
				} catch {
					/* ignore */
				}
			});
		} else {
			try {
				gj.resetStyle(hovered);
				if (hovered.closeTooltip) {
					hovered.closeTooltip();
				}
			} catch {
				/* ignore */
			}
		}

		hoveredLayerRef.current = null;
		lastHoveredFeatureRef.current = undefined;
	};

	useEffect(() => {
		const loadMapData = async () => {
			if (!stateName) return;

			setLoading(true);
			setError(null);
			clearHover(true);

			try {
				let features: (CountyFeature | StateFeature)[];

				if (isDetailState && detailStates.includes(stateName)) {
					const response = await fetch(
						"/georef-united-states-of-america-county.geojson"
					);
					if (!response.ok) {
						throw new Error(`Failed to fetch county data: ${response.statusText}`);
					}
					const countyData = (await response.json()) as CountyGeoJSONData;
					if (!countyData?.features) {
						throw new Error("County GeoJSON data is invalid or empty");
					}
					features = countyData.features.filter(
						(feature: CountyFeature) =>
							feature.properties.ste_name &&
							feature.properties.ste_name.includes(stateName)
					);
				} else {
					const response = await fetch("/us-state-boundaries.geojson");
					if (!response.ok) {
						throw new Error(`Failed to fetch state data: ${response.statusText}`);
					}
					const stateData = (await response.json()) as StateGeoJSONData;
					if (!stateData?.features) {
						throw new Error("State GeoJSON data is invalid or empty");
					}
					features = stateData.features.filter(
						(feature: StateFeature) => feature.properties.name === stateName
					);
				}

				if (features.length === 0) {
					throw new Error(
						`No ${isDetailState ? "county" : "state"} data found for ${stateName}`
					);
				}

				const featureCollection: FeatureCollection = {
					type: "FeatureCollection",
					features,
				};

				const bounds = new L.LatLngBounds([]);
				features.forEach((feature) => {
					if (feature.geometry.type === "Polygon") {
						feature.geometry.coordinates[0].forEach((coord) => {
							bounds.extend([coord[1], coord[0]]);
						});
					} else if (feature.geometry.type === "MultiPolygon") {
						feature.geometry.coordinates.forEach((polygon) => {
							polygon[0].forEach((coord) => {
								bounds.extend([coord[1], coord[0]]);
							});
						});
					}
				});
				setMapBounds(bounds.pad(0.1));

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading map data:", err);
				setError(err instanceof Error ? err.message : "Failed to load map data");
				setLoading(false);
			}
		};

		loadMapData();

		return () => clearHover(true);
	}, [stateName, isDetailState]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const container = map.getContainer();
		const handleLeave = () => {
			if (!selectedRegion) {
				clearHover(true);
			}
		};

		container.addEventListener("mouseleave", handleLeave);
		container.addEventListener("touchend", handleLeave);
		container.addEventListener("pointerleave", handleLeave);

		return () => {
			container.removeEventListener("mouseleave", handleLeave);
			container.removeEventListener("touchend", handleLeave);
			container.removeEventListener("pointerleave", handleLeave);
		};
	}, [geoData, selectedRegion]);

	useEffect(() => {
		clearHover(true);
	}, [selectedRegion]);

	const getFeatureStyle = (feature?: Feature) => {
		if (!feature) return {};

		if (isDetailState && detailStates.includes(stateName)) {
			return {
				fillColor: "#757575",
				weight: 1,
				opacity: 1,
				color: "#424242",
				dashArray: "",
				fillOpacity: 0.3,
				className: "no-outline",
			};
		} else {
			return {
				fillColor: "#e0e0e0",
				weight: 2,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.2,
				className: "no-outline",
			};
		}
	};

	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		if (isDetailState && detailStates.includes(stateName)) {
			const countyFeature = feature as CountyFeature;
			const countyName =
				countyFeature.properties.coty_name_long?.[0] ||
				countyFeature.properties.coty_name?.[0] ||
				"Unknown County";

			layer.bindTooltip(countyName, {
				permanent: false,
				direction: "top",
				offset: [0, -10],
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e: any) => {
					if (selectedRegion) return;

					hoveredLayerRef.current = e.target;
					lastHoveredFeatureRef.current = feature;
					e.target.setStyle({
						weight: 3,
						color: "#424242",
						dashArray: "",
						fillOpacity: 0.5,
					});
						e.target.bringToFront();
						if (!e.target.isTooltipOpen()) {
						e.target.openTooltip();
					}
				},
					mouseout: (e: any) => {
						if (selectedRegion) return;					clearHover();
					try {
						e.target.closeTooltip();
					} catch {
						/* ignore */
					}
				},
				click: (e: any) => {
					const gj = geoJsonRef.current;
					if (gj && e.target) {
						gj.resetStyle(e.target);
					}
					try {
						e.target.closeTooltip();
					} catch {
						/* ignore */
					}
					clearHover(true);
					hoveredLayerRef.current = null;
					lastHoveredFeatureRef.current = undefined;
					setSelectedRegion(countyName);
				},
			});
		} else {
			const tooltipContent = `${stateName} - EAVS data available in other tabs`;
			layer.bindTooltip(tooltipContent, {
				permanent: false,
				direction: "top",
				offset: [0, -10],
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e: any) => {
					if (selectedRegion) return;

					hoveredLayerRef.current = e.target;
					lastHoveredFeatureRef.current = feature;
					e.target.setStyle({
						weight: 3,
						color: "#757575",
						dashArray: "",
						fillOpacity: 0.4,
					});
					e.target.bringToFront();
					if (!e.target.isTooltipOpen()) {
						e.target.openTooltip();
					}
				},
				mouseout: (e: any) => {
					if (selectedRegion) return;

					clearHover();
					try {
						e.target.closeTooltip();
					} catch {
						/* ignore */
					}
				},
			});
		}
	};

	if (!stateName) {
		return <Alert severity="warning">No state selected</Alert>;
	}

	if (loading) {
		return (
			<Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
				<Typography>
					Loading {isDetailState ? "county" : "state"} map data...
				</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper elevation={2} sx={{ p: 3 }}>
				<Alert severity="error">{error}</Alert>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper elevation={2} sx={{ p: 3 }}>
				<Alert severity="info">No map data available</Alert>
			</Paper>
		);
	}

	const handleClose = () => {
		const gj = geoJsonRef.current;
		const map = mapRef.current;

		if (gj) {
			gj.eachLayer((layer: any) => {
				try {
					if (layer.closeTooltip) {
						layer.closeTooltip();
					}
					if (layer.isTooltipOpen && layer.isTooltipOpen()) {
						layer.closeTooltip();
					}
					gj.resetStyle(layer);
					if (layer.setStyle) {
						const defaultStyle = getFeatureStyle(layer.feature);
						layer.setStyle(defaultStyle);
					}
					if (layer._updatePath) {
						layer._updatePath();
					}
					if (layer.redraw) {
						layer.redraw();
					}
				} catch (e) {
					console.warn("Error resetting layer style:", e);
				}
			});

			if (map) {
				map.invalidateSize({ pan: false });
			}
		}

		hoveredLayerRef.current = null;
		lastHoveredFeatureRef.current = undefined;
		setSelectedRegion(null);
	};

	return (
		<Paper elevation={2} sx={{
			p: 0,
			textAlign: "center",
			height: "100%",
			width: "100%",
			display: "flex",
			flexDirection: "column",
			flex: 1,
		}}>
			<Typography variant="h6" sx={{ mb: 0, pt: 0.5, fontSize: "1rem", fontWeight: 600, flexShrink: 0 }}>
				{stateName} {isDetailState && detailStates.includes(stateName) ? "- Geographic Boundaries" : "- State Boundary"}
			</Typography>
			{isDetailState && detailStates.includes(stateName) && (
				<Typography variant="body2" color="text.secondary" sx={{ mb: 0, pb: 0.5, fontSize: "0.8rem", flexShrink: 0 }}>
					Click on any county to view registered voters
				</Typography>
			)}
			<Box
				sx={{
					position: "relative",
					border: "none",
					borderRadius: 0,
					backgroundColor: "#fafafa",
					flex: 1,
					width: "100%",
					minHeight: 0,
					overflow: "hidden",
				}}
			>
				<MapContainer
					ref={mapRef}
					center={[center[1], center[0]]} // Leaflet uses [lat, lng]
					zoom={7}
					minZoom={6}
					maxZoom={12}
					maxBounds={mapBounds || undefined}
					maxBoundsViscosity={1.0}
					style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", borderRadius: "0px" }}
					scrollWheelZoom={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
					/>
					<GeoJSON
						ref={geoJsonRef as any}
						data={geoData}
						style={getFeatureStyle}
						onEachFeature={onEachFeature}
					/>
				</MapContainer>
			</Box>

			<Dialog
				open={!!selectedRegion}
				onClose={handleClose}
				maxWidth="lg"
				fullWidth={false}
				PaperProps={{
					sx: {
						width: "900px",
						maxHeight: "900px",
						m: "auto",
					},
				}}
			>
				<DialogTitle
					sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
				>
					All Registered Voters in {selectedRegion || "All Counties"}
					<IconButton onClick={handleClose}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent sx={{ p: 0, overflowY: "auto" }}>
					{selectedRegion && (
						<RegionRegisteredVotersTable
							stateName={stateName}
							geographicUnitName={selectedRegion.split(" ").slice(0, -1).join(" ")}
						/>
					)}
				</DialogContent>
			</Dialog>
		</Paper>
	);
};

export default StateMap;
