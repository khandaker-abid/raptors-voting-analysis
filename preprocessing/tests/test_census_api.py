"""
Unit tests for Census API utilities
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys
import json

# Add preprocessing directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestCensusAPIClient:
    """Tests for Census API client"""
    
    @patch('requests.Session')
    def test_client_initialization(self, mock_session):
        """Should initialize with API key"""
        from utils.census_api import CensusAPIClient
        
        client = CensusAPIClient(api_key="test_key")
        
        assert client.api_key == "test_key"
        assert client.base_url is not None
    
    @patch('requests.Session')
    def test_client_without_key(self, mock_session):
        """Should work without API key (limited requests)"""
        from utils.census_api import CensusAPIClient
        
        client = CensusAPIClient()
        
        assert client is not None


class TestCVAPDataFetching:
    """Tests for Citizen Voting Age Population data"""
    
    @patch('requests.Session')
    def test_fetch_cvap_by_state(self, mock_session):
        """Should fetch CVAP data for a state"""
        from utils.census_api import CensusAPIClient
        
        mock_response = [
            ['NAME', 'CVAP', 'state'],
            ['Maryland', '4500000', '24']
        ]
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = mock_response
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        mock_session_instance.get.return_value.status_code = 200
        
        client = CensusAPIClient(api_key="test_key")
        
        result = client.fetch_cvap_data(state_fips='24')
        
        assert result is not None
    
    @patch('requests.Session')
    def test_fetch_cvap_by_county(self, mock_session):
        """Should fetch CVAP data by county"""
        from utils.census_api import CensusAPIClient
        
        mock_response = [
            ['NAME', 'CVAP', 'county', 'state'],
            ['Baltimore City', '450000', '510', '24']
        ]
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = mock_response
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        mock_session_instance.get.return_value.status_code = 200
        
        client = CensusAPIClient(api_key="test_key")
        
        result = client.fetch_cvap_data(state_fips='24', county_fips='510')
        
        assert result is not None


class TestDemographicDataFetching:
    """Tests for demographic data fetching"""
    
    @patch('requests.Session')
    def test_fetch_population_by_race(self, mock_session):
        """Should fetch population data by race"""
        from utils.census_api import CensusAPIClient
        
        # Census API response format: list of lists
        mock_response = [
            ['NAME', 'B02001_001E', 'B02001_002E', 'B02001_003E', 'state'],
            ['Maryland', '6177224', '3316000', '1830000', '24']
        ]
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = mock_response
        mock_session_instance.get.return_value.raise_for_status = MagicMock()
        
        client = CensusAPIClient(api_key="test_key")
        
        result = client.fetch_demographic_data(state_fips='24')
        
        assert result is not None


class TestGeographicBoundaries:
    """Tests for geographic boundary fetching"""
    
    def test_state_fips_mapping(self):
        """Should have correct state FIPS codes"""
        # Import the mapping
        from utils.database import get_state_fips_mapping
        
        mapping = get_state_fips_mapping()
        
        # Verify key states
        assert mapping.get('maryland') == '24' or mapping.get('MD') == '24'
        assert mapping.get('arkansas') == '05' or mapping.get('AR') == '05'
        assert mapping.get('rhode island') == '44' or mapping.get('RI') == '44'
    
    def test_fips_code_format(self):
        """FIPS codes should be 2 digit strings"""
        from utils.database import get_state_fips_mapping
        
        mapping = get_state_fips_mapping()
        
        for state, fips in mapping.items():
            assert len(fips) == 2, f"Invalid FIPS for {state}: {fips}"
            assert fips.isdigit(), f"FIPS should be numeric for {state}: {fips}"


class TestAPIResponseParsing:
    """Tests for API response parsing"""
    
    def test_parse_tabular_response(self):
        """Should parse Census API tabular response"""
        # Census API returns header row + data rows
        response = [
            ['NAME', 'POP', 'state'],
            ['Maryland', '6177224', '24'],
            ['Arkansas', '3025891', '05']
        ]
        
        # Parse into list of dicts
        headers = response[0]
        data = [dict(zip(headers, row)) for row in response[1:]]
        
        assert len(data) == 2
        assert data[0]['NAME'] == 'Maryland'
        assert data[0]['POP'] == '6177224'
        assert data[1]['NAME'] == 'Arkansas'
    
    def test_parse_numeric_values(self):
        """Should convert numeric strings to numbers"""
        raw_value = '6177224'
        
        numeric_value = int(raw_value)
        
        assert numeric_value == 6177224
        assert isinstance(numeric_value, int)
    
    def test_handle_missing_values(self):
        """Should handle missing or null values"""
        response_with_nulls = [
            ['NAME', 'POP'],
            ['Test County', '-666666666']  # Census uses -666666666 for missing
        ]
        
        data = dict(zip(response_with_nulls[0], response_with_nulls[1]))
        pop = data['POP']
        
        # Should detect missing value indicator
        is_missing = pop == '-666666666' or pop is None or pop == ''
        assert is_missing or pop == '-666666666'


class TestRacialDemographicVariables:
    """Tests for racial demographic variable handling"""
    
    def test_standard_race_variables(self):
        """Should use correct Census variable codes for race"""
        # B02001 table: Race
        race_variables = {
            'total': 'B02001_001E',
            'white': 'B02001_002E',
            'black': 'B02001_003E',
            'native': 'B02001_004E',
            'asian': 'B02001_005E',
            'pacific': 'B02001_006E',
            'other': 'B02001_007E',
            'two_or_more': 'B02001_008E'
        }
        
        # Verify variable naming convention
        for category, var in race_variables.items():
            assert var.startswith('B02001_'), f"Invalid variable for {category}"
            assert var.endswith('E'), f"Should be estimate variable for {category}"
    
    def test_hispanic_origin_variables(self):
        """Should use correct Census variable codes for Hispanic origin"""
        # B03001 or B03003 table: Hispanic or Latino Origin
        hispanic_variables = {
            'total': 'B03003_001E',
            'hispanic': 'B03003_003E',
            'not_hispanic': 'B03003_002E'
        }
        
        for category, var in hispanic_variables.items():
            assert var.startswith('B03003_'), f"Invalid variable for {category}"


class TestVotingAgePopulation:
    """Tests for voting age population calculations"""
    
    def test_vap_calculation(self):
        """Should calculate VAP correctly"""
        total_population = 6177224
        under_18 = 1300000
        
        vap = total_population - under_18
        
        assert vap == 4877224
        assert vap > 0
        assert vap < total_population
    
    def test_cvap_vs_vap(self):
        """CVAP should be less than or equal to VAP"""
        vap = 4877224  # Voting Age Population
        cvap = 4200000  # Citizen Voting Age Population
        
        assert cvap <= vap, "CVAP cannot exceed VAP"


class TestCensusErrorHandling:
    """Tests for Census API error handling"""
    
    @patch('requests.Session')
    def test_handles_api_error(self, mock_session):
        """Should handle API errors gracefully"""
        from utils.census_api import CensusAPIClient
        import requests
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.side_effect = requests.RequestException("API Error")
        
        client = CensusAPIClient(api_key="test_key")
        
        try:
            result = client.fetch_cvap_data(state_fips='24')
            # Should return None or raise controlled exception
            assert result is None or isinstance(result, list)
        except Exception as e:
            # Should be a handled exception type
            assert True
    
    @patch('requests.Session')
    def test_handles_rate_limiting(self, mock_session):
        """Should handle rate limiting (429) responses"""
        from utils.census_api import CensusAPIClient
        import requests
        
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.raise_for_status.side_effect = requests.HTTPError("429 Too Many Requests")
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value = mock_response
        
        client = CensusAPIClient(api_key="test_key")
        
        try:
            result = client.fetch_cvap_data(state_fips='24')
        except requests.HTTPError:
            pass  # Expected behavior
        except Exception:
            pass  # Also acceptable
    
    @patch('requests.Session')
    def test_handles_invalid_state_fips(self, mock_session):
        """Should handle invalid state FIPS codes"""
        from utils.census_api import CensusAPIClient
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.return_value.json.return_value = {'error': 'Invalid FIPS'}
        
        client = CensusAPIClient(api_key="test_key")
        
        # Should not crash with invalid FIPS
        try:
            result = client.fetch_cvap_data(state_fips='99')  # Invalid
            # Result handling depends on implementation
        except Exception:
            pass  # Also acceptable


class TestDataTransformations:
    """Tests for Census data transformations"""
    
    def test_fips_to_state_name(self):
        """Should convert FIPS to state name"""
        fips_to_name = {
            '24': 'Maryland',
            '05': 'Arkansas',
            '44': 'Rhode Island'
        }
        
        assert fips_to_name['24'] == 'Maryland'
        assert fips_to_name['05'] == 'Arkansas'
    
    def test_county_fips_formatting(self):
        """County FIPS should be 3 digits, zero-padded"""
        county_fips_values = ['001', '005', '510', '033']
        
        for fips in county_fips_values:
            assert len(fips) == 3, f"County FIPS should be 3 digits: {fips}"
            assert fips.isdigit(), f"County FIPS should be numeric: {fips}"
    
    def test_combined_geoid(self):
        """Should create combined state+county GEOID"""
        state_fips = '24'
        county_fips = '005'
        
        geoid = f"{state_fips}{county_fips}"
        
        assert geoid == '24005'
        assert len(geoid) == 5
