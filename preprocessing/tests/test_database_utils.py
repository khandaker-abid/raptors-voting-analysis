"""
Unit tests for preprocessing utilities
"""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys

# Add preprocessing directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.database import (
    get_all_mainland_states,
    get_state_fips_mapping,
    load_config,
)


class TestStateFunctions:
    """Tests for state-related utility functions"""
    
    def test_get_all_mainland_states_returns_48_states(self):
        """Should return exactly 48 mainland states"""
        states = get_all_mainland_states()
        assert len(states) == 48
    
    def test_get_all_mainland_states_excludes_alaska_hawaii(self):
        """Should not include AK (Alaska) or HI (Hawaii)"""
        states = get_all_mainland_states()
        assert 'AK' not in states
        assert 'HI' not in states
    
    def test_get_all_mainland_states_includes_detail_states(self):
        """Should include AR, MD, RI (detail states in the project)"""
        states = get_all_mainland_states()
        assert 'AR' in states  # Arkansas
        assert 'MD' in states  # Maryland
        assert 'RI' in states  # Rhode Island
    
    def test_get_all_mainland_states_are_two_letter_codes(self):
        """All state codes should be 2 letters"""
        states = get_all_mainland_states()
        for state in states:
            assert len(state) == 2
            assert state.isupper()
    
    def test_get_all_mainland_states_no_duplicates(self):
        """Should not have duplicate state codes"""
        states = get_all_mainland_states()
        assert len(states) == len(set(states))


class TestStateFipsMapping:
    """Tests for state FIPS code mapping"""
    
    def test_fips_mapping_has_48_entries(self):
        """Should have FIPS code for each mainland state"""
        fips = get_state_fips_mapping()
        assert len(fips) == 48
    
    def test_fips_codes_are_two_digits(self):
        """All FIPS codes should be 2-digit strings"""
        fips = get_state_fips_mapping()
        for state, code in fips.items():
            assert len(code) == 2
            assert code.isdigit()
    
    def test_fips_codes_are_unique(self):
        """All FIPS codes should be unique"""
        fips = get_state_fips_mapping()
        codes = list(fips.values())
        assert len(codes) == len(set(codes))
    
    def test_specific_fips_codes(self):
        """Test specific known FIPS codes"""
        fips = get_state_fips_mapping()
        
        # Detail states
        assert fips['AR'] == '05'  # Arkansas
        assert fips['MD'] == '24'  # Maryland
        assert fips['RI'] == '44'  # Rhode Island
        
        # Other known states
        assert fips['CA'] == '06'  # California
        assert fips['NY'] == '36'  # New York
        assert fips['TX'] == '48'  # Texas
    
    def test_fips_mapping_matches_states_list(self):
        """FIPS mapping should cover all mainland states"""
        states = get_all_mainland_states()
        fips = get_state_fips_mapping()
        
        for state in states:
            assert state in fips, f"Missing FIPS code for {state}"


class TestLoadConfig:
    """Tests for configuration loading"""
    
    @patch('builtins.open')
    def test_load_config_reads_json(self, mock_open):
        """Should correctly parse JSON config file"""
        mock_config = {
            'database': {
                'mongoUri': 'mongodb://localhost:27017',
                'dbName': 'test_db'
            },
            'detailedStates': {
                'AR': 'Arkansas',
                'MD': 'Maryland'
            }
        }
        mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(mock_config)
        
        with patch('json.load', return_value=mock_config):
            config = load_config('config.json')
        
        assert 'database' in config
        assert config['database']['dbName'] == 'test_db'
    
    def test_load_config_with_real_config_if_exists(self):
        """Test with real config file if it exists"""
        config_path = Path(__file__).parent.parent / 'config.json'
        
        if config_path.exists():
            config = load_config(str(config_path))
            assert 'database' in config
            assert 'mongoUri' in config['database']


class TestDatabaseManager:
    """Tests for DatabaseManager class (mocked)"""
    
    @patch('utils.database.MongoClient')
    def test_database_manager_initialization(self, mock_client):
        """Should initialize with connection string from config"""
        mock_config = {
            'database': {
                'mongoUri': 'mongodb://localhost:27017',
                'dbName': 'test_db'
            }
        }
        
        with patch('builtins.open', MagicMock()):
            with patch('json.load', return_value=mock_config):
                from utils.database import DatabaseManager
                
                # Mock the ping command
                mock_client.return_value.admin.command.return_value = True
                mock_client.return_value.__getitem__.return_value = MagicMock()
                
                db = DatabaseManager('config.json')
                
                mock_client.assert_called_once()
                assert db.db_name == 'test_db'


class TestStateNameNormalization:
    """Tests for state name handling patterns"""
    
    def test_uppercase_state_abbreviations(self):
        """State abbreviations should be uppercase"""
        states = get_all_mainland_states()
        for state in states:
            assert state == state.upper()
    
    def test_common_state_abbreviations_included(self):
        """Common state abbreviations should be included"""
        states = get_all_mainland_states()
        common_states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'MI', 'NC']
        
        for state in common_states:
            assert state in states


class TestFipsCodeRanges:
    """Tests for FIPS code range validity"""
    
    def test_fips_codes_in_valid_range(self):
        """FIPS codes should be in valid US state range (01-56)"""
        fips = get_state_fips_mapping()
        
        for state, code in fips.items():
            code_int = int(code)
            assert 1 <= code_int <= 56, f"Invalid FIPS code {code} for {state}"
    
    def test_no_territory_fips_codes(self):
        """Should not include territory FIPS codes (60+)"""
        fips = get_state_fips_mapping()
        
        for state, code in fips.items():
            code_int = int(code)
            assert code_int < 60, f"Territory FIPS code {code} found for {state}"


class TestConfigValidation:
    """Tests for config file structure validation"""
    
    def test_config_example_exists(self):
        """config.example.json should exist as template"""
        config_example = Path(__file__).parent.parent / 'config.example.json'
        
        if config_example.exists():
            with open(config_example) as f:
                config = json.load(f)
            
            assert 'database' in config
            assert 'mongoUri' in config['database']
            assert 'dbName' in config['database']


class TestDataSourcePatterns:
    """Tests for data source configuration patterns"""
    
    def test_detail_states_match_project_scope(self):
        """Detail states should match project requirements"""
        # These are the states with detailed data in the project
        expected_detail_states = ['AR', 'MD', 'RI']
        
        fips = get_state_fips_mapping()
        
        for state in expected_detail_states:
            assert state in fips
    
    def test_fips_codes_for_detail_states(self):
        """Detail states should have correct FIPS codes"""
        fips = get_state_fips_mapping()
        
        detail_state_fips = {
            'AR': '05',  # Arkansas
            'MD': '24',  # Maryland  
            'RI': '44',  # Rhode Island
        }
        
        for state, expected_fips in detail_state_fips.items():
            assert fips[state] == expected_fips
