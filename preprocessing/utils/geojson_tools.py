"""
GeoJSON processing utilities
"""
import json
import logging
from typing import Dict, List, Tuple, Optional
from shapely.geometry import shape, Point, Polygon, MultiPolygon, mapping
from shapely.ops import unary_union
import geopandas as gpd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_geojson(filepath: str) -> Dict:
    """Load GeoJSON from file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def save_geojson(data: Dict, filepath: str):
    """Save GeoJSON to file"""
    with open(filepath, 'w') as f:
        json.dump(data, f)
    logger.info(f"Saved GeoJSON to {filepath}")


def shapefile_to_geojson(shapefile_path: str, output_path: str = None) -> Dict:
    """
    Convert shapefile to GeoJSON
    
    Args:
        shapefile_path: Path to .shp file
        output_path: Optional path to save GeoJSON
    
    Returns:
        GeoJSON dict
    """
    gdf = gpd.read_file(shapefile_path)
    geojson = json.loads(gdf.to_json())
    
    if output_path:
        save_geojson(geojson, output_path)
    
    return geojson


def calculate_centroid(geometry) -> Tuple[float, float]:
    """
    Calculate centroid of a geometry
    
    Args:
        geometry: GeoJSON geometry dict
    
    Returns:
        Tuple of (longitude, latitude)
    """
    # Compatibility: tests pass a simple polygon ring (list of [x,y])
    # while production code passes a GeoJSON geometry dict.
    if isinstance(geometry, list):
        geom = Polygon(geometry)
    else:
        geom = shape(geometry)
    centroid = geom.centroid
    return (centroid.x, centroid.y)


def calculate_bounds(geometry: Dict) -> Tuple[float, float, float, float]:
    """
    Calculate bounding box of a geometry
    
    Args:
        geometry: GeoJSON geometry dict
    
    Returns:
        Tuple of (minx, miny, maxx, maxy)
    """
    geom = shape(geometry)
    return geom.bounds


def calculate_zoom_level(geometry: Dict, map_width_px: int = 800, 
                        map_height_px: int = 600) -> int:
    """
    Calculate appropriate zoom level for a geometry to fit in a map
    
    Args:
        geometry: GeoJSON geometry dict
        map_width_px: Map width in pixels
        map_height_px: Map height in pixels
    
    Returns:
        Zoom level (1-20)
    """
    bounds = calculate_bounds(geometry)
    minx, miny, maxx, maxy = bounds
    
    lon_span = maxx - minx
    lat_span = maxy - miny
    
    if lon_span > 50 or lat_span > 30:
        zoom = 4
    elif lon_span > 20 or lat_span > 15:
        zoom = 5
    elif lon_span > 10 or lat_span > 7:
        zoom = 6
    elif lon_span > 5 or lat_span > 3:
        zoom = 7
    elif lon_span > 2 or lat_span > 1.5:
        zoom = 8
    elif lon_span > 1 or lat_span > 0.7:
        zoom = 9
    elif lon_span > 0.5 or lat_span > 0.3:
        zoom = 10
    else:
        zoom = 11
    
    return zoom


def _point_in_polygon_tuple(point: Tuple[float, float], geometry: Dict) -> bool:
    """
    Check if a point is inside a polygon
    
    Args:
        point: Tuple of (longitude, latitude)
        geometry: GeoJSON geometry dict
    
    Returns:
        True if point is inside geometry
    """
    pt = Point(point)
    geom = shape(geometry)
    return geom.contains(pt)


# ---------------------------------------------------------------------------
# Compatibility helpers (used by tests / older code)
# ---------------------------------------------------------------------------

def parse_geojson(geojson: Dict) -> List[Dict]:
    """Parse a GeoJSON object into a list of features.

    Supports FeatureCollection and single Feature. Returns an empty list for
    unsupported inputs.
    """
    if not isinstance(geojson, dict):
        return []
    geojson_type = geojson.get('type')
    if geojson_type == 'FeatureCollection':
        return list(geojson.get('features', []))
    if geojson_type == 'Feature':
        return [geojson]
    return []


def calculate_area(polygon: List[List[float]]) -> float:
    """Calculate area for a simple polygon ring (list of [lon,lat])."""
    if not polygon:
        return 0.0
    geom = Polygon(polygon)
    return float(geom.area)


def calculate_bounding_box(polygon: List[List[float]]) -> Dict[str, float]:
    """Calculate bounding box for a simple polygon ring.

    Returns a dict to match the expectations in `tests/test_geojson_tools.py`.
    """
    geom = Polygon(polygon)
    minx, miny, maxx, maxy = geom.bounds
    return {
        'min_x': float(minx),
        'min_y': float(miny),
        'max_x': float(maxx),
        'max_y': float(maxy),
    }


def create_feature(geometry: Dict, properties: Optional[Dict] = None) -> Dict:
    """Create a GeoJSON Feature."""
    return {
        'type': 'Feature',
        'geometry': geometry,
        'properties': properties or {},
    }


def create_feature_collection(features: List[Dict]) -> Dict:
    """Create a GeoJSON FeatureCollection."""
    return {
        'type': 'FeatureCollection',
        'features': features,
    }


def parse_multipolygon(geometry: Dict) -> List[Polygon]:
    """Parse a GeoJSON MultiPolygon geometry into a list of shapely Polygons."""
    geom = shape(geometry)
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    if isinstance(geom, Polygon):
        return [geom]
    return []


def point_in_polygon_legacy(lon: float, lat: float, polygon: List[List[float]]) -> bool:
    """Legacy signature used by older code/tests: (lon, lat, polygon_ring)."""
    return Polygon(polygon).contains(Point(lon, lat))


# Back-compat alias: some tests call point_in_polygon(lon, lat, polygon)
# while the newer implementation expects (point_tuple, geometry_dict).
def point_in_polygon(*args, **kwargs):  # type: ignore[override]
    if len(args) == 3 and isinstance(args[0], (int, float)) and isinstance(args[1], (int, float)):
        return point_in_polygon_legacy(args[0], args[1], args[2])
    if len(args) == 2:
        pt, geom = args
        return _point_in_polygon_tuple(pt, geom)
    raise TypeError('point_in_polygon() expected (point, geometry) or (lon, lat, polygon)')


def _point_in_polygon_tuple(point: Tuple[float, float], geometry: Dict) -> bool:
    pt = Point(point)
    geom = shape(geometry)
    return geom.contains(pt)


def find_containing_geography(point: Tuple[float, float], 
                              geographies: List[Dict]) -> Optional[Dict]:
    """
    Find which geography contains a point
    
    Args:
        point: Tuple of (longitude, latitude)
        geographies: List of GeoJSON feature dicts
    
    Returns:
        The feature that contains the point, or None
    """
    pt = Point(point)
    
    for feature in geographies:
        geometry = feature.get('geometry')
        if geometry:
            geom = shape(geometry)
            if geom.contains(pt):
                return feature
    
    return None


def simplify_geometry(geometry: Dict, tolerance: float = 0.001) -> Dict:
    """
    Simplify a geometry to reduce file size
    
    Args:
        geometry: GeoJSON geometry dict
        tolerance: Simplification tolerance (smaller = more detail)
    
    Returns:
        Simplified GeoJSON geometry dict
    """
    geom = shape(geometry)
    simplified = geom.simplify(tolerance, preserve_topology=True)
    return mapping(simplified)


def merge_geometries(geometries: List[Dict]) -> Dict:
    """
    Merge multiple geometries into one
    
    Args:
        geometries: List of GeoJSON geometry dicts
    
    Returns:
        Merged GeoJSON geometry dict
    """
    shapes = [shape(g) for g in geometries]
    merged = unary_union(shapes)
    return mapping(merged)


def extract_features_by_property(geojson: Dict, property_name: str, 
                                 property_value: any) -> List[Dict]:
    """
    Extract features from GeoJSON by property value
    
    Args:
        geojson: GeoJSON FeatureCollection dict
        property_name: Name of property to filter on
        property_value: Value to match
    
    Returns:
        List of matching features
    """
    features = geojson.get('features', [])
    return [
        f for f in features 
        if f.get('properties', {}).get(property_name) == property_value
    ]


def filter_geojson_by_state(geojson: Dict, state_fips: str) -> Dict:
    """
    Filter GeoJSON to only include features from a specific state
    
    Args:
        geojson: GeoJSON FeatureCollection dict
        state_fips: State FIPS code
    
    Returns:
        Filtered GeoJSON FeatureCollection
    """
    filtered_features = []
    
    for feature in geojson.get('features', []):
        props = feature.get('properties', {})
        
        feature_state = (
            props.get('STATEFP') or 
            props.get('STATE') or 
            props.get('STATEFP20') or
            props.get('STATEFP10') or
            str(props.get('GEOID', ''))[:2]
        )
        
        if feature_state == state_fips:
            filtered_features.append(feature)
    
    return {
        'type': 'FeatureCollection',
        'features': filtered_features
    }


def add_properties_to_features(geojson: Dict, property_mapping: Dict[str, Dict]) -> Dict:
    """
    Add properties to GeoJSON features based on a key
    
    Args:
        geojson: GeoJSON FeatureCollection dict
        property_mapping: Dict mapping feature ID to properties to add
    
    Returns:
        Modified GeoJSON with added properties
    """
    for feature in geojson.get('features', []):
        feature_id = feature.get('id') or feature.get('properties', {}).get('GEOID')
        
        if feature_id in property_mapping:
            feature['properties'].update(property_mapping[feature_id])
    
    return geojson


def validate_geojson(geojson: Dict) -> bool:
    """
    Validate GeoJSON structure
    
    Args:
        geojson: GeoJSON dict
    
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(geojson, dict):
        return False
    
    geojson_type = geojson.get('type')
    
    if geojson_type == 'FeatureCollection':
        return 'features' in geojson
    elif geojson_type == 'Feature':
        return 'geometry' in geojson
    elif geojson_type in ['Point', 'LineString', 'Polygon', 'MultiPoint', 
                          'MultiLineString', 'MultiPolygon', 'GeometryCollection']:
        return 'coordinates' in geojson or 'geometries' in geojson
    
    return False


def get_feature_area(geometry: Dict) -> float:
    """
    Calculate area of a geometry in square degrees
    
    Args:
        geometry: GeoJSON geometry dict
    
    Returns:
        Area in square degrees
    """
    geom = shape(geometry)
    return geom.area


def buffer_geometry(geometry: Dict, distance: float) -> Dict:
    """
    Create a buffer around a geometry
    
    Args:
        geometry: GeoJSON geometry dict
        distance: Buffer distance in degrees
    
    Returns:
        Buffered GeoJSON geometry dict
    """
    geom = shape(geometry)
    buffered = geom.buffer(distance)
    return mapping(buffered)
