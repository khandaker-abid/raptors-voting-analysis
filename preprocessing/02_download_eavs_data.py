#!/usr/bin/env python3
"""
Prepro-2: Download EAVS (Election Administration and Voting Survey) Data

This script downloads EAVS datasets from the US Election Assistance Commission
for the years 2016, 2020, and 2024.

The script automatically discovers the correct URLs by:
1. Trying known URL patterns
2. Scraping the EAC datasets page
3. Using EAC site search
"""
import os
import sys
import requests
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import load_config
from utils.data_sources import EAVS_SOURCES
from utils.eavs_scraper import EAVSScraper, update_data_sources_file

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class EAVSDownloader:
    """Downloads EAVS datasets with automatic URL discovery"""
    
    def __init__(self, config_path='config.json'):
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'eavs'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.scraper = EAVSScraper()
        self.discovered_urls = {}
    
    def find_working_url(self, year: int) -> str:
        """Find a working URL for the given year"""
        
        # First check if the configured URL works
        source_info = EAVS_SOURCES.get(year)
        if source_info:
            url = source_info['url']
            logger.info(f"Testing configured URL for {year}: {url}")
            
            try:
                response = requests.head(url, timeout=10, allow_redirects=True)
                if response.status_code == 200:
                    logger.info(f"✓ Configured URL works for {year}")
                    return url
                else:
                    logger.warning(f"Configured URL returned {response.status_code} for {year}")
            except Exception as e:
                logger.warning(f"Configured URL failed for {year}: {e}")
        
        # If configured URL doesn't work, use scraper to find it
        logger.info(f"Discovering URL for EAVS {year}...")
        discovered_url = self.scraper.find_eavs_url(year)
        
        if discovered_url:
            self.discovered_urls[year] = discovered_url
            return discovered_url
        
        return None
    
    def download_eavs_file(self, year: int) -> Path:
        """Download EAVS file for a specific year with automatic URL discovery"""
        
        filename = f'EAVS_{year}_Dataset.xlsx'
        filepath = self.cache_dir / filename
        
        # Check if already downloaded
        if filepath.exists():
            logger.info(f"✓ EAVS {year} already downloaded: {filepath}")
            return filepath
        
        # Find working URL
        url = self.find_working_url(year)
        
        if not url:
            logger.error(f"Could not find working URL for EAVS {year}")
            logger.error(f"Please download manually from: https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys")
            logger.error(f"Save as: {filepath}")
            return None
        
        logger.info(f"Downloading EAVS {year} from {url}...")
        
        try:
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            
            # Get file size for progress
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f:
                if total_size == 0:
                    f.write(response.content)
                else:
                    downloaded = 0
                    chunk_size = 8192
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            percent = (downloaded / total_size) * 100
                            if downloaded % (chunk_size * 100) == 0:
                                logger.info(f"  Progress: {percent:.1f}% ({downloaded}/{total_size} bytes)")
            
            logger.info(f"✓ Downloaded EAVS {year} to {filepath}")
            return filepath
            
        except requests.RequestException as e:
            logger.error(f"Failed to download EAVS {year}: {e}")
            logger.error(f"Please download manually from: {url}")
            logger.error(f"Save as: {filepath}")
            return None
    
    def download_all(self):
        """Download all EAVS datasets with automatic URL discovery"""
        years = [2024, 2020, 2016]
        results = {}
        
        for year in years:
            filepath = self.download_eavs_file(year)
            results[year] = filepath
        
        # Update data_sources.py with discovered URLs
        if self.discovered_urls:
            logger.info("\nUpdating data_sources.py with discovered URLs...")
            data_sources_path = Path(__file__).parent / 'utils' / 'data_sources.py'
            try:
                update_data_sources_file(self.discovered_urls, str(data_sources_path))
                logger.info("✓ Updated data_sources.py")
            except Exception as e:
                logger.warning(f"Could not update data_sources.py: {e}")
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("EAVS DOWNLOAD SUMMARY")
        logger.info("="*70)
        
        for year, filepath in results.items():
            if filepath and filepath.exists():
                size_mb = filepath.stat().st_size / (1024 * 1024)
                logger.info(f"✓ {year}: {filepath} ({size_mb:.1f} MB)")
            else:
                logger.warning(f"✗ {year}: Download failed or file not found")
        
        logger.info("="*70)
        
        success_count = sum(1 for fp in results.values() if fp and fp.exists())
        logger.info(f"\nSuccessfully downloaded {success_count}/{len(years)} EAVS datasets")
        
        if success_count < len(years):
            logger.warning("\nSome downloads failed. Manual download instructions:")
            logger.warning("1. Visit: https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys")
            logger.warning(f"2. Download missing years to: {self.cache_dir}")
            logger.warning("3. Ensure files are named: EAVS_YYYY_Dataset.xlsx")
        
        return results


def main():
    """Main execution"""
    try:
        downloader = EAVSDownloader()
        results = downloader.download_all()
        
        # Check if any downloads succeeded
        if any(fp and fp.exists() for fp in results.values()):
            logger.info("\n✓ EAVS download complete!")
            logger.info("Next step: Run 03_populate_eavs_db.py to load data into MongoDB")
        else:
            logger.error("\n✗ All downloads failed. Please download manually.")
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Error downloading EAVS data: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
