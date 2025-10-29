#!/usr/bin/env python3
"""
Prepro-3: Populate MongoDB with EAVS Data

This script reads EAVS Excel files and populates the MongoDB database
with election administration and voting data from 2016-2024.
"""
import sys
import logging
from pathlib import Path
import pandas as pd
from datetime import datetime, timezone

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config, get_state_fips_mapping

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# EAVS field mappings - these are the columns we need from EAVS
EAVS_FIELD_MAPPINGS = {
    # Registration fields
    'A1a': 'Total Registered',
    'A1b': 'Active Registration',
    'A1c': 'Inactive Registration',
    
    # Provisional ballots
    'E1a': 'Provisional Ballots Cast',
    'E1d': 'Provisional Ballots Rejected',
    'E2a': 'Provisional - Not on List',
    'E2b': 'Provisional - Lacked ID',
    'E2c': 'Provisional - Official Challenged',
    'E2d': 'Provisional - Person Challenged',
    'E2e': 'Provisional - Not Resident',
    'E2f': 'Provisional - Registration Not Updated',
    'E2g': 'Provisional - Did Not Surrender Mail Ballot',
    'E2h': 'Provisional - Extended Hours',
    'E2i': 'Provisional - SDR',
    
    # Mail ballot rejections
    'C9a': 'Mail Ballots Rejected',
    'C9b': 'Mail Rejected - Late',
    'C9c': 'Mail Rejected - Missing Voter Signature',
    'C9d': 'Mail Rejected - Missing Witness Signature',
    'C9e': 'Mail Rejected - Non-Matching Signature',
    'C9f': 'Mail Rejected - Unofficial Envelope',
    'C9g': 'Mail Rejected - Ballot Missing',
    'C9h': 'Mail Rejected - No Secrecy Envelope',
    'C9i': 'Mail Rejected - Multiple Ballots',
    'C9j': 'Mail Rejected - Envelope Not Sealed',
    'C9k': 'Mail Rejected - No Postmark',
    'C9l': 'Mail Rejected - No Address',
    'C9m': 'Mail Rejected - Voter Deceased',
    'C9n': 'Mail Rejected - Already Voted',
    'C9o': 'Mail Rejected - Missing Documentation',
    'C9p': 'Mail Rejected - Not Eligible',
    'C9q': 'Mail Rejected - No Application',
    
    # Pollbook deletions
    'A12b': 'Removed - Moved',
    'A12c': 'Removed - Death',
    'A12d': 'Removed - Felony',
    'A12e': 'Removed - Fail Response',
    'A12f': 'Removed - Incompetent',
    'A12g': 'Removed - Voter Request',
    'A12h': 'Removed - Duplicate',
    
    # Equipment
    'F3a': 'DRE no VVPAT',
    'F4a': 'DRE with VVPAT',
    'F5a': 'Ballot Marking Device',
    'F6a': 'Scanner',
    
    # Drop boxes
    'C3a': 'Drop Boxes Total',
    
    # Voting participation
    'F1a': 'Total Voters',
    'F1b': 'Physical Polling Place',
    'F1c': 'Absentee UOCAVA',
    'F1d': 'Mail Votes',
    'F1e': 'Provisional Ballot',
    'F1f': 'In Person Early Voting',
    
    # UOCAVA
    'B24a': 'UOCAVA Rejected',
}


