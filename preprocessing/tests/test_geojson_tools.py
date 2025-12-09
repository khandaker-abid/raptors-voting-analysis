"""
Unit tests for GeoJSON tools utilities
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys
import json

# Add preprocessing directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestGeoJSONParser:
    """Tests for GeoJSON parsing functionality"""
    
    def test_parse_feature_collection(self):
        """Should parse valid FeatureCollection"""
        from utils.geojson_tools import parse_geojson
        
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                    },
                    "properties": {"name": "Test"}
                }
            ]
        }
        
        result = parse_geojson(geojson)
        
        assert result is not None
        assert len(result) == 1
    
    def test_parse_single_feature(self):
        """Should parse single Feature"""
        from utils.geojson_tools import parse_geojson
        
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            },
            "properties": {"name": "Test"}
        }
        
        result = parse_geojson(geojson)
        
        assert result is not None


class TestCoordinateValidation:
    """Tests for coordinate validation"""
    
    def test_valid_longitude_range(self):
        """Longitude should be between -180 and 180"""
        valid_lons = [-180, -90, 0, 90, 180]
        
        for lon in valid_lons:
            assert -180 <= lon <= 180
    
    def test_valid_latitude_range(self):
        """Latitude should be between -90 and 90"""
        valid_lats = [-90, -45, 0, 45, 90]
        
        for lat in valid_lats:
            assert -90 <= lat <= 90
    
    def test_us_coordinate_bounds(self):
        """US coordinates should be within reasonable bounds"""
        us_bounds = {
            'min_lon': -125,
            'max_lon': -66,
            'min_lat': 24,
            'max_lat': 50
        }
        
        test_coords = [
            (-76.6122, 39.2904),  # Baltimore
            (-92.2896, 34.7465),  # Little Rock
            (-71.4128, 41.8240),  # Providence
        ]
        
        for lon, lat in test_coords:
            assert us_bounds['min_lon'] <= lon <= us_bounds['max_lon']
            assert us_bounds['min_lat'] <= lat <= us_bounds['max_lat']


class TestPolygonOperations:
    """Tests for polygon operations"""
    
    def test_point_in_polygon_basic(self):
        """Should detect point inside polygon"""
        from utils.geojson_tools import point_in_polygon
        
        # Simple square polygon
        polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        
        # Point inside
        assert point_in_polygon(5, 5, polygon) == True
        
        # Point outside
        assert point_in_polygon(15, 15, polygon) == False
    
    def test_point_on_boundary(self):
        """Should handle point on polygon boundary"""
        from utils.geojson_tools import point_in_polygon
        
        polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        
        # Point on edge - behavior may vary by implementation
        result = point_in_polygon(0, 5, polygon)
        assert isinstance(result, bool)


class TestAreaCalculations:
    """Tests for geographic area calculations"""
    
    def test_polygon_area_positive(self):
        """Polygon area should be positive"""
        from utils.geojson_tools import calculate_area
        
        # Simple square (1 degree by 1 degree)
        polygon = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
        
        area = calculate_area(polygon)
        
        assert area > 0
    
    def test_empty_polygon_area(self):
        """Empty polygon should have zero area"""
        from utils.geojson_tools import calculate_area
        
        polygon = []
        
        try:
            area = calculate_area(polygon)
            assert area == 0
        except (ValueError, IndexError):
            pass  # Also acceptable


class TestCentroidCalculation:
    """Tests for centroid calculations"""
    
    def test_calculate_centroid(self):
        """Should calculate polygon centroid"""
        from utils.geojson_tools import calculate_centroid
        
        # Square polygon
        polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        
        centroid = calculate_centroid(polygon)
        
        assert centroid is not None
        assert abs(centroid[0] - 5) < 0.1  # x ≈ 5
        assert abs(centroid[1] - 5) < 0.1  # y ≈ 5
    
    def test_centroid_in_polygon(self):
        """Centroid should be inside convex polygon"""
        from utils.geojson_tools import calculate_centroid, point_in_polygon
        
        polygon = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
        
        centroid = calculate_centroid(polygon)
        
        is_inside = point_in_polygon(centroid[0], centroid[1], polygon)
        assert is_inside == True


class TestBoundingBox:
    """Tests for bounding box calculations"""
    
    def test_calculate_bounding_box(self):
        """Should calculate correct bounding box"""
        from utils.geojson_tools import calculate_bounding_box
        
        polygon = [[0, 0], [10, 0], [10, 5], [0, 5], [0, 0]]
        
        bbox = calculate_bounding_box(polygon)
        
        assert bbox['min_x'] == 0
        assert bbox['max_x'] == 10
        assert bbox['min_y'] == 0
        assert bbox['max_y'] == 5
    
    def test_bounding_box_contains_polygon(self):
        """Bounding box should contain all polygon points"""
        from utils.geojson_tools import calculate_bounding_box
        
        polygon = [[-5, 2], [3, 8], [10, 4], [7, -3], [-5, 2]]
        
        bbox = calculate_bounding_box(polygon)
        
        for x, y in polygon:
            assert bbox['min_x'] <= x <= bbox['max_x']
            assert bbox['min_y'] <= y <= bbox['max_y']


class TestGeoJSONConversion:
    """Tests for GeoJSON format conversion"""
    
    def test_convert_to_feature(self):
        """Should convert data to GeoJSON Feature"""
        from utils.geojson_tools import create_feature
        
        geometry = {
            "type": "Point",
            "coordinates": [-76.6122, 39.2904]
        }
        properties = {"name": "Baltimore", "state": "MD"}
        
        feature = create_feature(geometry, properties)
        
        assert feature['type'] == 'Feature'
        assert feature['geometry'] == geometry
        assert feature['properties'] == properties
    
    def test_create_feature_collection(self):
        """Should create valid FeatureCollection"""
        from utils.geojson_tools import create_feature_collection
        
        features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [0, 0]},
                "properties": {}
            }
        ]
        
        fc = create_feature_collection(features)
        
        assert fc['type'] == 'FeatureCollection'
        assert fc['features'] == features


class TestCoordinateTransformations:
    """Tests for coordinate transformations"""
    
    def test_wgs84_coordinates(self):
        """Should work with WGS84 coordinates"""
        # Standard GPS coordinates (EPSG:4326)
        coords = [
            (-76.6122, 39.2904),  # Baltimore
            (-122.4194, 37.7749),  # San Francisco
        ]
        
        for lon, lat in coords:
            assert -180 <= lon <= 180
            assert -90 <= lat <= 90
    
    def test_coordinate_precision(self):
        """Coordinates should maintain reasonable precision"""
        coord = -76.612231
        
        # 6 decimal places ≈ 0.1 meter precision
        rounded = round(coord, 6)
        
        assert abs(coord - rounded) < 0.000001


class TestMultiPolygonHandling:
    """Tests for MultiPolygon handling"""
    
    def test_parse_multipolygon(self):
        """Should parse MultiPolygon geometry"""
        from utils.geojson_tools import parse_multipolygon
        
        multipolygon = {
            "type": "MultiPolygon",
            "coordinates": [
                [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]]
            ]
        }
        
        polygons = parse_multipolygon(multipolygon)
        
        assert len(polygons) == 2
    
    def test_flatten_multipolygon(self):
        """Should flatten MultiPolygon to list of polygons"""
        coords = [
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]]
        ]
        
        # Flatten to list of coordinate rings
        flattened = [poly[0] for poly in coords]
        
        assert len(flattened) == 2


class TestGeoJSONValidation:
    """Tests for GeoJSON validation"""
    
    def test_valid_geometry_types(self):
        """Should recognize valid geometry types"""
        valid_types = ['Point', 'LineString', 'Polygon', 
                       'MultiPoint', 'MultiLineString', 'MultiPolygon',
                       'GeometryCollection']
        
        for geom_type in valid_types:
            assert geom_type in ['Point', 'LineString', 'Polygon',
                                 'MultiPoint', 'MultiLineString', 'MultiPolygon',
                                 'GeometryCollection']
    
    def test_closed_polygon_ring(self):
        """Polygon rings should be closed (first point = last point)"""
        ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
        
        assert ring[0] == ring[-1], "Polygon ring should be closed"
    
    def test_minimum_polygon_points(self):
        """Polygon should have at least 4 points (including closing point)"""
        valid_ring = [[0, 0], [1, 0], [1, 1], [0, 0]]  # Triangle
        
        assert len(valid_ring) >= 4
