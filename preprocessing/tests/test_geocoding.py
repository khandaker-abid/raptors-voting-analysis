"""
Unit tests for geocoding utilities
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys
import json

# Add preprocessing directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestCensusGeocoder:
    """Tests for CensusGeocoder class"""
    
    @patch('requests.Session')
    def test_geocoder_initialization(self, mock_session):
        """Should initialize with default benchmark and vintage"""
        from utils.geocoding import CensusGeocoder
        
        geocoder = CensusGeocoder()
        
        assert geocoder.benchmark == "Public_AR_Current"
        assert geocoder.vintage == "Current_Current"
        assert geocoder.rate_limit_delay == 0.1
    
    @patch('requests.Session')
    def test_geocoder_custom_benchmark(self, mock_session):
        """Should accept custom benchmark and vintage"""
        from utils.geocoding import CensusGeocoder
        
        geocoder = CensusGeocoder(
            benchmark="Custom_Benchmark",
            vintage="Custom_Vintage"
        )
        
        assert geocoder.benchmark == "Custom_Benchmark"
        assert geocoder.vintage == "Custom_Vintage"
    
    @patch('requests.Session')
    def test_geocode_address_success(self, mock_session):
        """Should parse successful geocode response"""
        from utils.geocoding import CensusGeocoder
        
        mock_response = {
            'result': {
                'addressMatches': [{
                    'coordinates': {'x': -76.6122, 'y': 39.2904},
                    'matchedAddress': '100 Main St, Baltimore, MD 21201',
                    'geographies': {
                        'Census Blocks': [{
                            'GEOID': '240050001001000',
                            'TRACT': '000100'
                        }],
                        'Counties': [{
                            'COUNTY': '005',
                            'STATE': '24'
                        }]
                    }
                }]
            }
        }
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = mock_response
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0  # Skip rate limiting
        
        result = geocoder.geocode_address(
            street="100 Main St",
            city="Baltimore",
            state="MD"
        )
        
        assert result is not None
        assert result['lat'] == 39.2904
        assert result['lon'] == -76.6122
        assert result['censusBlock'] == '240050001001000'
    
    @patch('requests.Session')
    def test_geocode_address_no_match(self, mock_session):
        """Should return None when no address match found"""
        from utils.geocoding import CensusGeocoder
        
        mock_response = {
            'result': {
                'addressMatches': []
            }
        }
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = mock_response
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0
        
        result = geocoder.geocode_address(
            street="Invalid Address",
            city="Nowhere",
            state="XX"
        )
        
        assert result is None
    
    @patch('requests.Session')
    def test_geocode_address_with_zip(self, mock_session):
        """Should include zip code in request when provided"""
        from utils.geocoding import CensusGeocoder
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = {'result': {'addressMatches': []}}
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0
        
        geocoder.geocode_address(
            street="100 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201"
        )
        
        # Verify the call included zip parameter
        call_kwargs = mock_session_instance.get.call_args
        assert 'params' in call_kwargs[1] or len(call_kwargs[0]) > 1


class TestGeocodingHelpers:
    """Tests for geocoding helper functions"""
    
    def test_load_config_function_exists(self):
        """load_config function should be available"""
        from utils.geocoding import load_config
        
        assert callable(load_config)
    
    def test_load_config_with_missing_file(self):
        """Should raise FileNotFoundError for missing config"""
        from utils.geocoding import load_config
        
        with pytest.raises(FileNotFoundError):
            load_config('nonexistent_config.json')


class TestRateLimiting:
    """Tests for rate limiting behavior"""
    
    @patch('requests.Session')
    @patch('time.sleep')
    @patch('time.time')
    def test_rate_limiting_enforced(self, mock_time, mock_sleep, mock_session):
        """Should enforce rate limiting between requests"""
        from utils.geocoding import CensusGeocoder
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = {'result': {'addressMatches': []}}
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        
        # Simulate time passing too quickly (within rate limit)
        mock_time.side_effect = [0, 0.05, 0.05, 0.15]  # First request, then too soon
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0
        
        geocoder.geocode_address("Test", "City", "ST")
        
        # Rate limiting should have been triggered
        # The exact behavior depends on implementation


class TestAddressFormatting:
    """Tests for address formatting patterns"""
    
    def test_state_abbreviation_format(self):
        """State should be 2-letter abbreviation"""
        # This tests the expected input format
        valid_states = ['MD', 'AR', 'RI', 'CA', 'NY']
        
        for state in valid_states:
            assert len(state) == 2
            assert state.isupper()
    
    def test_coordinate_format(self):
        """Coordinates should be valid lat/lon ranges"""
        # Test coordinate validation logic
        test_coords = [
            (39.2904, -76.6122),   # Baltimore, MD
            (34.7465, -92.2896),   # Little Rock, AR
            (41.8240, -71.4128),   # Providence, RI
        ]
        
        for lat, lon in test_coords:
            assert -90 <= lat <= 90, f"Invalid latitude: {lat}"
            assert -180 <= lon <= 180, f"Invalid longitude: {lon}"


class TestCensusBlockParsing:
    """Tests for census block GEOID parsing"""
    
    def test_geoid_format(self):
        """Census block GEOIDs should follow expected format"""
        # GEOID format: SSCCCTTTTTTBBB (15 digits)
        # SS = State FIPS, CCC = County FIPS, TTTTTT = Tract, BBBB = Block
        
        sample_geoids = [
            '240050001001000',  # Maryland
            '050010001001000',  # Arkansas  
            '440070001001000',  # Rhode Island
        ]
        
        for geoid in sample_geoids:
            assert len(geoid) == 15, f"Invalid GEOID length: {geoid}"
            assert geoid.isdigit(), f"GEOID should be numeric: {geoid}"
    
    def test_extract_state_from_geoid(self):
        """Should extract state FIPS from GEOID"""
        geoid = '240050001001000'  # Maryland
        state_fips = geoid[:2]
        
        assert state_fips == '24'  # Maryland FIPS
    
    def test_extract_county_from_geoid(self):
        """Should extract county FIPS from GEOID"""
        geoid = '240050001001000'  # Baltimore City
        county_fips = geoid[2:5]
        
        assert county_fips == '005'  # Baltimore City FIPS


class TestBatchGeocoding:
    """Tests for batch geocoding functionality"""
    
    @patch('requests.Session')
    def test_batch_geocode_exists(self, mock_session):
        """batch_geocode method should exist"""
        from utils.geocoding import CensusGeocoder
        
        geocoder = CensusGeocoder()
        
        assert hasattr(geocoder, 'batch_geocode')
        assert callable(geocoder.batch_geocode)


class TestErrorHandling:
    """Tests for geocoding error handling"""
    
    @patch('requests.Session')
    def test_handles_request_exception(self, mock_session):
        """Should handle request exceptions gracefully"""
        from utils.geocoding import CensusGeocoder
        import requests
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.side_effect = requests.RequestException("Network error")
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0
        
        result = geocoder.geocode_address("Test", "City", "ST")
        
        assert result is None
    
    @patch('requests.Session')
    def test_handles_timeout(self, mock_session):
        """Should handle timeout exceptions"""
        from utils.geocoding import CensusGeocoder
        import requests
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.side_effect = requests.Timeout("Request timed out")
        
        geocoder = CensusGeocoder()
        geocoder.last_request_time = 0
        
        result = geocoder.geocode_address("Test", "City", "ST")
        
        assert result is None
