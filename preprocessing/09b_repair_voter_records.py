#!/usr/bin/env python3
"""Prepro-9b: Repair malformed voter records (REQUIRED)

Why this exists:
- Prepro-9 geocoding expects voter documents to be dict-like with an optional
  nested address dict.
- In some databases, malformed entries can appear (e.g., address stored as a
  string, or entire record stored as a non-dict value in the collection).

This script normalizes voter documents so geocoding and region assignment can
run without errors and *without skipping bad rows*.

Repair policy (non-destructive):
- We never drop documents.
- Before changing any field, we store a snapshot of the original value in
  `repairBackup.<field>` (only once).

Supported repairs:
- If `address` is a string, turn it into `address.raw` and create an empty
  structured address.
- If `address` is missing/null, create an empty structured address.
- Coerce `stateAbbr` from `state` when obvious.

Note: If the collection contains non-document values (e.g., strings as top-level
values), MongoDB itself normally disallows that; however, weird wrapper layers
or legacy imports can lead to unexpected shapes. This script defensively scans
and repairs what it can.
"""

from __future__ import annotations

import argparse
import logging
from typing import Any, Dict, Optional

from utils.database import DatabaseManager
from utils.voter_collections import get_voter_collection_name

import re

_US_STATE_RE = r"[A-Za-z]{2}"
_ZIP_RE = r"\d{5}(?:-\d{4})?"


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def parse_raw_address(raw: str) -> Optional[Dict[str, str]]:
    """Conservatively parse address.raw into structured fields.

    Returns a dict with street/city/state/zipCode on success, else None.
    """
    if not raw or not isinstance(raw, str):
        return None

    raw_clean = _clean(raw)

    # First, anchor the tail "ST ZIP" and then split the head.
    m = re.match(rf"^(?P<head>.+?)\s+(?P<state>{_US_STATE_RE})\s+(?P<zip>{_ZIP_RE})$", raw_clean)
    if m:
        head = _clean(m.group("head"))
        state = m.group("state").upper()
        zipc = m.group("zip")

        # Prefer comma separation if present: "street, city"
        if "," in head:
            street_part, city_part = [p.strip() for p in head.split(",", 1)]
            street = _clean(street_part)
            city = _clean(city_part).rstrip(",")
        else:
            # Heuristic: city is the trailing 1-3 tokens (most cities are short).
            tokens = head.split(" ")
            if len(tokens) < 2:
                return None

            street_suffixes = {
                "st",
                "street",
                "rd",
                "road",
                "ave",
                "avenue",
                "blvd",
                "boulevard",
                "dr",
                "drive",
                "ln",
                "lane",
                "ct",
                "court",
                "pl",
                "place",
                "cir",
                "circle",
                "pkwy",
                "parkway",
                "hwy",
                "highway",
            }

            # Try 2-token city first (e.g., "New York"), then 3, then 1.
            city = None
            street = None
            for city_tokens_n in (2, 3, 1):
                if len(tokens) <= city_tokens_n:
                    continue
                street_candidate = " ".join(tokens[:-city_tokens_n]).strip()
                city_candidate = " ".join(tokens[-city_tokens_n:]).strip()

                # If our street candidate ends with a common street suffix (like "St"),
                # avoid stealing it into the city.
                cc_tokens = city_candidate.split(" ")
                if cc_tokens and cc_tokens[0].lower() in street_suffixes:
                    # Move the leading suffix token from city back into street.
                    street_candidate = f"{street_candidate} {cc_tokens[0]}".strip()
                    city_candidate = " ".join(cc_tokens[1:]).strip()

                # Require at least one digit in street candidate.
                if re.search(r"\d", street_candidate) and re.search(r"[A-Za-z]", city_candidate):
                    street = _clean(street_candidate)
                    city = _clean(city_candidate).rstrip(",")
                    break

            if not street or not city:
                return None

        return {"street": street, "city": city, "state": state, "zipCode": zipc}

    m = re.match(
        rf"^(?P<street>.+?),\s*(?P<rest>.+?)\s+(?P<state>{_US_STATE_RE})\s+(?P<zip>{_ZIP_RE})$",
        raw_clean,
    )
    if m:
        return {
            "street": _clean(m.group("street")),
            "city": _clean(m.group("rest")),
            "state": m.group("state").upper(),
            "zipCode": m.group("zip"),
        }

    return None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def _truthy(s: str) -> bool:
    return s.strip().lower() in {"1", "true", "yes", "y"}


def normalize_address(addr_value: Any) -> Dict[str, Any]:
    """Return a normalized address dict plus backup info for mutation."""
    if addr_value is None:
        return {"street": "", "city": "", "zipCode": ""}

    if isinstance(addr_value, dict):
        # Ensure key presence, but keep any extra keys.
        return {
            **addr_value,
            "street": addr_value.get("street", ""),
            "city": addr_value.get("city", ""),
            "zipCode": addr_value.get("zipCode", ""),
        }

    if isinstance(addr_value, str):
        # Preserve original string in a stable place.
        return {
            "street": "",
            "city": "",
            "zipCode": "",
            "raw": addr_value,
        }

    # Unknown type: keep stringified representation.
    return {
        "street": "",
        "city": "",
        "zipCode": "",
        "raw": str(addr_value),
    }


