#!/usr/bin/env python3
"""
Prepro-1: Download and process boundary data for all 48 mainland states

This script:
1. Downloads state boundary data from US Census Bureau
2. Processes GeoJSON for each state
3. Calculates geographical center point
4. Determines appropriate zoom level
5. Stores in MongoDB BoundaryData collection
"""
import os
import sys
import requests
import zipfile
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, get_all_mainland_states, get_state_fips_mapping
from utils.geojson_tools import (
    shapefile_to_geojson, calculate_centroid, calculate_zoom_level,
    filter_geojson_by_state, load_geojson
)
from utils.data_sources import CENSUS_BOUNDARIES

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BoundaryDataProcessor:
    """Processes and stores boundary data for states"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.cache_dir = Path('./cache/boundaries')
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def download_census_boundaries(self, url: str, filename: str) -> Path:
        """Download boundary shapefile from Census Bureau"""
        filepath = self.cache_dir / filename
        
        if filepath.exists():
            logger.info(f"Using cached file: {filepath}")
            return filepath
        
        logger.info(f"Downloading {filename}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.info(f"Downloaded to {filepath}")
        return filepath
    
    def extract_shapefile(self, zip_path: Path) -> Path:
        """Extract shapefile from ZIP"""
        extract_dir = zip_path.parent / zip_path.stem
        extract_dir.mkdir(exist_ok=True)
        
        if list(extract_dir.glob('*.shp')):
            logger.info(f"Using extracted files in {extract_dir}")
            return extract_dir
        
        logger.info(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        return extract_dir
    
    def process_state_boundaries(self):
        """Process all mainland state boundaries"""
        # Download and extract state boundaries
        zip_file = self.download_census_boundaries(
            CENSUS_BOUNDARIES['states_2024'],
            'cb_2024_us_state_20m.zip'
        )
        
        extract_dir = self.extract_shapefile(zip_file)
        shapefile = list(extract_dir.glob('*.shp'))[0]
        
        # Convert to GeoJSON
        logger.info("Converting shapefile to GeoJSON...")
        geojson = shapefile_to_geojson(str(shapefile))
        
        # Process each mainland state
        state_fips = get_state_fips_mapping()
        mainland_states = get_all_mainland_states()
        
        documents = []
        
        for state_abbr in mainland_states:
            fips_code = state_fips[state_abbr]
            
            logger.info(f"Processing {state_abbr} (FIPS: {fips_code})...")
            
            # Filter GeoJSON for this state
            state_geojson = filter_geojson_by_state(geojson, fips_code)
            
            if not state_geojson.get('features'):
                logger.warning(f"No features found for {state_abbr}")
                continue
            
            feature = state_geojson['features'][0]
            geometry = feature['geometry']
            properties = feature['properties']
            
            # Calculate center point
            centroid = calculate_centroid(geometry)
            
            # Calculate appropriate zoom level
            zoom = calculate_zoom_level(geometry)
            
            # Get state name
            state_name = properties.get('NAME') or properties.get('STUSPS') or state_abbr
            
            # Create document
            document = {
                'fipsCode': fips_code,
                'jurisdiction': state_name,
                'state': state_name,
                'stateAbbr': state_abbr,
                'boundaryType': 'state',
                'boundaryData': geometry,
                'centerPoint': {
                    'x': centroid[0],  # longitude
                    'y': centroid[1]   # latitude
                },
                'appropriateZoomLevel': zoom
            }
            
            documents.append(document)
            logger.info(f"  Center: ({centroid[0]:.4f}, {centroid[1]:.4f}), Zoom: {zoom}")
        
        # Store in database
        if documents:
            logger.info(f"Storing {len(documents)} state boundaries in database...")
            
            # Check if data already exists
            collection = self.db.get_collection('boundaryData')
            existing_count = collection.count_documents({'boundaryType': 'state'})
            
            if existing_count == len(documents):
                logger.info(f"Database already contains {existing_count} state boundaries")
                logger.info("Checking if update is needed...")
                
                # Sample check - verify a few random states
                sample_states = ['06', '48', '36']  # CA, TX, NY
                needs_update = False
                for fips in sample_states:
                    existing = collection.find_one({'fipsCode': fips, 'boundaryType': 'state'})
                    if not existing or not existing.get('boundaryData'):
                        needs_update = True
                        break
                
                if not needs_update:
                    logger.info("✓ State boundaries are up-to-date - skipping upsert")
                    return len(documents)
                else:
                    logger.info("State boundaries need updating...")
            
            # Upsert the data
            upserted = self.db.bulk_upsert('boundaryData', documents, key_field='fipsCode')
            logger.info(f"State boundaries stored successfully! (upserted: {upserted})")
        
        return len(documents)


def main():
    """Main execution"""
    try:
        processor = BoundaryDataProcessor()
        count = processor.process_state_boundaries()
        logger.info(f"Successfully processed {count} state boundaries")
        
    except Exception as e:
        logger.error(f"Error processing boundaries: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
