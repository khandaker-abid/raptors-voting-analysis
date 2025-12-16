"""Tests for voter collection name resolution.

These catch regressions where optional scripts (Prepro-8/9/10) accidentally
query the wrong collection and incorrectly report "No voter registration
records" when data exists.
"""

from __future__ import annotations

from unittest.mock import Mock

from utils.voter_collections import (
    VOTER_COLLECTION_FALLBACK,
    VOTER_COLLECTION_PRIMARY,
    get_voter_collection_name,
)


def test_prefers_primary_when_populated():
    db = Mock()
    db.count_documents.side_effect = lambda name: 1 if name == VOTER_COLLECTION_PRIMARY else 0

    assert get_voter_collection_name(db) == VOTER_COLLECTION_PRIMARY


def test_falls_back_when_primary_empty():
    db = Mock()
    db.count_documents.side_effect = lambda name: 0

    assert get_voter_collection_name(db) == VOTER_COLLECTION_FALLBACK
