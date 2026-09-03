import pytest
from pathlib import Path
from krones_automation.kc_manager import KCManager
from krones_automation.models import SAPRequest

def test_kc_manager(tmp_path):
    state_file = tmp_path / "kc_production_state.json"
    manager = KCManager(state_file=state_file)

    req1 = SAPRequest(
        eink_beleg="6002997938",
        material_nummer="0907848663",
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )

    # First allocation
    kc1 = manager.get_or_assign_kc(req1)
    assert kc1 == "KC49371"

    # Idempotency: should return the same KC
    kc1_again = manager.get_or_assign_kc(req1)
    assert kc1_again == "KC49371"

    # Second distinct request
    req2 = SAPRequest(
        eink_beleg="6002997937",
        material_nummer="0907848430",
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )
    kc2 = manager.get_or_assign_kc(req2)
    assert kc2 == "KC49372"

    # Persistence: check across instances
    manager_new = KCManager(state_file=state_file)
    assert manager_new.is_processed(req1)
    assert manager_new.is_processed(req2)

    req3 = SAPRequest(
        eink_beleg="6002997936",
        material_nummer="0907844178",
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )
    kc3 = manager_new.get_or_assign_kc(req3)
    assert kc3 == "KC49373"