class EAVSDataPopulator:
    """Populates MongoDB with EAVS data"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'eavs'
        self.state_fips = get_state_fips_mapping()
    
    def parse_eavs_excel(self, filepath: Path, year: int) -> pd.DataFrame:
        """Parse EAVS Excel file"""
        logger.info(f"Reading EAVS {year} Excel file...")
        
        try:
            # Read Excel file - EAVS files typically have data starting at row 2-3
            df = pd.read_excel(filepath, sheet_name=0)
            
            logger.info(f"  Loaded {len(df)} rows from EAVS {year}")
            logger.info(f"  Columns: {len(df.columns)}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error reading EAVS {year} file: {e}")
            raise
    
    def transform_eavs_record(self, row: pd.Series, year: int) -> dict:
        """Transform EAVS row to MongoDB document"""
        
        # Try to extract jurisdiction info - column names vary by year
        jurisdiction_name = None
        state_name = None
        state_abbr = None
        fips_code = None
        
        # Common column name patterns
        for col in row.index:
            col_lower = str(col).lower()
            if 'jurisdiction' in col_lower or 'county' in col_lower or 'locality' in col_lower:
                jurisdiction_name = str(row[col]) if pd.notna(row[col]) else None
            elif 'state' in col_lower and 'fips' not in col_lower and not state_name:
                state_name = str(row[col]) if pd.notna(row[col]) else None
            elif 'fips' in col_lower or 'geoid' in col_lower:
                fips_code = str(row[col]).zfill(5) if pd.notna(row[col]) else None
        
        # Build document
        document = {
            'year': year,
            'fipsCode': fips_code,
            'jurisdictionName': jurisdiction_name,
            'stateFull': state_name,
            'stateAbbr': state_abbr,
        }
        
        # Map EAVS fields
        for field_code, column_pattern in EAVS_FIELD_MAPPINGS.items():
            # Try to find matching column
            value = None
            for col in row.index:
                if column_pattern.lower() in str(col).lower() or field_code in str(col):
                    value = row[col]
                    break
            
            # Convert to int, handle missing
            if pd.notna(value):
                try:
                    document[field_code] = int(float(value))
                except (ValueError, TypeError):
                    document[field_code] = None
            else:
                document[field_code] = None
        
        # Add timestamps
        document['createdAt'] = datetime.now(timezone.utc)
        document['updatedAt'] = datetime.now(timezone.utc)
        
        return document
    
    def populate_year(self, year: int) -> int:
        """Populate data for a specific year (with smart duplicate prevention)"""
        filepath = self.cache_dir / f'EAVS_{year}_Dataset.xlsx'
        
        if not filepath.exists():
            logger.warning(f"EAVS {year} file not found: {filepath}")
            logger.warning(f"Skipping year {year}")
            return 0
        
        logger.info(f"\nProcessing EAVS {year}...")
        
        # Check if data already exists in database
        collection = self.db.get_collection('eavsData')
        existing_count = collection.count_documents({'year': year})
        
        if existing_count > 0:
            logger.info(f"  Found {existing_count} existing records for {year} in database")
            
            # Check file modification time vs database timestamp
            file_mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
            newest_doc = collection.find_one(
                {'year': year}, 
                sort=[('updatedAt', -1)]
            )
            
            if newest_doc and newest_doc.get('updatedAt'):
                db_time = newest_doc['updatedAt']
                if file_mtime <= db_time:
                    logger.info(f"  Database is up-to-date (DB: {db_time}, File: {file_mtime})")
                    logger.info(f"  ✓ Skipping {year} - already populated with current data")
                    return existing_count
                else:
                    logger.info(f"  File is newer than database - will refresh data")
            else:
                logger.info(f"  Will refresh data (cannot determine database timestamp)")
        
        # Parse Excel
        df = self.parse_eavs_excel(filepath, year)
        
        # Transform records
        documents = []
        for idx, row in df.iterrows():
            try:
                doc = self.transform_eavs_record(row, year)
                
                # Only add if we have minimum required fields
                if doc.get('fipsCode') and doc.get('jurisdictionName'):
                    documents.append(doc)
                
                if (idx + 1) % 500 == 0:
                    logger.info(f"  Processed {idx + 1}/{len(df)} rows...")
                    
            except Exception as e:
                logger.warning(f"  Error processing row {idx}: {e}")
                continue
        
        logger.info(f"  Transformed {len(documents)} valid records")
        
        # Store in database
        if documents:
            # Delete existing records for this year first
            collection = self.db.get_collection('eavsData')
            deleted = collection.delete_many({'year': year})
            logger.info(f"  Deleted {deleted.deleted_count} existing {year} records")
            
            # Insert new records
            inserted = self.db.insert_many_safe('eavsData', documents)
            logger.info(f"  ✓ Inserted {inserted} records for {year}")
            
            return inserted
        
        return 0
    
    def populate_all(self):
        """Populate all years"""
        years = [2024, 2020, 2016]
        total_inserted = 0
        
        for year in years:
            count = self.populate_year(year)
            total_inserted += count
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("EAVS DATA POPULATION SUMMARY")
        logger.info("="*70)
        
        for year in years:
            count = self.db.count_documents('eavsData', {'year': year})
            logger.info(f"  {year}: {count:,} records")
        
        total = self.db.count_documents('eavsData')
        logger.info(f"\n  Total: {total:,} records across all years")
        logger.info("="*70)
        
        return total_inserted


def main():
    """Main execution"""
    try:
        populator = EAVSDataPopulator()
        count = populator.populate_all()
        
        if count > 0:
            logger.info(f"\n✓ Successfully populated {count:,} EAVS records!")
            logger.info("Next step: Run 04_download_geographic_boundaries.py")
        else:
            logger.error("\n✗ No records populated. Check EAVS files.")
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Error populating EAVS data: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
