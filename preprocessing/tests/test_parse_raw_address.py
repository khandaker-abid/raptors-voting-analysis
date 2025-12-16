import importlib.util
from pathlib import Path


_MODULE_PATH = Path(__file__).resolve().parents[1] / "09b_repair_voter_records.py"
_spec = importlib.util.spec_from_file_location("repair_voter_records", _MODULE_PATH)
assert _spec is not None and _spec.loader is not None
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

parse_raw_address = _mod.parse_raw_address


def test_parse_raw_address_commas():
    parsed = parse_raw_address("123 Main St, Providence, RI 02903")
    assert parsed == {
        "street": "123 Main St",
        "city": "Providence",
        "state": "RI",
        "zipCode": "02903",
    }


def test_parse_raw_address_spaces_only():
    parsed = parse_raw_address("123 Main St Providence RI 02903")
    assert parsed == {
        "street": "123 Main St",
        "city": "Providence",
        "state": "RI",
        "zipCode": "02903",
    }


def test_parse_raw_address_rejects_garbage():
    assert parse_raw_address("Providence") is None
