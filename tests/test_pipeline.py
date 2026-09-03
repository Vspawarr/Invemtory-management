import pytest
import asyncio
from pathlib import Path
import json
import zipfile
import openpyxl

from krones_automation.pipeline import Pipeline
from krones_automation.models import SAPRequest, ProcessingState

# Fixtures from requirements
SCENARIO_FIXTURES = [
    ("6002997938", "0907848663"),
    ("6002997937", "0907848430"),
    ("6002997936", "0907844178"),
    ("6002997935", "0907840483"),
    ("6002997934", "0907805810"),
    ("6002997933", "0907803520"),
    ("6002997932", "0907791281")
]

async def mock_download_func(req: SAPRequest, temp_dir: Path):
    """Mocks downloading files that pass validation."""
    request_temp_dir = temp_dir / f"{req.eink_beleg}_{req.material_nummer}"
    request_temp_dir.mkdir(parents=True, exist_ok=True)

    # Create a dummy XML with correct identifiers
    xml_path = request_temp_dir / f"model_{req.eink_beleg}.xml"
    with open(xml_path, "w") as f:
        f.write(f"<root><eink>{req.eink_beleg}</eink><mat>{req.material_nummer}</mat></root>")

    # Create a dummy zip representing a model
    zip_path = request_temp_dir / f"model.zip"
    with open(zip_path, "wb") as f:
        f.write(b"PK\x05\x06") # empty zip sig

    return [xml_path, zip_path]

async def mock_download_fail_identity(req: SAPRequest, temp_dir: Path):
    """Mocks a download that fails package identity validation."""
    request_temp_dir = temp_dir / f"{req.eink_beleg}_{req.material_nummer}"
    request_temp_dir.mkdir(parents=True, exist_ok=True)

    # Wrong identifiers
    wrong_mat = "0999999999"
    xml_path = request_temp_dir / f"model_{req.eink_beleg}.xml"
    with open(xml_path, "w") as f:
        f.write(f"<root><eink>{req.eink_beleg}</eink><mat>{wrong_mat}</mat></root>")

    return [xml_path]

@pytest.mark.asyncio
async def test_scenario_a_one_request(tmp_path):
    output_dir = tmp_path / "output"
    temp_dir = tmp_path / "temp"
    state_file = tmp_path / "kc_state.json"

    pipeline = Pipeline(output_dir=output_dir, temp_dir=temp_dir)
    pipeline.kc_manager.state_file = state_file
    pipeline.kc_manager.lock_file = state_file.with_suffix(".lock")
    pipeline.kc_manager._ensure_state_file()

    req = SAPRequest(
        eink_beleg=SCENARIO_FIXTURES[0][0],
        material_nummer=SCENARIO_FIXTURES[0][1],
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )

    await pipeline.run(mock_requests=[req], mock_download_func=mock_download_func)

    # Validations
    assert req.processing_state == ProcessingState.PACKAGED
    assert req.assigned_kc == "KC49371"

    # Excel existence
    excel_path = output_dir / "Aug-2026" / "28Aug2026.xlsx"
    assert excel_path.exists()

    # Excel content
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active
    assert ws.max_row == 2
    row = list(ws.iter_rows(values_only=True))[1]
    assert row[0] == "KC49371"
    assert row[1] == req.eink_beleg
    assert row[2] == req.material_nummer

    # ZIP existence
    zip_path = output_dir / "Aug-2026" / "28Aug2026.zip"
    assert zip_path.exists()

    # ZIP content
    with zipfile.ZipFile(zip_path, 'r') as zf:
        namelist = zf.namelist()
        assert any(n.startswith("KC49371/") for n in namelist)
        assert not any("28Aug2026.xlsx" in n for n in namelist)

@pytest.mark.asyncio
async def test_scenario_b_seven_requests(tmp_path):
    output_dir = tmp_path / "output"
    temp_dir = tmp_path / "temp"
    state_file = tmp_path / "kc_state.json"

    pipeline = Pipeline(output_dir=output_dir, temp_dir=temp_dir)
    pipeline.kc_manager.state_file = state_file
    pipeline.kc_manager.lock_file = state_file.with_suffix(".lock")
    pipeline.kc_manager._ensure_state_file()

    requests = [
        SAPRequest(
            eink_beleg=eink,
            material_nummer=mat,
            erfassungsdatum="28.08.2026",
            status="Neu zu bearbeiten"
        ) for eink, mat in SCENARIO_FIXTURES
    ]

    await pipeline.run(mock_requests=requests, mock_download_func=mock_download_func)

    assert [r.assigned_kc for r in requests] == [
        "KC49371", "KC49372", "KC49373", "KC49374", "KC49375", "KC49376", "KC49377"
    ]

    excel_path = output_dir / "Aug-2026" / "28Aug2026.xlsx"
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active
    assert ws.max_row == 8 # 1 header + 7 rows

    zip_path = output_dir / "Aug-2026" / "28Aug2026.zip"
    with zipfile.ZipFile(zip_path, 'r') as zf:
        names = zf.namelist()
        for i in range(1, 8):
            assert any(n.startswith(f"KC4937{i}/") for n in names)