def build_repair_update(voter_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Return an update dict for the voter doc, or None if no changes needed."""
    update: Dict[str, Any] = {}

    address_value = voter_doc.get("address")
    if not isinstance(address_value, dict):
        # Backup original only if not already backed up
        if "repairBackup" not in voter_doc or "address" not in (voter_doc.get("repairBackup") or {}):
            update.setdefault("repairBackup", {})
            update["repairBackup"]["address"] = address_value

        update["address"] = normalize_address(address_value)

    # If address is already a dict, optionally *fill in* missing required keys.
    # This keeps the repair step idempotent: we only write when we must.
    if isinstance(address_value, dict):
        missing_keys = any(k not in address_value for k in ("street", "city", "zipCode"))
        if missing_keys:
            update["address"] = normalize_address(address_value)

    # If we have a raw string embedded, try to parse it into structured fields
    # (conservative; only fills on clear match) AND only if structured fields are missing.
    address_after = update.get("address") if "address" in update else voter_doc.get("address")
    if isinstance(address_after, dict) and isinstance(address_after.get("raw"), str):
        needs_structured = not (address_after.get("street") and address_after.get("city") and address_after.get("zipCode"))
        if needs_structured:
            parsed = parse_raw_address(address_after.get("raw"))
            if parsed:
                # Backup raw prior to parsing (one-time)
                if "repairBackup" not in voter_doc or "address_raw_parsing" not in (voter_doc.get("repairBackup") or {}):
                    update.setdefault("repairBackup", {})
                    update["repairBackup"]["address_raw_parsing"] = address_after.get("raw")

                update.setdefault("address", {})
                update["address"].update(
                    {
                        "street": parsed.get("street", ""),
                        "city": parsed.get("city", ""),
                        "zipCode": parsed.get("zipCode", ""),
                    }
                )

                if not voter_doc.get("stateAbbr") and parsed.get("state"):
                    update["stateAbbr"] = parsed["state"]

    # Try to ensure stateAbbr exists if we can infer it.
    if not voter_doc.get("stateAbbr") and isinstance(voter_doc.get("state"), str):
        state = voter_doc["state"].strip()
        if len(state) == 2 and state.isalpha():
            update["stateAbbr"] = state.upper()

    return update or None


def repair_voters(db: DatabaseManager, voter_collection: str, limit: int, dry_run: bool, force_full_scan: bool) -> Dict[str, int]:
    """Scan and repair voter documents in place."""
    return repair_voters_filtered(
        db,
        voter_collection=voter_collection,
        limit=limit,
        dry_run=dry_run,
        force_full_scan=force_full_scan,
    )


def _build_scan_filter(force_full_scan: bool) -> Dict[str, Any]:
    if force_full_scan:
        return {}

    return {
        "$or": [
            {"address": {"$exists": False}},
            {"address": None},
            {"address": {"$type": "string"}},
            {"address": {"$type": "object"}, "address.street": {"$exists": False}},
            {"address": {"$type": "object"}, "address.city": {"$exists": False}},
            {"address": {"$type": "object"}, "address.zipCode": {"$exists": False}},
            {"address": {"$type": "object"}, "address.raw": {"$exists": True}, "address.street": ""},
        ]
    }


def repair_voters_filtered(
    db: DatabaseManager, voter_collection: str, limit: int, dry_run: bool, force_full_scan: bool
) -> Dict[str, int]:
    scanned = 0
    repaired = 0

    projection = {"address": 1, "state": 1, "stateAbbr": 1, "repairBackup": 1}
    filter_query = _build_scan_filter(force_full_scan)
    docs = db.get_collection(voter_collection).find(filter_query, projection=projection, limit=limit or 0)

    for doc in docs:
        scanned += 1
        if not isinstance(doc, dict) or "_id" not in doc:
            logger.warning("Encountered non-document entry during scan; cannot repair safely")
            continue

        update = build_repair_update(doc)
        if not update:
            if scanned % 10000 == 0:
                logger.info(f"Scanned {scanned:,} (repairs so far: {repaired:,})...")
            continue

        repaired += 1
        if not dry_run:
            db.upsert_one(voter_collection, {"_id": doc["_id"]}, update)

        # Log progress by scan count to make it clear we're not necessarily
        # repairing every document we iterate.
        if scanned % 10000 == 0 or repaired % 1000 == 0:
            logger.info(f"Scanned {scanned:,} (repairs so far: {repaired:,})...")

    return {"scanned": scanned, "repaired": repaired}


def main():
    parser = argparse.ArgumentParser(description="Prepro-9b: Repair malformed voter records")
    parser.add_argument("--limit", type=int, default=0, help="Max voter docs to scan (0 = no limit)")
    parser.add_argument("--dry-run", action="store_true", help="Scan and report only; do not write changes")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force a full collection scan (default is incremental scan of only-likely-bad docs)",
    )
    args = parser.parse_args()

    db = DatabaseManager()
    voter_collection = get_voter_collection_name(db)

    logger.info("=" * 70)
    logger.info("REPAIR: Malformed voter records")
    logger.info("=" * 70)
    logger.info(f"Collection: {voter_collection}")
    logger.info(f"Dry run: {args.dry_run}")
    logger.info(f"Force full scan: {args.force}")

    stats = repair_voters(
        db,
        voter_collection=voter_collection,
        limit=args.limit,
        dry_run=args.dry_run,
        force_full_scan=args.force,
    )

    logger.info("=" * 70)
    logger.info("REPAIR SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Scanned:  {stats['scanned']:,}")
    logger.info(f"Repaired: {stats['repaired']:,}")


if __name__ == "__main__":
    main()
