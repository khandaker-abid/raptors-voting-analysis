"""
Database utilities for MongoDB connections and operations
"""
import os
import json
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from typing import Dict, List, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages MongoDB connections and common database operations"""
    
    def __init__(self, config_path: str = "config.json"):
        """Initialize database connection from config file"""
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.mongo_uri = config['database']['mongoUri']
        self.db_name = config['database']['dbName']
        self.client = None
        self.db = None
        
        self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            logger.info(f"Connected to MongoDB: {self.db_name}")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """Get a MongoDB collection"""
        return self.db[collection_name]
    
    def insert_many_safe(self, collection_name: str, documents: List[Dict], 
                         ordered: bool = False) -> int:
        """
        Insert many documents with error handling
        Returns count of inserted documents
        """
        collection = self.get_collection(collection_name)
        inserted_count = 0
        
        try:
            result = collection.insert_many(documents, ordered=ordered)
            inserted_count = len(result.inserted_ids)
            logger.info(f"Inserted {inserted_count} documents into {collection_name}")
        except DuplicateKeyError as e:
            logger.warning(f"Duplicate key error in {collection_name}: {e}")
        except Exception as e:
            logger.error(f"Error inserting into {collection_name}: {e}")
            raise
        
        return inserted_count
    
    def upsert_one(self, collection_name: str, filter_dict: Dict, 
                   update_dict: Dict) -> bool:
        """
        Upsert a single document
        Returns True if document was inserted/updated
        """
        collection = self.get_collection(collection_name)
        
        try:
            result = collection.update_one(
                filter_dict,
                {'$set': update_dict},
                upsert=True
            )
            return result.modified_count > 0 or result.upserted_id is not None
        except Exception as e:
            logger.error(f"Error upserting into {collection_name}: {e}")
            raise
    
    def bulk_upsert(self, collection_name: str, documents: List[Dict], 
                    key_field: str = 'fipsCode') -> int:
        """
        Bulk upsert documents based on key field
        Returns count of modified documents
        """
        collection = self.get_collection(collection_name)
        modified_count = 0
        
        from pymongo import UpdateOne
        
        operations = [
            UpdateOne(
                {key_field: doc[key_field]},
                {'$set': doc},
                upsert=True
            )
            for doc in documents if key_field in doc
        ]
        
        if operations:
            result = collection.bulk_write(operations, ordered=False)
            modified_count = result.modified_count + result.upserted_count
            logger.info(f"Bulk upserted {modified_count} documents into {collection_name}")
        
        return modified_count
    
    def create_indexes(self, collection_name: str, indexes: List[tuple]):
        """
        Create indexes on a collection
        indexes: List of (field, direction) tuples
        """
        collection = self.get_collection(collection_name)
        
        for field, direction in indexes:
            collection.create_index([(field, direction)])
            logger.info(f"Created index on {collection_name}.{field}")
    
    def count_documents(self, collection_name: str, filter_dict: Dict = None) -> int:
        """Count documents in collection"""
        collection = self.get_collection(collection_name)
        return collection.count_documents(filter_dict or {})
    
    def find_one(self, collection_name: str, filter_dict: Dict) -> Optional[Dict]:
        """Find single document"""
        collection = self.get_collection(collection_name)
        return collection.find_one(filter_dict)
    
    def find_many(self, collection_name: str, filter_dict: Dict = None, 
                  projection: Dict = None, limit: int = 0) -> List[Dict]:
        """Find multiple documents"""
        collection = self.get_collection(collection_name)
        cursor = collection.find(filter_dict or {}, projection, limit=limit)
        return list(cursor)
    
    def drop_collection(self, collection_name: str):
        """Drop a collection (use with caution!)"""
        self.db[collection_name].drop()
        logger.warning(f"Dropped collection: {collection_name}")
    
    def get_distinct_values(self, collection_name: str, field: str) -> List[Any]:
        """Get distinct values for a field"""
        collection = self.get_collection(collection_name)
        return collection.distinct(field)


def load_config(config_path: str = "config.json") -> Dict:
    """Load configuration from JSON file"""
    with open(config_path, 'r') as f:
        return json.load(f)


def get_detailed_states(config_path: str = "config.json") -> Dict[str, str]:
    """Get detailed states from config"""
    config = load_config(config_path)
    return config.get('detailedStates', {})


def get_all_mainland_states() -> List[str]:
    """Return list of 48 mainland state abbreviations"""
    return [
        'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 
        'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI',
        'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
        'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
        'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]


def get_state_fips_mapping() -> Dict[str, str]:
    """Return mapping of state abbreviations to FIPS codes"""
    return {
        'AL': '01', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08',
        'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13', 'ID': '16',
        'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21',
        'LA': '22', 'ME': '23', 'MD': '24', 'MA': '25', 'MI': '26',
        'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30', 'NE': '31',
        'NV': '32', 'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36',
        'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40', 'OR': '41',
        'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
        'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53',
        'WV': '54', 'WI': '55', 'WY': '56'
    }
