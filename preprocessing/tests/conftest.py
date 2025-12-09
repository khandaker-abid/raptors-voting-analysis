"""
Pytest configuration and fixtures for preprocessing tests
"""
import pytest
from unittest.mock import MagicMock, patch
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def mock_mongodb():
    """Fixture for mocked MongoDB client"""
    with patch('pymongo.MongoClient') as mock_client:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        
        mock_client.return_value.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_collection
        
        yield {
            'client': mock_client,
            'db': mock_db,
            'collection': mock_collection
        }


@pytest.fixture
def mock_census_api():
    """Fixture for mocked Census API responses"""
    with patch('requests.Session') as mock_session:
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        
        yield {
            'session': mock_session,
            'instance': mock_session_instance
        }


@pytest.fixture
def sample_geojson():
    """Sample GeoJSON data for testing"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-76.7, 39.2],
                        [-76.5, 39.2],
                        [-76.5, 39.4],
                        [-76.7, 39.4],
                        [-76.7, 39.2]
                    ]]
                },
                "properties": {
                    "GEOID": "24005",
                    "NAME": "Baltimore City"
                }
            }
        ]
    }


@pytest.fixture
def sample_eavs_record():
    """Sample EAVS record for testing"""
    return {
        "FIPSCode": "24005",
        "State": "Maryland",
        "Jurisdiction": "Baltimore City",
        "Year": 2020,
        "A1a": 450000,  # Active registered voters
        "A1b": 25000,   # Inactive registered voters
        "C1a": 350000,  # Total ballots cast
        "D1a": 5000,    # Provisional ballots submitted
        "D1b": 4500,    # Provisional ballots counted
    }


@pytest.fixture
def sample_voter_record():
    """Sample voter record for testing"""
    return {
        "voter_id": "12345678",
        "first_name": "John",
        "last_name": "Doe",
        "address": "123 Main St",
        "city": "Baltimore",
        "state": "MD",
        "zip_code": "21201",
        "county": "Baltimore City",
        "registration_date": "2020-01-15",
        "party": "DEM",
        "status": "Active"
    }


@pytest.fixture
def mock_config():
    """Mock configuration for testing"""
    return {
        "mongodb": {
            "uri": "mongodb://localhost:27017",
            "database": "voting_test"
        },
        "census_api": {
            "key": "test_api_key"
        },
        "states": ["MD", "AR", "RI"],
        "years": [2016, 2018, 2020, 2022]
    }


@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset any singleton instances between tests"""
    yield
    # Cleanup code here if needed


def pytest_configure(config):
    """Pytest configuration hook"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks integration tests")
    config.addinivalue_line("markers", "unit: marks unit tests")
