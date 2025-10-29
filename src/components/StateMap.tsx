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
import theme from "../theme";

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

// Detail states that have county data
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

	// Refs to manage highlight + map container events
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
					// Close tooltip for each layer
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
					// Load county data from /public
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
					// Load state boundary data from /public
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

				// Compute padded bounds for pan constraints
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

		// Cleanup on state swap/unmount
		return () => clearHover(true);
	}, [stateName, isDetailState]);

	// Add robust "mouseleave" handling on the map container.
	// Attach after the map mounts and whenever geoData changes
	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const container = map.getContainer();
		const handleLeave = () => {
			// Only clear if dialog is not open
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

	// Clear all highlights and close all tooltips when dialog state changes
	useEffect(() => {
		// Always clear when dialog opens OR closes
		clearHover(true);
	}, [selectedRegion]);

	// Style function for map features
	const getFeatureStyle = (feature?: Feature) => {
		if (!feature) return {};

		if (isDetailState && detailStates.includes(stateName)) {
			// County styling for detail states
			return {
				fillColor: theme.palette.primary.main,
				weight: 1,
				opacity: 1,
				color: theme.palette.primary.main,
				dashArray: "",
				fillOpacity: 0.3,
				className: "no-outline", // Remove focus outline
			};
		} else {
			// State boundary styling for non-detail states
			return {
				fillColor: "#e0e0e0",
				weight: 2,
				opacity: 1,
				color: "#bdbdbd",
				dashArray: "",
				fillOpacity: 0.2,
				className: "no-outline", // Remove focus outline
			};
		}
	};

	// Event handlers for map features
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		if (isDetailState && detailStates.includes(stateName)) {
			// County feature handling
			const countyFeature = feature as CountyFeature;
			const countyName =
				countyFeature.properties.coty_name_long?.[0] ||
				countyFeature.properties.coty_name?.[0] ||
				"Unknown County";

			layer.bindTooltip(countyName, {
				permanent: false,
				direction: "center",
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e: any) => {
					// Don't highlight if dialog is open
					if (selectedRegion) return;

					hoveredLayerRef.current = e.target;
					lastHoveredFeatureRef.current = feature;
					e.target.setStyle({
						weight: 2,
						color: "#0d47a1",
						dashArray: "",
						fillOpacity: 0.6,
					});
					e.target.bringToFront();
					// Ensure tooltip opens
					if (!e.target.isTooltipOpen()) {
						e.target.openTooltip();
					}
				},
				mouseout: (e: any) => {
					// Don't process if dialog is open
					if (selectedRegion) return;

					clearHover();
					// Ensure tooltip closes
					try {
						e.target.closeTooltip();
					} catch {
						/* ignore */
					}
				},
				click: (e: any) => {
					// Immediately reset the clicked layer's style to remove hover highlight
					const gj = geoJsonRef.current;
					if (gj && e.target) {
						gj.resetStyle(e.target);
					}
					// Close tooltip on the clicked element
					try {
						e.target.closeTooltip();
					} catch {
						/* ignore */
					}
					// Clear all hover state
					clearHover(true);
					// Clear refs immediately
					hoveredLayerRef.current = null;
					lastHoveredFeatureRef.current = undefined;
					// Open dialog
					setSelectedRegion(countyName);
				},
			});
		} else {
			// State feature handling
			layer.bindTooltip(stateName, {
				permanent: false,
				direction: "center",
				className: "custom-tooltip",
			});

			layer.on({
				mouseover: (e: any) => {
					// Don't highlight if dialog is open
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
					// Ensure tooltip opens
					if (!e.target.isTooltipOpen()) {
						e.target.openTooltip();
					}
				},
				mouseout: (e: any) => {
					// Don't process if dialog is open
					if (selectedRegion) return;

					clearHover();
					// Ensure tooltip closes
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
		// Immediately and forcefully close all tooltips and reset all styles
		const gj = geoJsonRef.current;
		const map = mapRef.current;

		if (gj) {
			gj.eachLayer((layer: any) => {
				try {
					// Force close any open tooltip first
					if (layer.closeTooltip) {
						layer.closeTooltip();
					}
					// Make sure tooltip is really closed
					if (layer.isTooltipOpen && layer.isTooltipOpen()) {
						layer.closeTooltip();
					}
					// Reset style to default - this should remove the highlight
					gj.resetStyle(layer);
					// Force the layer to re-apply its original style
					if (layer.setStyle) {
						const defaultStyle = getFeatureStyle(layer.feature);
						layer.setStyle(defaultStyle);
					}
					// Force Leaflet to redraw this specific layer
					if (layer._updatePath) {
						layer._updatePath();
					}
					// Alternative: force redraw by removing and re-adding to map
					if (layer.redraw) {
						layer.redraw();
					}
				} catch (e) {
					console.warn("Error resetting layer style:", e);
				}
			});

			// Force the entire GeoJSON layer to redraw
			if (map) {
				// Invalidate the map size to force a complete redraw
				map.invalidateSize({ pan: false });
			}
		}

		// Clear refs
		hoveredLayerRef.current = null;
		lastHoveredFeatureRef.current = undefined;
		// Close the dialog
		setSelectedRegion(null);
	};

	return (
		<Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
			<Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
				{stateName} Geographic View
			</Typography>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 0,
					backgroundColor: "#fafafa",
					height: 500,
					width: "100%",
					margin: "0 auto",
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
					style={{ height: "100%", width: "100%", borderRadius: "8px" }}
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
							geographicUnitName={selectedRegion.split(" ").slice(0, -1).join(" ")}
						/>
					)}
				</DialogContent>
			</Dialog>
		</Paper>
	);
};

export default StateMap;
