import pytest
import re
from krones_automation.config import MATERIAL_NUMMER_REGEX

def test_material_regex_validation():
    # Valid material numbers
    valid_mats = [
        "0907848663",
        "0907848430",
        "0907844178",
        "0907840483",
        "0907805810",
        "0907803520",
        "0907791281"
    ]
    for m in valid_mats:
        assert bool(MATERIAL_NUMMER_REGEX.search(m)), f"Should be valid: {m}"

    # Invalid material numbers
    invalid_mats = [
        "6002997938", # Request number, not material
        "1907848663", # Doesn't start with 09
        "090784866",  # 9 digits
        "09078486631",# 11 digits
        "a0907848663",# Letter prefix
        "0907848663b" # Letter suffix
    ]
    for m in invalid_mats:
        assert not bool(MATERIAL_NUMMER_REGEX.search(m)), f"Should be invalid: {m}"

    # Text search simulation
    text = "The request 6002997938 contains material 0907848663 and 0912345678."
    matches = MATERIAL_NUMMER_REGEX.findall(text)
    assert matches == ["0907848663", "0912345678"]