@pytest.mark.asyncio
async def test_scenario_c_multiple_dates(tmp_path):
    output_dir = tmp_path / "output"
    temp_dir = tmp_path / "temp"
    state_file = tmp_path / "kc_state.json"

    pipeline = Pipeline(output_dir=output_dir, temp_dir=temp_dir)
    pipeline.kc_manager.state_file = state_file
    pipeline.kc_manager.lock_file = state_file.with_suffix(".lock")
    pipeline.kc_manager._ensure_state_file()

    requests = [
        SAPRequest(
            eink_beleg=SCENARIO_FIXTURES[i][0],
            material_nummer=SCENARIO_FIXTURES[i][1],
            erfassungsdatum="28.08.2026" if i < 4 else "29.08.2026",
            status="Neu zu bearbeiten"
        ) for i in range(7)
    ]

    await pipeline.run(mock_requests=requests, mock_download_func=mock_download_func)

    # Verify Date 1 outputs
    assert (output_dir / "Aug-2026" / "28Aug2026.xlsx").exists()
    assert (output_dir / "Aug-2026" / "28Aug2026.zip").exists()
    assert (output_dir / "Aug-2026" / "28Aug2026" / "KC49371").exists()
    assert (output_dir / "Aug-2026" / "28Aug2026" / "KC49374").exists()

    # Verify Date 2 outputs
    assert (output_dir / "Aug-2026" / "29Aug2026.xlsx").exists()
    assert (output_dir / "Aug-2026" / "29Aug2026.zip").exists()
    assert (output_dir / "Aug-2026" / "29Aug2026" / "KC49375").exists()
    assert (output_dir / "Aug-2026" / "29Aug2026" / "KC49377").exists()

    # Verify row counts
    wb1 = openpyxl.load_workbook(output_dir / "Aug-2026" / "28Aug2026.xlsx")
    assert wb1.active.max_row == 5 # Header + 4

    wb2 = openpyxl.load_workbook(output_dir / "Aug-2026" / "29Aug2026.xlsx")
    assert wb2.active.max_row == 4 # Header + 3

@pytest.mark.asyncio
async def test_scenario_d_zero_requests(tmp_path, caplog):
    # Set caplog level so we actually capture the INFO logs
    import logging
    caplog.set_level(logging.INFO)
    pipeline = Pipeline(output_dir=tmp_path/"o", temp_dir=tmp_path/"t")
    await pipeline.run(mock_requests=[])

    assert "No NEW requests found." in caplog.text
    assert not (tmp_path/"o").exists() # No empty folders created

@pytest.mark.asyncio
async def test_scenario_e_identity_failure(tmp_path, caplog):
    output_dir = tmp_path / "output"
    temp_dir = tmp_path / "temp"
    state_file = tmp_path / "kc_state.json"

    pipeline = Pipeline(output_dir=output_dir, temp_dir=temp_dir)
    pipeline.kc_manager.state_file = state_file
    pipeline.kc_manager.lock_file = state_file.with_suffix(".lock")
    pipeline.kc_manager._ensure_state_file()

    # Request 1 fails ID
    req1 = SAPRequest(
        eink_beleg=SCENARIO_FIXTURES[0][0],
        material_nummer=SCENARIO_FIXTURES[0][1],
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )
    # Request 2 passes
    req2 = SAPRequest(
        eink_beleg=SCENARIO_FIXTURES[1][0],
        material_nummer=SCENARIO_FIXTURES[1][1],
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )

    async def mixed_download_func(req: SAPRequest, t_dir: Path):
        if req.eink_beleg == req1.eink_beleg:
            return await mock_download_fail_identity(req, t_dir)
        return await mock_download_func(req, t_dir)

    await pipeline.run(mock_requests=[req1, req2], mock_download_func=mixed_download_func)

    # Validation assertions
    assert req1.processing_state == ProcessingState.FAILED
    assert req1.failure_reason == "Package identity mismatch"
    assert req1.assigned_kc is None

    assert req2.processing_state == ProcessingState.PACKAGED
    assert req2.assigned_kc == "KC49371" # Got the first available KC

    # Verify Excel
    wb = openpyxl.load_workbook(output_dir / "Aug-2026" / "28Aug2026.xlsx")
    ws = wb.active
    assert ws.max_row == 2 # Header + Only Req 2
    row = list(ws.iter_rows(values_only=True))[1]
    assert row[1] == req2.eink_beleg

@pytest.mark.asyncio
async def test_idempotency(tmp_path):
    output_dir = tmp_path / "output"
    temp_dir = tmp_path / "temp"
    state_file = tmp_path / "kc_state.json"

    pipeline = Pipeline(output_dir=output_dir, temp_dir=temp_dir)
    pipeline.kc_manager.state_file = state_file
    pipeline.kc_manager.lock_file = state_file.with_suffix(".lock")
    pipeline.kc_manager._ensure_state_file()

    req = SAPRequest(
        eink_beleg=SCENARIO_FIXTURES[0][0],
        material_nummer=SCENARIO_FIXTURES[0][1],
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )

    # Run 1
    await pipeline.run(mock_requests=[req], mock_download_func=mock_download_func)
    assert req.assigned_kc == "KC49371"

    # Modify Excel slightly to prove it doesn't get duplicate rows
    excel_path = output_dir / "Aug-2026" / "28Aug2026.xlsx"
    wb = openpyxl.load_workbook(excel_path)
    assert wb.active.max_row == 2

    # Run 2 with same request
    req_duplicate = SAPRequest(
        eink_beleg=SCENARIO_FIXTURES[0][0],
        material_nummer=SCENARIO_FIXTURES[0][1],
        erfassungsdatum="28.08.2026",
        status="Neu zu bearbeiten"
    )

    await pipeline.run(mock_requests=[req_duplicate], mock_download_func=mock_download_func)

    assert req_duplicate.assigned_kc == "KC49371" # Got reused!
    wb_after = openpyxl.load_workbook(excel_path)
    assert wb_after.active.max_row == 2 # No duplicate row added!
