import importlib.util
from pathlib import Path


_MODULE_PATH = Path(__file__).resolve().parents[1] / "09b_repair_voter_records.py"
_spec = importlib.util.spec_from_file_location("repair_voter_records", _MODULE_PATH)
assert _spec is not None and _spec.loader is not None
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

build_repair_update = _mod.build_repair_update


def test_repair_when_address_is_string_adds_backup_and_normalizes():
    doc = {
        "_id": 1,
        "address": "123 Main St, City, ST 00000",
        "state": "RI",
        "stateAbbr": "",
    }

    update = build_repair_update(doc)
    assert update is not None
    assert "repairBackup" in update
    assert update["repairBackup"]["address"] == "123 Main St, City, ST 00000"

    assert update["address"]["raw"] == "123 Main St, City, ST 00000"
    assert update["address"]["street"] == "123 Main St"

    # stateAbbr inferred from state
    assert update["stateAbbr"] == "RI"


def test_repair_idempotent_when_address_dict_present():
    doc = {
        "_id": 1,
        "address": {"street": "1", "city": "X", "zipCode": "2"},
        "stateAbbr": "RI",
    }

    assert build_repair_update(doc) is None
