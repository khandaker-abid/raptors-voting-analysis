"""
Geocoding utilities for converting addresses to coordinates and census blocks
"""
import logging
import time
from typing import Dict, Tuple, Optional, List
from pathlib import Path
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import requests
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_config(config_path='config.json'):
    """Load configuration from JSON file"""
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_file, 'r') as f:
        return json.load(f)


class CensusGeocoder:
    """Geocoder using US Census Bureau Geocoding API"""
    
    BASE_URL = "https://geocoding.geo.census.gov/geocoder/geographies/address"
    
    def __init__(self, benchmark: str = "Public_AR_Current", vintage: str = "Current_Current"):
        self.benchmark = benchmark
        self.vintage = vintage
        self.session = requests.Session()
        self.rate_limit_delay = 0.1  # 100ms between requests
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def geocode_address(self, street: str, city: str, state: str, zip_code: str = None) -> Optional[Dict]:
        """
        Geocode an address to get lat/lon and census geography
        
        Returns:
            Dict with keys: lat, lon, censusBlock, censusTract, county
        """
        self._rate_limit()
        
        params = {
            'street': street,
            'city': city,
            'state': state,
            'benchmark': self.benchmark,
            'vintage': self.vintage,
            'format': 'json'
        }
        
        if zip_code:
            params['zip'] = zip_code
        
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('result', {}).get('addressMatches'):
                match = data['result']['addressMatches'][0]
                coordinates = match.get('coordinates', {})
                geographies = match.get('geographies', {})
                
                # Extract census block
                census_blocks = geographies.get('Census Blocks', [])
                census_block = census_blocks[0] if census_blocks else {}
                
                # Extract county
                counties = geographies.get('Counties', [])
                county = counties[0] if counties else {}
                
                return {
                    'lat': coordinates.get('y'),
                    'lon': coordinates.get('x'),
                    'censusBlock': census_block.get('GEOID'),
                    'censusTract': census_block.get('TRACT'),
                    'countyFips': county.get('COUNTY'),
                    'stateFips': county.get('STATE'),
                    'matchedAddress': match.get('matchedAddress')
                }
            
            return None
            
        except requests.RequestException as e:
            logger.error(f"Census geocoding error: {e}")
            return None
    
    def batch_geocode(self, addresses: List[Dict]) -> List[Dict]:
        """
        Geocode multiple addresses
        
        addresses: List of dicts with keys: street, city, state, zip
        Returns: List of geocoding results
        """
        results = []
        
        for i, addr in enumerate(addresses):
            if i > 0 and i % 100 == 0:
                logger.info(f"Geocoded {i}/{len(addresses)} addresses")
            
            result = self.geocode_address(
                addr.get('street', ''),
                addr.get('city', ''),
                addr.get('state', ''),
                addr.get('zip')
            )
            results.append(result)
        
        return results


class FallbackGeocoder:
    """Fallback geocoder using Nominatim (OpenStreetMap)"""
    
    def __init__(self, user_agent: str = "voting_analysis_app"):
        self.geocoder = Nominatim(user_agent=user_agent)
        self.rate_limit_delay = 1.0  # 1 second between requests for Nominatim
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to get lat/lon only
        
        Returns:
            Tuple of (lat, lon) or None
        """
        self._rate_limit()
        
        try:
            location = self.geocoder.geocode(address, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            return None
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Nominatim geocoding error: {e}")
            return None


class CompositeGeocoder:
    """Composite geocoder that tries Census first, then falls back to Nominatim"""
    
    def __init__(self, config_path='config.json', use_fallback: bool = True):
        self.config = load_config(config_path)
        self.census_geocoder = CensusGeocoder()
        self.fallback_geocoder = FallbackGeocoder() if use_fallback else None
        self.cache = {}
        
        # Load cache if exists
        cache_dir = Path(self.config['processing']['cacheDir']) / 'geocoding'
        cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file = cache_dir / 'geocoding_cache.json'
        self.load_cache(str(self.cache_file))
    
    def geocode(self, full_address: str) -> Optional[Dict]:
        """
        Geocode a full address string using Census API, with fallback to Nominatim
        
        Args:
            full_address: Complete address as string (e.g., "123 Main St, City, ST 12345")
        
        Returns:
            Dict with geocoding results including lat, lon, census_block
        """
        # Create cache key
        cache_key = full_address.strip().lower()
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Parse address components
        parts = [p.strip() for p in full_address.split(',')]
        
        street = parts[0] if len(parts) > 0 else ''
        city = parts[1] if len(parts) > 1 else ''
        
        # Parse state and zip from last part
        state = ''
        zip_code = ''
        if len(parts) > 2:
            state_zip = parts[2].split()
            state = state_zip[0] if len(state_zip) > 0 else ''
            zip_code = state_zip[1] if len(state_zip) > 1 else ''
        
        # Try Census geocoder first
        result = self.census_geocoder.geocode_address(street, city, state, zip_code)
        
        if result:
            result['source'] = 'census'
            result['census_block'] = result.get('censusBlock')
        
        # If Census fails and we have fallback, try Nominatim
        if not result and self.fallback_geocoder:
            coords = self.fallback_geocoder.geocode_address(full_address)
            if coords:
                result = {
                    'lat': coords[0],
                    'lon': coords[1],
                    'census_block': None,  # Nominatim doesn't provide this
                    'source': 'nominatim'
                }
        
        # Cache result
        if result:
            self.cache[cache_key] = result
            
            # Save cache periodically (every 100 new entries)
            if len(self.cache) % 100 == 0:
                self.save_cache(str(self.cache_file))
        
        return result
    
    def save_cache(self, filepath: str):
        """Save geocoding cache to file"""
        with open(filepath, 'w') as f:
            json.dump(self.cache, f)
        logger.info(f"Saved {len(self.cache)} geocoding results to cache")
    
    def load_cache(self, filepath: str):
        """Load geocoding cache from file"""
        try:
            with open(filepath, 'r') as f:
                self.cache = json.load(f)
            logger.info(f"Loaded {len(self.cache)} geocoding results from cache")
        except FileNotFoundError:
            logger.warning(f"Cache file not found: {filepath}")


def geocode_batch_with_progress(addresses: List[Dict], output_file: str = None) -> List[Dict]:
    """
    Geocode a batch of addresses with progress tracking
    
    addresses: List of dicts with keys: street, city, state, zip
    output_file: Optional file to save results incrementally
    
    Returns: List of geocoding results
    """
    geocoder = CompositeGeocoder()
    results = []
    
    from tqdm import tqdm
    
    for i, addr in enumerate(tqdm(addresses, desc="Geocoding addresses")):
        result = geocoder.geocode(
            addr.get('street', ''),
            addr.get('city', ''),
            addr.get('state', ''),
            addr.get('zip')
        )
        
        results.append({
            'input': addr,
            'result': result
        })
        
        # Save incrementally every 1000 addresses
        if output_file and i > 0 and i % 1000 == 0:
            with open(output_file, 'w') as f:
                json.dump(results, f)
    
    # Final save
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(results, f)
    
    return results
