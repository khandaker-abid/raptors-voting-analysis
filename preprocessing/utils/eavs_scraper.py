"""
EAVS URL Scraper - Automatically finds and validates EAVS dataset URLs
"""
import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class EAVSScraper:
    """Scrapes EAC website to find EAVS dataset URLs"""
    
    BASE_URL = 'https://www.eac.gov'
    DATASETS_PAGE = 'https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys'
    
    # Alternative known URLs from different release patterns
    KNOWN_PATTERNS = [
        # Pattern 1: /sites/default/files/YEAR/EAVS_YYYY_Dataset.xlsx
        'https://www.eac.gov/sites/default/files/{year}/EAVS_{year}_Dataset.xlsx',
        # Pattern 2: /sites/default/files/eac_assets/YYYY/EAVS_YYYY_Dataset.xlsx
        'https://www.eac.gov/sites/default/files/eac_assets/{year}/EAVS_{year}_Dataset.xlsx',
        # Pattern 3: Direct year in path variations
        'https://www.eac.gov/sites/default/files/{release_year}/EAVS_{year}_Dataset.xlsx',
        # Pattern 4: Research and data directory
        'https://www.eac.gov/sites/default/files/research/EAVS_{year}_Dataset.xlsx',
        # Pattern 5: Documents directory
        'https://www.eac.gov/document/{year}-eavs-dataset',
        # Pattern 6: Document library variations
        'https://www.eac.gov/sites/default/files/document_library/files/EAVS_{year}_Dataset.xlsx',
    ]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def find_eavs_url(self, year: int) -> Optional[str]:
        """Find the correct URL for a specific EAVS year"""
        
        # First, try known patterns with HEAD requests
        logger.info(f"Trying known URL patterns for EAVS {year}...")
        url = self._try_known_patterns(year)
        if url:
            return url
        
        # Second, scrape the datasets page
        logger.info(f"Scraping EAC datasets page for EAVS {year}...")
        url = self._scrape_datasets_page(year)
        if url:
            return url
        
        # Third, try search functionality
        logger.info(f"Searching EAC website for EAVS {year}...")
        url = self._search_eac_site(year)
        if url:
            return url
        
        logger.warning(f"Could not find URL for EAVS {year}")
        return None
    
    def _try_known_patterns(self, year: int) -> Optional[str]:
        """Try known URL patterns with HEAD requests"""
        
        # Generate release year variations (dataset for year X might be released in year X+1)
        release_years = [year, year + 1, year + 2]
        
        for pattern in self.KNOWN_PATTERNS:
            for release_year in release_years:
                try:
                    url = pattern.format(year=year, release_year=release_year)
                    logger.debug(f"Trying: {url}")
                    
                    response = self.session.head(url, timeout=10, allow_redirects=True)
                    if response.status_code == 200:
                        # Verify it's actually an Excel file
                        content_type = response.headers.get('Content-Type', '')
                        if 'excel' in content_type.lower() or 'spreadsheet' in content_type.lower():
                            logger.info(f"✓ Found EAVS {year}: {url}")
                            return url
                        # Some servers don't set Content-Type correctly, check file extension
                        elif url.endswith('.xlsx') or url.endswith('.xls'):
                            logger.info(f"✓ Found EAVS {year}: {url}")
                            return url
                            
                except requests.RequestException as e:
                    logger.debug(f"Pattern failed: {e}")
                    continue
        
        return None
    
    def _scrape_datasets_page(self, year: int) -> Optional[str]:
        """Scrape the EAC datasets page to find download links"""
        
        try:
            response = self.session.get(self.DATASETS_PAGE, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for links containing the year and "EAVS" or "dataset"
            patterns = [
                rf'EAVS.*{year}.*Dataset',
                rf'{year}.*EAVS.*Dataset',
                rf'Election.*Administration.*Voting.*Survey.*{year}',
            ]
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                text = link.get_text()
                
                # Check if link text or href matches our patterns
                for pattern in patterns:
                    if re.search(pattern, text, re.IGNORECASE) or re.search(pattern, href, re.IGNORECASE):
                        # Make absolute URL
                        if href.startswith('http'):
                            url = href
                        else:
                            url = self.BASE_URL + href if href.startswith('/') else f"{self.BASE_URL}/{href}"
                        
                        # Verify it's an Excel file
                        if url.endswith('.xlsx') or url.endswith('.xls'):
                            if self._verify_url(url):
                                logger.info(f"✓ Found EAVS {year} via scraping: {url}")
                                return url
                        
                        # If it's a page, try to find download link on that page
                        elif not url.endswith(('.pdf', '.zip', '.csv')):
                            file_url = self._find_download_on_page(url, year)
                            if file_url:
                                return file_url
            
        except Exception as e:
            logger.debug(f"Scraping failed: {e}")
        
        return None
    
    def _find_download_on_page(self, page_url: str, year: int) -> Optional[str]:
        """Find download link on a specific page"""
        
        try:
            response = self.session.get(page_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for download links
            for link in soup.find_all('a', href=True):
                href = link['href']
                text = link.get_text().lower()
                
                if ('download' in text or 'dataset' in text or 'excel' in text) and \
                   (href.endswith('.xlsx') or href.endswith('.xls')):
                    
                    # Make absolute URL
                    if href.startswith('http'):
                        url = href
                    else:
                        url = self.BASE_URL + href if href.startswith('/') else f"{self.BASE_URL}/{href}"
                    
                    if self._verify_url(url):
                        logger.info(f"✓ Found EAVS {year} on page: {url}")
                        return url
                        
        except Exception as e:
            logger.debug(f"Page scraping failed: {e}")
        
        return None
    
    def _search_eac_site(self, year: int) -> Optional[str]:
        """Use EAC site search to find EAVS dataset"""
        
        search_url = f"{self.BASE_URL}/search"
        search_terms = [
            f"EAVS {year} dataset",
            f"Election Administration Voting Survey {year}",
        ]
        
        for term in search_terms:
            try:
                response = self.session.get(
                    search_url,
                    params={'search': term},
                    timeout=30
                )
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Look for Excel file links in search results
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if href.endswith('.xlsx') or href.endswith('.xls'):
                            if str(year) in href or str(year) in link.get_text():
                                url = href if href.startswith('http') else f"{self.BASE_URL}{href}"
                                if self._verify_url(url):
                                    logger.info(f"✓ Found EAVS {year} via search: {url}")
                                    return url
                                    
            except Exception as e:
                logger.debug(f"Search failed: {e}")
        
        return None
    
    def _verify_url(self, url: str) -> bool:
        """Verify that a URL points to a valid file"""
        try:
            response = self.session.head(url, timeout=10, allow_redirects=True)
            return response.status_code == 200
        except:
            return False
    
    def get_all_eavs_urls(self) -> Dict[int, str]:
        """Get URLs for all required EAVS years"""
        years = [2024, 2020, 2016]
        urls = {}
        
        for year in years:
            url = self.find_eavs_url(year)
            if url:
                urls[year] = url
        
        return urls


def update_data_sources_file(urls: Dict[int, str], data_sources_path: str):
    """Update the data_sources.py file with discovered URLs"""
    
    import os
    
    if not urls:
        logger.warning("No URLs to update")
        return
    
    # Read current file
    with open(data_sources_path, 'r') as f:
        content = f.read()
    
    # Update URLs
    for year, url in urls.items():
        # Pattern to match the URL line for this year
        pattern = rf"(    {year}: {{\s*\n\s*'url':\s*)'[^']*'"
        replacement = rf"\1'{url}'"
        content = re.sub(pattern, replacement, content)
    
    # Write back
    with open(data_sources_path, 'w') as f:
        f.write(content)
    
    logger.info(f"Updated {data_sources_path} with {len(urls)} URLs")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    scraper = EAVSScraper()
    urls = scraper.get_all_eavs_urls()
    
    print("\n" + "="*70)
    print("DISCOVERED EAVS URLS")
    print("="*70)
    for year, url in urls.items():
        print(f"{year}: {url}")
    print("="*70)
