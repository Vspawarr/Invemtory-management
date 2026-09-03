import pytest
from pathlib import Path
from krones_automation.utils import get_month_folder

def test_month_generation():

    # Valid Dates
    month, date_f = get_month_folder("28.08.2026")
    assert month == "Aug-2026"
    assert date_f == "28Aug2026"

    month, date_f = get_month_folder("01.01.2027")
    assert month == "Jan-2027"
    assert date_f == "01Jan2027"

    # Invalid/Unknown format fallback
    month, date_f = get_month_folder("2026-08-28")
    assert month == "Unknown-Month"
    assert date_f == "2026-08-28"
