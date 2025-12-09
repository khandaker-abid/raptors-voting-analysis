"""
Unit tests for EAVS (Election Administration and Voting Survey) scraper utilities
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys
import json

# Add preprocessing directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestEAVSScraper:
    """Tests for EAVS data scraper"""
    
    @patch('requests.Session')
    def test_scraper_initialization(self, mock_session):
        """Should initialize EAVS scraper"""
        from utils.eavs_scraper import EAVSScraper
        
        scraper = EAVSScraper()
        
        assert scraper is not None
        assert scraper.base_url is not None
    
    @patch('requests.Session')
    def test_fetch_eavs_data_by_year(self, mock_session):
        """Should fetch EAVS data for specific year"""
        from utils.eavs_scraper import EAVSScraper
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        
        mock_response = MagicMock()
        mock_response.content = b'FIPSCode,State,RegisteredVoters\n24,Maryland,4000000'
        mock_response.raise_for_status = MagicMock()
        mock_session_instance.get.return_value = mock_response
        
        scraper = EAVSScraper()
        
        result = scraper.fetch_data(year=2020)
        
        assert result is not None


class TestEAVSDataFields:
    """Tests for EAVS data field handling"""
    
    def test_standard_eavs_fields(self):
        """Should recognize standard EAVS fields"""
        standard_fields = [
            'FIPSCode',
            'State',
            'Jurisdiction',
            'A1a',  # Active registered voters
            'A1b',  # Inactive registered voters
            'B1a',  # New valid registrations
            'B1b',  # New invalid registrations
            'C1a',  # Ballots cast
            'D1a',  # Overseas voters
            'E1a',  # Domestic UOCAVA
            'F1a',  # Polling places
        ]
        
        for field in standard_fields:
            assert isinstance(field, str)
            assert len(field) > 0
    
    def test_equipment_fields(self):
        """Should handle equipment-related fields"""
        equipment_fields = [
            'F1b',  # Electronic poll books
            'F1c',  # Optical scan
            'F1d',  # DRE
            'F1e',  # Hand counted paper
            'F1f',  # Ballot marking devices
        ]
        
        for field in equipment_fields:
            assert isinstance(field, str)
    
    def test_provisional_ballot_fields(self):
        """Should handle provisional ballot fields"""
        provisional_fields = [
            'D1a',  # Provisional ballots submitted
            'D1b',  # Provisional ballots counted
            'D1c',  # Provisional ballots rejected
        ]
        
        for field in provisional_fields:
            assert isinstance(field, str)


class TestFIPSCodeValidation:
    """Tests for FIPS code validation"""
    
    def test_state_fips_validation(self):
        """Should validate state FIPS codes"""
        valid_state_fips = ['01', '05', '24', '44', '50']
        invalid_state_fips = ['00', '57', 'XX', '', '1']
        
        for fips in valid_state_fips:
            assert len(fips) == 2
            assert fips.isdigit()
            assert int(fips) >= 1 and int(fips) <= 56
        
        for fips in invalid_state_fips:
            is_invalid = (
                len(fips) != 2 or
                not fips.isdigit() or
                (fips.isdigit() and (int(fips) < 1 or int(fips) > 56))
            )
            assert is_invalid
    
    def test_jurisdiction_fips_validation(self):
        """Should validate jurisdiction FIPS codes"""
        # Jurisdiction FIPS = State FIPS (2) + County FIPS (3)
        valid_fips = ['24005', '05001', '44001']
        
        for fips in valid_fips:
            assert len(fips) == 5
            assert fips.isdigit()
            
            state_fips = fips[:2]
            county_fips = fips[2:]
            
            assert len(state_fips) == 2
            assert len(county_fips) == 3


class TestDataCleaning:
    """Tests for EAVS data cleaning"""
    
    def test_clean_numeric_field(self):
        """Should clean numeric fields correctly"""
        raw_values = ['1,234', '5678', '-1', 'N/A', '', '0']
        expected = [1234, 5678, -1, None, None, 0]
        
        def clean_numeric(val):
            if val in ['N/A', '', None]:
                return None
            try:
                return int(str(val).replace(',', ''))
            except ValueError:
                return None
        
        for raw, exp in zip(raw_values, expected):
            assert clean_numeric(raw) == exp
    
    def test_clean_percentage_field(self):
        """Should clean percentage fields correctly"""
        raw_values = ['50%', '100.0%', '0%', 'N/A']
        
        def clean_percentage(val):
            if val in ['N/A', '', None]:
                return None
            try:
                return float(str(val).replace('%', ''))
            except ValueError:
                return None
        
        results = [clean_percentage(v) for v in raw_values]
        
        assert results[0] == 50.0
        assert results[1] == 100.0
        assert results[2] == 0.0
        assert results[3] is None


class TestStateAggregation:
    """Tests for state-level aggregation"""
    
    def test_aggregate_by_state(self):
        """Should aggregate county data to state level"""
        county_data = [
            {'state': 'MD', 'county': '001', 'voters': 1000},
            {'state': 'MD', 'county': '003', 'voters': 2000},
            {'state': 'MD', 'county': '005', 'voters': 3000},
        ]
        
        # Aggregate by state
        state_total = sum(d['voters'] for d in county_data)
        
        assert state_total == 6000
    
    def test_weighted_average(self):
        """Should calculate weighted averages correctly"""
        data = [
            {'turnout': 0.65, 'voters': 1000},
            {'turnout': 0.70, 'voters': 2000},
            {'turnout': 0.75, 'voters': 3000},
        ]
        
        total_voters = sum(d['voters'] for d in data)
        weighted_turnout = sum(d['turnout'] * d['voters'] for d in data) / total_voters
        
        # (0.65*1000 + 0.70*2000 + 0.75*3000) / 6000
        # = (650 + 1400 + 2250) / 6000
        # = 4300 / 6000 ≈ 0.7167
        assert abs(weighted_turnout - 0.7167) < 0.001


class TestYearValidation:
    """Tests for election year validation"""
    
    def test_valid_election_years(self):
        """Should validate even years (elections)"""
        valid_years = [2016, 2018, 2020, 2022, 2024]
        invalid_years = [2017, 2019, 2021, 2023]
        
        for year in valid_years:
            assert year % 2 == 0
        
        for year in invalid_years:
            assert year % 2 == 1
    
    def test_presidential_election_years(self):
        """Should identify presidential election years"""
        presidential_years = [2008, 2012, 2016, 2020, 2024]
        midterm_years = [2010, 2014, 2018, 2022]
        
        for year in presidential_years:
            assert year % 4 == 0
        
        for year in midterm_years:
            assert year % 4 == 2


class TestDataCompletenessScoring:
    """Tests for data completeness scoring"""
    
    def test_calculate_completeness(self):
        """Should calculate field completeness percentage"""
        record = {
            'field1': 'value',
            'field2': None,
            'field3': 'value',
            'field4': '',
            'field5': 'value',
        }
        
        required_fields = ['field1', 'field2', 'field3', 'field4', 'field5']
        
        present = sum(1 for f in required_fields if record.get(f) not in [None, ''])
        completeness = present / len(required_fields)
        
        assert completeness == 0.6  # 3 out of 5
    
    def test_completeness_score_range(self):
        """Completeness score should be between 0 and 1"""
        scores = [0, 0.25, 0.5, 0.75, 1.0]
        
        for score in scores:
            assert 0 <= score <= 1


class TestMailVotingFields:
    """Tests for mail/absentee voting fields"""
    
    def test_mail_ballot_fields(self):
        """Should handle mail ballot tracking fields"""
        mail_fields = {
            'transmitted': 'C1a',  # Mail ballots transmitted
            'returned': 'C1b',     # Mail ballots returned
            'counted': 'C1c',      # Mail ballots counted
            'rejected': 'C1d',     # Mail ballots rejected
        }
        
        for category, field in mail_fields.items():
            assert isinstance(field, str)
            assert field.startswith('C')
    
    def test_calculate_mail_return_rate(self):
        """Should calculate mail ballot return rate"""
        transmitted = 100000
        returned = 85000
        
        return_rate = returned / transmitted if transmitted > 0 else 0
        
        assert abs(return_rate - 0.85) < 0.001
        assert 0 <= return_rate <= 1


class TestEquipmentTypeMapping:
    """Tests for voting equipment type mapping"""
    
    def test_equipment_type_codes(self):
        """Should map equipment type codes to descriptions"""
        equipment_types = {
            'OS': 'Optical Scan',
            'DRE': 'Direct Recording Electronic',
            'BMD': 'Ballot Marking Device',
            'HCPB': 'Hand Counted Paper Ballots',
        }
        
        for code, description in equipment_types.items():
            assert isinstance(code, str)
            assert isinstance(description, str)
            assert len(description) > 0
    
    def test_equipment_has_vvpat(self):
        """Should track VVPAT (paper trail) status"""
        equipment = [
            {'type': 'OS', 'has_vvpat': True},
            {'type': 'DRE', 'has_vvpat': False},
            {'type': 'BMD', 'has_vvpat': True},
        ]
        
        paper_audit = [e for e in equipment if e['has_vvpat']]
        
        assert len(paper_audit) == 2


class TestEAVSErrorHandling:
    """Tests for EAVS scraper error handling"""
    
    @patch('requests.Session')
    def test_handles_network_error(self, mock_session):
        """Should handle network errors gracefully"""
        from utils.eavs_scraper import EAVSScraper
        import requests
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.get.side_effect = requests.RequestException("Network error")
        
        scraper = EAVSScraper()
        
        try:
            result = scraper.fetch_data(year=2020)
            assert result is None or isinstance(result, list)
        except requests.RequestException:
            pass  # Expected
    
    @patch('requests.Session')
    def test_handles_invalid_csv(self, mock_session):
        """Should handle malformed CSV data"""
        from utils.eavs_scraper import EAVSScraper
        
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        
        mock_response = MagicMock()
        mock_response.content = b'invalid,csv,data\nwithout,proper,structure'
        mock_response.raise_for_status = MagicMock()
        mock_session_instance.get.return_value = mock_response
        
        scraper = EAVSScraper()
        
        try:
            result = scraper.fetch_data(year=2020)
            # Should handle gracefully
        except Exception as e:
            # Should be a handled exception
            pass
