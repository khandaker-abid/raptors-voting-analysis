"""Shared helpers for locating voter registration collections.

Historically, some preprocessing scripts used different MongoDB collection
names for voter registration:

- `voter_registration` (snake_case) is what Prepro-17 writes today.
- `voterRegistration` (camelCase) appears in older scripts/DBs.

These helpers keep the codebase consistent and prevent optional steps
(Prepro-8/9/10) from incorrectly skipping when data exists.
"""

from __future__ import annotations

from .database import DatabaseManager


VOTER_COLLECTION_PRIMARY = "voter_registration"
VOTER_COLLECTION_FALLBACK = "voterRegistration"


def get_voter_collection_name(db: DatabaseManager) -> str:
    """Return the voter registration collection name to use.

    Preference order:
    1) `voter_registration` if it exists and contains at least one document.
    2) fallback to `voterRegistration`.
    """
    if db.count_documents(VOTER_COLLECTION_PRIMARY) > 0:
        return VOTER_COLLECTION_PRIMARY
    return VOTER_COLLECTION_FALLBACK
