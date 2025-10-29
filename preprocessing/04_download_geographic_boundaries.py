#!/usr/bin/env python3
"""
Prepro-4: Download Geographic Boundaries for Detailed States

This script downloads county/town boundaries for Arkansas, Maryland, and Rhode Island
and stores them in the database.
"""
import sys
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config, get_state_fips_mapping
from utils.geojson_tools import (
    shapefile_to_geojson, calculate_centroid, calculate_zoom_level,
    filter_geojson_by_state
)
from utils.data_sources import CENSUS_BOUNDARIES
import requests
import zipfile

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GeographicBoundaryProcessor:
    """Processes geographic boundaries for detailed states"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'boundaries'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Get detailed states
        detailed_states = self.config['detailedStates']['stateAbbrs']
        self.state_fips = get_state_fips_mapping()
        self.detailed_state_fips = [self.state_fips[abbr] for abbr in detailed_states]
        
        logger.info(f"Processing boundaries for: {detailed_states}")
    
    def download_and_extract(self, url: str, filename: str) -> Path:
        """Download and extract boundary shapefile"""
        filepath = self.cache_dir / filename
        extract_dir = filepath.parent / filepath.stem
        
        # Check if already extracted
        if extract_dir.exists() and list(extract_dir.rglob('*.shp')):
            logger.info(f"Using extracted files in {extract_dir}")
            return extract_dir
        
        # Download if needed
        if not filepath.exists():
            logger.info(f"Downloading {filename}...")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        else:
            logger.info(f"Using cached file: {filepath}")
        
        # Extract
        extract_dir.mkdir(exist_ok=True)
        logger.info(f"Extracting {filename}...")
        with zipfile.ZipFile(filepath, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        return extract_dir
    
    def process_county_boundaries(self):
        """Process county boundaries for detailed states"""
        # Download county shapefile
        extract_dir = self.download_and_extract(
            CENSUS_BOUNDARIES['counties_2020'],
            'cb_2020_us_county_20m.zip'
        )
        
        # Find shapefile - it might be in a subdirectory
        shapefiles = list(extract_dir.rglob('*.shp'))
        if not shapefiles:
            logger.error(f"No shapefile found in {extract_dir}")
            logger.error(f"Contents: {list(extract_dir.glob('*'))}")
            raise FileNotFoundError(f"No .shp file found in {extract_dir}")
        
        shapefile = shapefiles[0]
        logger.info(f"Converting {shapefile.name} to GeoJSON...")
        
        geojson = shapefile_to_geojson(str(shapefile))
        
        documents = []
        
        for state_fips in self.detailed_state_fips:
            logger.info(f"\nProcessing counties for state FIPS {state_fips}...")
            
            # Filter to this state
            state_geojson = filter_geojson_by_state(geojson, state_fips)
            
            for feature in state_geojson.get('features', []):
                geometry = feature['geometry']
                properties = feature['properties']
                
                # Get county FIPS (state + county)
                county_fips = properties.get('GEOID') or f"{state_fips}{properties.get('COUNTYFP', '')}"
                county_name = properties.get('NAME', 'Unknown')
                state_name = properties.get('NAMELSAD', 'Unknown')
                
                # Calculate center and zoom
                centroid = calculate_centroid(geometry)
                zoom = calculate_zoom_level(geometry)
                
                document = {
                    'fipsCode': county_fips,
                    'jurisdiction': county_name,
                    'state': state_name,
                    'boundaryType': 'county',
                    'boundaryData': geometry,
                    'centerPoint': {
                        'x': centroid[0],
                        'y': centroid[1]
                    },
                    'appropriateZoomLevel': zoom
                }
                
                documents.append(document)
                logger.info(f"  {county_name} County (FIPS: {county_fips})")
        
        # Store in database
        if documents:
            logger.info(f"\nStoring {len(documents)} county boundaries...")
            self.db.bulk_upsert('boundaryData', documents, key_field='fipsCode')
            logger.info(f"✓ Stored {len(documents)} county boundaries")
        
        return len(documents)


def main():
    """Main execution"""
    try:
        processor = GeographicBoundaryProcessor()
        count = processor.process_county_boundaries()
        
        logger.info(f"\n✓ Successfully processed {count} geographic boundaries!")
        logger.info("Next step: Run 05_calculate_data_completeness.py")
        
    except Exception as e:
        logger.error(f"Error processing boundaries: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
