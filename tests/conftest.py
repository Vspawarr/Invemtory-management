import pytest
from pathlib import Path
import shutil

@pytest.fixture(autouse=True)
def setup_teardown():
    # Setup test directories
    Path("test_output").mkdir(exist_ok=True)
    Path("test_temp").mkdir(exist_ok=True)

    # Create an empty state lock just to be safe
    yield

    # Cleanup after test session
    if Path("test_output").exists():
        shutil.rmtree("test_output")
    if Path("test_temp").exists():
        shutil.rmtree("test_temp")
    if Path("test_state.json").exists():
        Path("test_state.json").unlink()
    if Path("test_state.json.lock").exists():
        Path("test_state.json.lock").unlink()
