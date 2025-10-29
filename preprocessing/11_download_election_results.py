#!/usr/bin/env python3
"""
Prepro-11: Download Election Results

This script downloads 2024 Presidential election results for detailed states
and stores them in the database with dominant party information.

Supports automated scraping for:
- Arkansas (AR): Secretary of State website
- Maryland (MD): State Board of Elections
- Rhode Island (RI): Board of Elections
"""
import sys
import logging
from pathlib import Path
import csv
import re
from typing import List, Dict, Optional

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config, get_state_fips_mapping
from utils.data_sources import ELECTION_RESULTS_SOURCES
import requests
from bs4 import BeautifulSoup
import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ElectionResultsDownloader:
    """Downloads and processes election results with state-specific scrapers"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'election_results'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.detailed_states = self.config['detailedStates']['stateAbbrs']
        self.state_fips = get_state_fips_mapping()
        
        # Enhanced headers to avoid bot detection
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        logger.info(f"Processing election results for: {self.detailed_states}")
    
    def scrape_arkansas_results(self) -> List[Dict]:
        """
        Scrape Arkansas 2024 Presidential election results
        Uses MIT Election Lab as primary source (more reliable than state site)
        """
        logger.info("Processing Arkansas election results...")
        
        try:
            # Check for MIT data file in cache first (committed to repo)
            mit_cache_file = self.cache_dir / 'countypres_2000-2024.csv'
            
            if mit_cache_file.exists():
                logger.info(f"✓ Found MIT Election Lab data in cache: {mit_cache_file}")
                df = pd.read_csv(mit_cache_file)
                # Filter for Arkansas and 2024
                ar_data = df[(df['state'].str.upper() == 'ARKANSAS') & (df['year'] == 2024)]
                
                if len(ar_data) > 0:
                    results = self._parse_mit_dataframe(ar_data, 'AR')
                    logger.info(f"✓ Loaded {len(results)} Arkansas county results from cache")
                    return results
                else:
                    logger.warning("No 2024 Arkansas data found in MIT file")
            
            # MIT Election Lab provides county-level presidential results
            # This is more reliable than scraping state websites
            mit_url = "https://dataverse.harvard.edu/api/access/datafile/7634"
            
            logger.info(f"Downloading from MIT Election Lab...")
            response = requests.get(mit_url, headers=self.headers, timeout=30)
            
            if response.status_code != 200:
                logger.warning(f"MIT Election Lab returned {response.status_code}")
                # Fallback: try state website
                return self._scrape_arkansas_state_site()
            
            # Save CSV
            csv_path = self.cache_dir / 'countypres_2024.csv'
            with open(csv_path, 'wb') as f:
                f.write(response.content)
            
            # Parse MIT data for Arkansas only
            df = pd.read_csv(csv_path)
            ar_data = df[df['state'] == 'ARKANSAS']
            
            results = self._parse_mit_dataframe(ar_data, 'AR')
            
            logger.info(f"✓ Downloaded {len(results)} Arkansas county results from MIT")
            return results
            
        except Exception as e:
            logger.error(f"Failed to download from MIT Election Lab: {e}")
            # Try state website as fallback
            return self._scrape_arkansas_state_site()
    
    def _scrape_arkansas_state_site(self) -> List[Dict]:
        """Fallback: Try Arkansas state website"""
        logger.info("Attempting Arkansas Secretary of State website...")
        
        try:
            # Try direct CSV download if available
            base_url = "https://results.arkansas.gov"
            response = requests.get(f"{base_url}/", headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for 2024 General Election link
            election_link = None
            for link in soup.find_all('a', href=True):
                if '2024' in link.text and 'General' in link.text:
                    election_link = link['href']
                    break
            
            if not election_link:
                logger.warning("Could not find 2024 General Election link for Arkansas")
                # Fallback: try direct URL pattern
                election_link = f"{base_url}/120588/web.307039"  # Pattern from previous elections
            
            # Get detailed results page
            results_url = f"{base_url}/{election_link.strip('/')}/reports/detailxls.zip"
            
            logger.info(f"Downloading from: {results_url}")
            response = requests.get(results_url, timeout=30)
            response.raise_for_status()
            
            # Save ZIP file
            zip_path = self.cache_dir / 'ar_results_2024.zip'
            with open(zip_path, 'wb') as f:
                f.write(response.content)
            
            # Extract and parse
            import zipfile
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.cache_dir / 'ar_2024')
            
            # Find the presidential results file
            excel_files = list((self.cache_dir / 'ar_2024').glob('*President*.xls*'))
            if not excel_files:
                raise FileNotFoundError("Could not find Presidential results in downloaded files")
            
            df = pd.read_excel(excel_files[0])
            
            # Parse DataFrame to extract county-level results
            results = self._parse_arkansas_dataframe(df)
            
            logger.info(f"✓ Scraped {len(results)} Arkansas county results")
            return results
            
        except Exception as e:
            logger.error(f"Failed to scrape Arkansas results: {e}")
            return []
    
    def _scrape_arkansas_state_site(self) -> List[Dict]:
        """Fallback: Try Arkansas state website"""
        logger.info("Attempting Arkansas Secretary of State website...")
        
        try:
            # Try direct CSV download if available
            base_url = "https://results.arkansas.gov"
            response = requests.get(f"{base_url}/", headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for 2024 results link
            for link in soup.find_all('a', href=True):
                if '2024' in link.text and 'general' in link.text.lower():
                    logger.info(f"Found 2024 election link: {link.text}")
                    # Would need to download and parse from here
                    break
            
            logger.warning("Could not find direct download link on Arkansas website")
            return []
            
        except Exception as e:
            logger.error(f"Arkansas state website failed: {e}")
            return []
    
    def scrape_maryland_results(self) -> List[Dict]:
        """
        Scrape Maryland 2024 Presidential election results
        Uses multiple fallback sources for reliability
        """
        logger.info("Processing Maryland election results...")
        
        # Check for MIT data file in cache first (committed to repo)
        mit_cache_file = self.cache_dir / 'countypres_2000-2024.csv'
        
        if mit_cache_file.exists():
            logger.info(f"✓ Found MIT Election Lab data in cache")
            try:
                df = pd.read_csv(mit_cache_file)
                # Filter for Maryland and 2024
                md_data = df[(df['state'].str.upper() == 'MARYLAND') & (df['year'] == 2024)]
                
                if len(md_data) > 0:
                    results = self._parse_mit_dataframe(md_data, 'MD')
                    logger.info(f"✓ Loaded {len(results)} Maryland county results from cache")
                    return results
                else:
                    logger.warning("No 2024 Maryland data found in MIT file")
            except Exception as e:
                logger.warning(f"Error reading MIT cache file: {e}")
        
        # Try MIT Election Lab download (fallback)
        try:
            logger.info("Trying MIT Election Lab download...")
            mit_url = "https://dataverse.harvard.edu/api/access/datafile/7634"
            response = requests.get(mit_url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                csv_path = self.cache_dir / 'countypres_2024.csv'
                with open(csv_path, 'wb') as f:
                    f.write(response.content)
                
                df = pd.read_csv(csv_path)
                md_data = df[df['state'] == 'MARYLAND']
                
                results = self._parse_mit_dataframe(md_data, 'MD')
                if results:
                    logger.info(f"✓ Downloaded {len(results)} Maryland results from MIT")
                    return results
        except Exception as e:
            logger.warning(f"MIT Election Lab download failed: {e}")
        
        # Fallback to Maryland state website
        try:
            logger.info("Trying Maryland State Board of Elections...")
            
            # Maryland publishes data on their elections page
            base_url = "https://elections.maryland.gov"
            
            # Try to find 2024 results page
            response = requests.get(f"{base_url}/elections/2024/index.html", 
                                   headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for CSV or Excel downloads
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if any(ext in href.lower() for ext in ['.csv', '.xls', '.xlsx']):
                        if 'president' in link.text.lower() or 'presidential' in link.text.lower():
                            file_url = href if href.startswith('http') else f"{base_url}{href}"
                            logger.info(f"Found results file: {file_url}")
                            
                            # Download and parse
                            file_response = requests.get(file_url, headers=self.headers, timeout=30)
                            if file_response.status_code == 200:
                                filepath = self.cache_dir / 'md_results_2024.csv'
                                with open(filepath, 'wb') as f:
                                    f.write(file_response.content)
                                
                                results = self._parse_maryland_csv(filepath)
                                if results:
                                    logger.info(f"✓ Scraped {len(results)} Maryland results")
                                    return results
        
        except Exception as e:
            logger.error(f"Failed to scrape Maryland results: {e}")
        
        return []
    
    def scrape_rhode_island_results(self) -> List[Dict]:
        """
        Scrape Rhode Island 2024 Presidential election results  
        Uses MIT Election Lab as primary source
        """
        logger.info("Processing Rhode Island election results...")
        
        # Check for MIT data file in cache first (committed to repo)
        mit_cache_file = self.cache_dir / 'countypres_2000-2024.csv'
        
        if mit_cache_file.exists():
            logger.info(f"✓ Found MIT Election Lab data in cache")
            try:
                df = pd.read_csv(mit_cache_file)
                # Filter for Rhode Island and 2024
                ri_data = df[(df['state'].str.upper() == 'RHODE ISLAND') & (df['year'] == 2024)]
                
                if len(ri_data) > 0:
                    results = self._parse_mit_dataframe(ri_data, 'RI')
                    logger.info(f"✓ Loaded {len(results)} Rhode Island county results from cache")
                    return results
                else:
                    logger.warning("No 2024 Rhode Island data found in MIT file")
            except Exception as e:
                logger.warning(f"Error reading MIT cache file: {e}")
        
        # Try MIT Election Lab download (fallback)
        try:
            logger.info("Trying MIT Election Lab download...")
            mit_url = "https://dataverse.harvard.edu/api/access/datafile/7634"
            response = requests.get(mit_url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                csv_path = self.cache_dir / 'countypres_2024.csv'
                with open(csv_path, 'wb') as f:
                    f.write(response.content)
                
                df = pd.read_csv(csv_path)
                ri_data = df[df['state'] == 'RHODE ISLAND']
                
                results = self._parse_mit_dataframe(ri_data, 'RI')
                if results:
                    logger.info(f"✓ Downloaded {len(results)} Rhode Island results from MIT")
                    return results
        except Exception as e:
            logger.warning(f"MIT Election Lab download failed: {e}")
        
        # Fallback to state website
        try:
            logger.info("Trying Rhode Island Board of Elections...")
            base_url = "https://elections.ri.gov"
            
            response = requests.get(f"{base_url}/elections/2024/", 
                                   headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for results links
                for link in soup.find_all('a', href=True):
                    if 'result' in link.text.lower() and 'president' in link.text.lower():
                        logger.info(f"Found potential results link: {link.text}")
                        # Would need further processing
                        break
            
            logger.warning("Could not find downloadable results on RI website")
            return []
            
        except Exception as e:
            logger.error(f"Failed to scrape Rhode Island results: {e}")
            return []
    
    def _parse_mit_dataframe(self, df: pd.DataFrame, state_abbr: str) -> List[Dict]:
        """Parse MIT Election Lab data format"""
        results_by_county = {}
        
        # MIT format: columns include county_name, candidate, party, candidatevotes
        for _, row in df.iterrows():
            county = str(row.get('county_name', '')).strip()
            candidate = str(row.get('candidate', '')).strip()
            party = str(row.get('party', '')).strip()
            votes = int(row.get('candidatevotes', 0) or 0)
            
            if not county or county == 'nan':
                continue
            
            if county not in results_by_county:
                results_by_county[county] = {'Republican': 0, 'Democratic': 0, 'Other': 0}
            
            # Map party
            if 'REPUBLICAN' in party.upper() or party.upper() == 'R':
                results_by_county[county]['Republican'] += votes
            elif 'DEMOCRAT' in party.upper() or party.upper() == 'D':
                results_by_county[county]['Democratic'] += votes
            else:
                results_by_county[county]['Other'] += votes
        
        return self._format_results(results_by_county, state_abbr)
    
    def _parse_arkansas_dataframe(self, df: pd.DataFrame) -> List[Dict]:
        """Parse Arkansas election results DataFrame"""
        results_by_county = {}
        
        # Arkansas format: columns include County, Candidate, Party, Votes
        for _, row in df.iterrows():
            county = str(row.get('County', '')).strip()
            candidate = str(row.get('Candidate', '')).strip()
            party = str(row.get('Party', '')).strip()
            votes = int(row.get('Votes', 0) or 0)
            
            if not county or county == 'nan':
                continue
            
            if county not in results_by_county:
                results_by_county[county] = {'Republican': 0, 'Democratic': 0, 'Other': 0}
            
            # Map party
            if 'REP' in party.upper() or 'REPUBLICAN' in party.upper():
                results_by_county[county]['Republican'] += votes
            elif 'DEM' in party.upper() or 'DEMOCRATIC' in party.upper():
                results_by_county[county]['Democratic'] += votes
            else:
                results_by_county[county]['Other'] += votes
        
        return self._format_results(results_by_county, 'AR')
    
    def _parse_maryland_csv(self, filepath: Path) -> List[Dict]:
        """Parse Maryland election results CSV"""
        results_by_county = {}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Skip non-presidential races
                if 'President' not in row.get('Office', ''):
                    continue
                
                county = row.get('County', '').strip()
                candidate = row.get('Candidate', '').strip()
                votes = int(row.get('Votes', 0) or 0)
                
                if not county:
                    continue
                
                if county not in results_by_county:
                    results_by_county[county] = {'Republican': 0, 'Democratic': 0, 'Other': 0}
                
                # Determine party from candidate name
                if 'Trump' in candidate or 'Republican' in candidate:
                    results_by_county[county]['Republican'] += votes
                elif 'Harris' in candidate or 'Biden' in candidate or 'Democratic' in candidate:
                    results_by_county[county]['Democratic'] += votes
                else:
                    results_by_county[county]['Other'] += votes
        
        return self._format_results(results_by_county, 'MD')
    
    def _parse_rhode_island_dataframe(self, df: pd.DataFrame) -> List[Dict]:
        """Parse Rhode Island election results DataFrame"""
        results_by_county = {}
        
        # Rhode Island uses "City/Town" instead of County
        # We'll map these to the 5 RI counties
        town_to_county = self._get_ri_town_to_county_mapping()
        
        for _, row in df.iterrows():
            town = str(row.get('City/Town', '') or row.get('Municipality', '')).strip()
            candidate = str(row.get('Candidate', '')).strip()
            party = str(row.get('Party', '')).strip()
            votes = int(row.get('Votes', 0) or 0)
            
            if not town or town == 'nan':
                continue
            
            # Map town to county
            county = town_to_county.get(town, town)
            
            if county not in results_by_county:
                results_by_county[county] = {'Republican': 0, 'Democratic': 0, 'Other': 0}
            
            if 'REP' in party.upper() or 'REPUBLICAN' in party.upper():
                results_by_county[county]['Republican'] += votes
            elif 'DEM' in party.upper() or 'DEMOCRATIC' in party.upper():
                results_by_county[county]['Democratic'] += votes
            else:
                results_by_county[county]['Other'] += votes
        
        return self._format_results(results_by_county, 'RI')
    
    def _get_ri_town_to_county_mapping(self) -> Dict[str, str]:
        """Map Rhode Island towns to counties"""
        return {
            # Bristol County
            'Barrington': 'Bristol County', 'Bristol': 'Bristol County', 'Warren': 'Bristol County',
            # Kent County
            'Coventry': 'Kent County', 'East Greenwich': 'Kent County', 'Warwick': 'Kent County', 'West Warwick': 'Kent County',
            # Newport County
            'Jamestown': 'Newport County', 'Little Compton': 'Newport County', 'Middletown': 'Newport County',
            'Newport': 'Newport County', 'Portsmouth': 'Newport County', 'Tiverton': 'Newport County',
            # Providence County
            'Burrillville': 'Providence County', 'Central Falls': 'Providence County', 'Cranston': 'Providence County',
            'Cumberland': 'Providence County', 'East Providence': 'Providence County', 'Foster': 'Providence County',
            'Glocester': 'Providence County', 'Johnston': 'Providence County', 'Lincoln': 'Providence County',
            'North Providence': 'Providence County', 'North Smithfield': 'Providence County', 'Pawtucket': 'Providence County',
            'Providence': 'Providence County', 'Scituate': 'Providence County', 'Smithfield': 'Providence County',
            'Woonsocket': 'Providence County',
            # Washington County
            'Charlestown': 'Washington County', 'Exeter': 'Washington County', 'Hopkinton': 'Washington County',
            'Narragansett': 'Washington County', 'New Shoreham': 'Washington County', 'North Kingstown': 'Washington County',
            'Richmond': 'Washington County', 'South Kingstown': 'Washington County', 'Westerly': 'Washington County',
        }
    
    def _format_results(self, results_by_county: Dict, state_abbr: str) -> List[Dict]:
        """Format results into standardized documents"""
        documents = []
        state_fips = self.state_fips[state_abbr]
        
        for county, votes in results_by_county.items():
            total = votes['Republican'] + votes['Democratic'] + votes['Other']
            
            if total == 0:
                continue
            
            rep_pct = (votes['Republican'] / total) * 100
            dem_pct = (votes['Democratic'] / total) * 100
            
            # Determine dominant party
            if rep_pct > dem_pct:
                dominant = 'Republican'
                margin = rep_pct - dem_pct
            elif dem_pct > rep_pct:
                dominant = 'Democratic'
                margin = dem_pct - rep_pct
            else:
                dominant = 'Tie'
                margin = 0
            
            doc = {
                'stateFips': state_fips,
                'stateAbbr': state_abbr,
                'county': county,
                'electionYear': 2024,
                'electionType': 'Presidential',
                'results': {
                    'Republican': {
                        'votes': votes['Republican'],
                        'percentage': round(rep_pct, 2)
                    },
                    'Democratic': {
                        'votes': votes['Democratic'],
                        'percentage': round(dem_pct, 2)
                    },
                    'Other': {
                        'votes': votes['Other'],
                        'percentage': round((votes['Other'] / total * 100), 2)
                    },
                    'totalVotes': total
                },
                'dominantParty': dominant,
                'marginOfVictory': round(margin, 2)
            }
            
            documents.append(doc)
        
        return documents
    
    def download_file(self, url: str, filename: str) -> Path:
        """Download election results file"""
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
        
        logger.info(f"✓ Downloaded to {filepath}")
        return filepath
    
    def parse_results_csv(self, filepath: Path, state_abbr: str) -> list:
        """
        Parse election results CSV
        
        Expected format:
        - Columns: county, candidate, party, votes
        """
        logger.info(f"Parsing results from {filepath.name}...")
        
        results_by_county = {}
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    county = row.get('county') or row.get('COUNTY') or row.get('County')
                    candidate = row.get('candidate') or row.get('CANDIDATE') or row.get('Candidate')
                    party = row.get('party') or row.get('PARTY') or row.get('Party')
                    votes = int(row.get('votes', 0) or row.get('VOTES', 0) or 0)
                    
                    if not county:
                        continue
                    
                    # Normalize party
                    party_normalized = 'Republican' if 'REP' in party.upper() or 'REPUBLICAN' in party.upper() else \
                                     'Democratic' if 'DEM' in party.upper() or 'DEMOCRATIC' in party.upper() else \
                                     'Other'
                    
                    # Aggregate by county
                    if county not in results_by_county:
                        results_by_county[county] = {
                            'Republican': 0,
                            'Democratic': 0,
                            'Other': 0,
                            'total': 0
                        }
                    
                    results_by_county[county][party_normalized] += votes
                    results_by_county[county]['total'] += votes
        
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            raise
        
        # Convert to documents
        documents = []
        state_fips = self.state_fips[state_abbr]
        
        for county, votes in results_by_county.items():
            total = votes['total']
            rep_votes = votes['Republican']
            dem_votes = votes['Democratic']
            
            if total == 0:
                continue
            
            rep_pct = (rep_votes / total) * 100
            dem_pct = (dem_votes / total) * 100
            
            # Determine dominant party
            if rep_pct > dem_pct:
                dominant = 'Republican'
                margin = rep_pct - dem_pct
            elif dem_pct > rep_pct:
                dominant = 'Democratic'
                margin = dem_pct - rep_pct
            else:
                dominant = 'Tie'
                margin = 0
            
            doc = {
                'stateFips': state_fips,
                'stateAbbr': state_abbr,
                'county': county,
                'electionYear': 2024,
                'electionType': 'Presidential',
                'results': {
                    'Republican': {
                        'votes': rep_votes,
                        'percentage': round(rep_pct, 2)
                    },
                    'Democratic': {
                        'votes': dem_votes,
                        'percentage': round(dem_pct, 2)
                    },
                    'Other': {
                        'votes': votes['Other'],
                        'percentage': round((votes['Other'] / total * 100), 2)
                    },
                    'totalVotes': total
                },
                'dominantParty': dominant,
                'marginOfVictory': round(margin, 2)
            }
            
            documents.append(doc)
        
        logger.info(f"✓ Parsed results for {len(documents)} counties")
        return documents
    
    def process_state(self, state_abbr: str):
        """Process election results for a state"""
        logger.info(f"\nProcessing {state_abbr} election results...")
        
        results = []
        
        # Try state-specific scraper first
        if state_abbr == 'AR':
            results = self.scrape_arkansas_results()
        elif state_abbr == 'MD':
            results = self.scrape_maryland_results()
        elif state_abbr == 'RI':
            results = self.scrape_rhode_island_results()
        else:
            # Fall back to configured URL
            url = ELECTION_RESULTS_SOURCES.get(state_abbr)
            if url:
                filepath = self.download_file(url, f'{state_abbr.lower()}_results_2024.csv')
                results = self.parse_results_csv(filepath, state_abbr)
            else:
                logger.warning(f"No election results source configured for {state_abbr}")
                logger.info(f"Please manually download {state_abbr} election results and place in:")
                logger.info(f"  {self.cache_dir / f'{state_abbr.lower()}_results_2024.csv'}")
                return 0
        
        # Store in database
        if results:
            logger.info(f"Storing {len(results)} county results...")
            
            # Check for existing data
            existing = self.db.count_documents('electionResults', {
                'stateAbbr': state_abbr,
                'electionYear': 2024
            })
            
            if existing > 0:
                logger.info(f"Found {existing} existing records for {state_abbr} 2024")
                logger.info("Checking if update is needed...")
                
                # Simple check: if counts match, assume up-to-date
                if existing == len(results):
                    logger.info(f"✓ Election results are up-to-date - skipping upsert")
                    return existing
            
            # Upsert results
            for result in results:
                self.db.upsert_one(
                    'electionResults',
                    {
                        'stateAbbr': result['stateAbbr'],
                        'county': result['county'],
                        'electionYear': result['electionYear']
                    },
                    result
                )
            logger.info(f"✓ Stored {len(results)} results for {state_abbr}")
        
        return len(results)
    
    def process_all_states(self):
        """Process all detailed states"""
        total = 0
        
        for state in self.detailed_states:
            total += self.process_state(state)
        
        return total


def main():
    """Main execution"""
    try:
        downloader = ElectionResultsDownloader()
        count = downloader.process_all_states()
        
        logger.info(f"\n✓ Processed {count} county election results!")
        
        if count > 0:
            logger.info("Next step: Run 12_download_cvap_data.py")
        else:
            logger.warning("\nNote: No results were downloaded automatically.")
            logger.warning("You may need to manually download election results CSV files.")
        
    except Exception as e:
        logger.error(f"Error processing election results: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
