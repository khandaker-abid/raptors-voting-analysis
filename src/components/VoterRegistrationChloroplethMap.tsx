import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Paper, Typography, Box, Chip, Alert } from "@mui/material";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { StateVoterRegistrationData } from "../data/stateVoterRegistrationData";
import { getStateVoterRegistrationData } from "../data/stateVoterRegistrationData";

interface VoterRegistrationChloroplethMapProps {
	stateName: string;
	data: Array<{
		county: string;
		E1a: number;
		lat?: number;
		lng?: number;
	}>;
	/** Optional: change value (e.g., flip 0/1) when your dialog closes to force-clear hover */
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

const VoterRegistrationChloroplethMap: React.FC<
	VoterRegistrationChloroplethMapProps
> = ({ stateName, resetHoverKey }) => {
	const [data, setData] = useState<StateVoterRegistrationData[]>([]);
	const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

	// Refs to manage hover state and reset styles reliably
	const mapRef = useRef<L.Map | null>(null);
	const geoRef = useRef<L.GeoJSON | null>(null);
	const hoveredRef = useRef<L.Path | null>(null);

	const clearHover = () => {
		if (hoveredRef.current) {
			// resetStyle needs the same layer reference used by GeoJSON
			try {
				geoRef.current?.resetStyle(hoveredRef.current as any);
			} catch {
				// no-op if layer isn't part of current GeoJSON
			}
			hoveredRef.current = null;
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await getStateVoterRegistrationData(stateName);
				setData(Array.isArray(result) ? result : []);
			} catch (error) {
				console.error("Error fetching voting equipment data:", error);
			}
		};
		fetchData();
	}, [stateName]);

	// Calculate color scale for registered voters
	const colorScale = useMemo(() => {
		if (!data || data.length === 0) return null;

		const values = data.map((d) => d.registeredVoterCount);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);

		const range = [
			"#e3f2fd",
			"#bbdefb",
			"#90caf9",
			"#64b5f6",
			"#42a5f5",
			"#2196f3",
			"#1976d2",
		];

		return (value: number) => {
			if (value === 0) return "#f5f5f5";
			const ratio = (value - minValue) / (maxValue - minValue || 1);
			const index = Math.floor(ratio * (range.length - 1));
			return range[Math.min(index, range.length - 1)];
		};
	}, [data]);

	// Create a data lookup map for efficient county data retrieval
	const dataLookup = useMemo(() => {
		const lookup = new Map<string, number>();
		data.forEach((item) => {
			const normalizedCounty = item.regionName
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim();
			lookup.set(normalizedCounty, item.registeredVoterCount);

			const withoutCounty = normalizedCounty.replace(/\s+county$/, "");
			if (withoutCounty !== normalizedCounty) {
				lookup.set(withoutCounty, item.registeredVoterCount);
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
				const response = await fetch(
					"/georef-united-states-of-america-county.geojson"
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch county data: ${response.statusText}`);
				}

				const countyData = (await response.json()) as CountyGeoJSONData;

				if (!countyData || !countyData.features) {
					throw new Error("County GeoJSON data is invalid or empty");
				}

				// Filter counties by state name
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

				// Calculate bounds for the map
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

				const paddedBounds = bounds.pad(0.1);
				setMapBounds(paddedBounds);

				setGeoData(featureCollection);
				setLoading(false);
			} catch (err) {
				console.error("Error loading choropleth map data:", err);
				setError(err instanceof Error ? err.message : "Failed to load map data");
				setLoading(false);
			}
		};

		loadMapData();
	}, [stateName]);

	// Style function for counties based on registered voter data
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

		let voterCount = dataLookup.get(countyName);
		if (voterCount === undefined) {
			const withoutCounty = countyName.replace(/\s+county$/, "");
			voterCount = dataLookup.get(withoutCounty);
		}
		if (voterCount === undefined) {
			const withCounty = countyName.includes("county")
				? countyName
				: `${countyName} county`;
			voterCount = dataLookup.get(withCounty);
		}
		voterCount = voterCount || 0;

		const fillColor = colorScale(voterCount);

		return {
			fillColor,
			weight: 1,
			opacity: 1,
			color: "#ffffff",
			dashArray: "",
			fillOpacity: 0.8,
		};
	};

	// Event handlers for county features — now with robust hover reset
	const onEachFeature = (feature: Feature, layer: L.Layer) => {
		const countyFeature = feature as CountyFeature;
		const displayCountyName =
			countyFeature.properties.coty_name_long?.[0] ||
			countyFeature.properties.coty_name?.[0] ||
			"Unknown County";

		const normalizedCountyName = displayCountyName
			.toLowerCase()
			.replace(/\s+/g, " ")
			.trim()
			.split(" ")
			.slice(0, -1)
			.join(" ");

		const voterCount = dataLookup.get(normalizedCountyName) || 0;

		const tooltipContent = `
      <div style="font-weight: bold; margin-bottom: 4px;">${displayCountyName}</div>
      <div>Registered Voters: <span style="color: #2196f3; font-weight: bold;">${voterCount.toLocaleString()}</span></div>
      ${voterCount === 0
				? '<div style="color: #ff9800; font-size: 11px; margin-top: 2px;">No data available</div>'
				: ""
			}
    `;

		(layer as any).bindTooltip(tooltipContent, {
			permanent: false,
			direction: "center",
			className: "custom-tooltip",
		});

		layer.on({
			mouseover: (e: any) => {
				const targetLayer = e.target as L.Path;
				hoveredRef.current = targetLayer;
				targetLayer.setStyle({
					weight: 3,
					color: "#333333",
					dashArray: "",
					fillOpacity: 1.0,
				});
				if ((targetLayer as any).bringToFront) {
					(targetLayer as any).bringToFront();
				}
			},
			mouseout: (e: any) => {
				// Reset just this layer's style
				geoRef.current?.resetStyle(e.target as any);
				if (hoveredRef.current === e.target) hoveredRef.current = null;
			},
			click: () => {
				// Opening your dialog typically prevents mouseout from firing; clear highlight proactively
				clearHover();
			},
		});
	};

	// Clear hover when the cursor leaves the map container (e.g., a dialog pops up)
	useEffect(() => {
		const node = mapRef.current?.getContainer();
		if (!node) return;
		const handler = () => clearHover();
		node.addEventListener("mouseleave", handler);
		return () => node.removeEventListener("mouseleave", handler);
	}, [mapRef.current]);

	// Optional: allow parent to force-clear when the dialog closes
	useEffect(() => {
		clearHover();
	}, [resetHoverKey]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No voter registration choropleth data available for this state.
				</Typography>
			</Paper>
		);
	}

	if (loading) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography>Loading choropleth map data...</Typography>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="error">{error}</Alert>
			</Paper>
		);
	}

	if (!geoData) {
		return (
			<Paper sx={{ p: 3 }}>
				<Alert severity="info">No map data available</Alert>
			</Paper>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.registeredVoterCount));
	const minValue = Math.min(...data.map((d) => d.registeredVoterCount));
	const totalVotes = data.reduce((sum, d) => sum + d.registeredVoterCount, 0);

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Registered Voters Distribution - {stateName}
				</Typography>
				<Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
					<Chip label={`${data.length} Counties/Towns`} size="small" color="primary" />
					<Chip label={`Total: ${totalVotes.toLocaleString()} voters`} size="small" />
					<Chip
						label={`Range: ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}`}
						size="small"
					/>
				</Box>
			</Box>

			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					border: "1px solid #e0e0e0",
					borderRadius: 2,
					padding: 0,
					backgroundColor: "#fafafa",
					height: 400,
					width: "100%",
					margin: "0 auto",
					mb: 3,
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
				<Typography variant="subtitle2" gutterBottom fontWeight={600}>
					Color Scale (Total Registered Voters)
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
						overflow="hidden"
					>
						{colorScale &&
							[
								"#e3f2fd",
								"#bbdefb",
								"#90caf9",
								"#64b5f6",
								"#42a5f5",
								"#2196f3",
								"#1976d2",
							].map((color, index) => (
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
					<Typography variant="caption" sx={{ minWidth: 50, textAlign: "right" }}>
						{maxValue}
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary" display="block" mt={1}>
					Interactive choropleth map showing voter registration distribution across
					counties. Hover over counties for detailed information.
				</Typography>
			</Box>
		</Paper>
	);
};

export default VoterRegistrationChloroplethMap;
