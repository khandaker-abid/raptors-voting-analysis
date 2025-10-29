"""
Census Bureau API wrapper for accessing demographic and geographic data
"""
import requests
import logging
from typing import Dict, List, Optional
import json
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CensusAPI:
    """Wrapper for US Census Bureau API"""
    
    BASE_URL = "https://api.census.gov/data"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
    
    def _make_request(self, url: str, params: Dict) -> Optional[Dict]:
        """Make API request with error handling"""
        params['key'] = self.api_key
        
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Census API request failed: {e}")
            return None
    
    def get_acs_data(self, year: int, dataset: str, variables: List[str], 
                     geography: str, **kwargs) -> Optional[List[List]]:
        """
        Get data from American Community Survey
        
        Args:
            year: Survey year (e.g., 2023)
            dataset: Dataset name (e.g., 'acs5', 'acs1')
            variables: List of variable codes
            geography: Geography level (e.g., 'county:*', 'state:*')
            **kwargs: Additional parameters (e.g., in='state:37')
        
        Returns:
            List of data rows
        """
        url = f"{self.BASE_URL}/{year}/acs/{dataset}"
        
        params = {
            'get': ','.join(variables),
            'for': geography
        }
        params.update(kwargs)
        
        data = self._make_request(url, params)
        return data
    
    def get_cvap_data(self, year: int, state_fips: str, 
                     county_fips: str = '*') -> Optional[List[List]]:
        """
        Get Citizen Voting Age Population data
        
        Args:
            year: Year for data (use 2023 for most recent)
            state_fips: State FIPS code
            county_fips: County FIPS code or '*' for all counties
        
        Returns:
            List of data rows with CVAP by demographics
        """
        # CVAP variables from ACS special tabulation
        # Note: These may need to be updated based on actual Census table codes
        variables = [
            'NAME',
            'B05003_001E',  # Total CVAP
            'B05003_008E',  # CVAP: White alone
            'B05003_011E',  # CVAP: Black or African American alone
            'B05003_021E',  # CVAP: Hispanic or Latino
            'B05003_012E',  # CVAP: Asian alone
        ]
        
        return self.get_acs_data(
            year=year,
            dataset='acs5',
            variables=variables,
            geography=f'county:{county_fips}',
            **{'in': f'state:{state_fips}'}
        )
    
    def get_population_data(self, year: int, state_fips: str, 
                           county_fips: str = '*') -> Optional[List[List]]:
        """
        Get total population data
        
        Args:
            year: Year for data
            state_fips: State FIPS code
            county_fips: County FIPS code or '*' for all
        
        Returns:
            List of data rows with population counts
        """
        variables = [
            'NAME',
            'B01003_001E',  # Total population
        ]
        
        return self.get_acs_data(
            year=year,
            dataset='acs5',
            variables=variables,
            geography=f'county:{county_fips}',
            **{'in': f'state:{state_fips}'}
        )
    
    def get_demographic_data(self, year: int, state_fips: str,
                           county_fips: str = '*') -> Optional[Dict]:
        """
        Get comprehensive demographic data for a state/county
        
        Returns:
            Dict with processed demographic data
        """
        variables = [
            'NAME',
            'B01003_001E',  # Total population
            'B02001_002E',  # White alone
            'B02001_003E',  # Black or African American alone
            'B03001_003E',  # Hispanic or Latino
            'B02001_005E',  # Asian alone
            'B02001_004E',  # American Indian and Alaska Native alone
            'B02001_006E',  # Native Hawaiian and Other Pacific Islander alone
        ]
        
        data = self.get_acs_data(
            year=year,
            dataset='acs5',
            variables=variables,
            geography=f'county:{county_fips}',
            **{'in': f'state:{state_fips}'}
        )
        
        if not data or len(data) < 2:
            return None
        
        # Process data into dict format
        headers = data[0]
        rows = data[1:]
        
        processed = []
        for row in rows:
            record = dict(zip(headers, row))
            processed.append({
                'name': record.get('NAME'),
                'stateFips': record.get('state'),
                'countyFips': record.get('county'),
                'totalPopulation': self._parse_int(record.get('B01003_001E')),
                'white': self._parse_int(record.get('B02001_002E')),
                'black': self._parse_int(record.get('B02001_003E')),
                'hispanic': self._parse_int(record.get('B03001_003E')),
                'asian': self._parse_int(record.get('B02001_005E')),
                'nativeAmerican': self._parse_int(record.get('B02001_004E')),
                'pacificIslander': self._parse_int(record.get('B02001_006E')),
            })
        
        return processed
    
    def _parse_int(self, value: str) -> Optional[int]:
        """Parse integer value, handling nulls and errors"""
        try:
            return int(value) if value and value != '-' else None
        except (ValueError, TypeError):
            return None
    
    def get_geography_info(self, geography_type: str, state_fips: str = None) -> Optional[List[List]]:
        """
        Get available geographies
        
        Args:
            geography_type: Type of geography (e.g., 'county', 'tract')
            state_fips: Optional state FIPS to filter
        
        Returns:
            List of available geographies
        """
        url = f"{self.BASE_URL}/2020/dec/pl"
        
        params = {
            'get': 'NAME',
            'for': f'{geography_type}:*'
        }
        
        if state_fips:
            params['in'] = f'state:{state_fips}'
        
        return self._make_request(url, params)


def download_cvap_for_states(api_key: str, state_fips_list: List[str], 
                             year: int = 2023) -> Dict[str, List[Dict]]:
    """
    Download CVAP data for multiple states
    
    Args:
        api_key: Census API key
        state_fips_list: List of state FIPS codes
        year: Year for data
    
    Returns:
        Dict mapping state FIPS to list of county CVAP data
    """
    census_api = CensusAPI(api_key)
    results = {}
    
    for state_fips in state_fips_list:
        logger.info(f"Downloading CVAP data for state {state_fips}")
        
        data = census_api.get_cvap_data(year, state_fips)
        
        if data and len(data) > 1:
            headers = data[0]
            rows = data[1:]
            
            processed = []
            for row in rows:
                record = dict(zip(headers, row))
                processed.append({
                    'name': record.get('NAME'),
                    'stateFips': record.get('state'),
                    'countyFips': record.get('county'),
                    'fipsCode': f"{record.get('state')}{record.get('county')}",
                    'totalCVAP': census_api._parse_int(record.get('B05003_001E')),
                    'cvapWhite': census_api._parse_int(record.get('B05003_008E')),
                    'cvapBlack': census_api._parse_int(record.get('B05003_011E')),
                    'cvapHispanic': census_api._parse_int(record.get('B05003_021E')),
                    'cvapAsian': census_api._parse_int(record.get('B05003_012E')),
                })
            
            results[state_fips] = processed
        
        # Rate limiting
        time.sleep(0.5)
    
    return results


def download_demographics_for_states(api_key: str, state_fips_list: List[str],
                                     year: int = 2023) -> Dict[str, List[Dict]]:
    """
    Download demographic data for multiple states
    
    Args:
        api_key: Census API key
        state_fips_list: List of state FIPS codes
        year: Year for data
    
    Returns:
        Dict mapping state FIPS to list of county demographic data
    """
    census_api = CensusAPI(api_key)
    results = {}
    
    for state_fips in state_fips_list:
        logger.info(f"Downloading demographic data for state {state_fips}")
        
        data = census_api.get_demographic_data(year, state_fips)
        
        if data:
            results[state_fips] = data
        
        # Rate limiting
        time.sleep(0.5)
    
    return results
