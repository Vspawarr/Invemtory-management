import json
import logging
from pathlib import Path
from filelock import FileLock
import os

from .config import STATE_FILE_PATH, INITIAL_PRODUCTION_KC
from .models import SAPRequest

logger = logging.getLogger(__name__)

class KCManager:
    """
    Manages the strict assignment of KC numbers for production, ensuring idempotency,
    safeguards against duplicates, and persistence across runs.
    """

    def __init__(self, state_file: Path = STATE_FILE_PATH):
        self.state_file = state_file
        self.lock_file = state_file.with_suffix(".lock")
        self._ensure_state_file()

    def _ensure_state_file(self):
        """Creates the initial state file if it doesn't exist."""
        if not self.state_file.exists():
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            initial_state = {
                "last_kc": INITIAL_PRODUCTION_KC,
                "processed_requests": {} # key: "eink_beleg-material_nummer", value: assigned_kc
            }
            with open(self.state_file, "w") as f:
                json.dump(initial_state, f, indent=4)

    def _read_state(self) -> dict:
        with open(self.state_file, "r") as f:
            return json.load(f)

    def _write_state(self, state: dict):
        with open(self.state_file, "w") as f:
            json.dump(state, f, indent=4)

    def get_or_assign_kc(self, request: SAPRequest) -> str:
        """
        Idempotent KC assignment.
        Returns the existing KC if already successfully processed.
        Otherwise, strictly increments the production KC and assigns it.
        """
        request_key = f"{request.eink_beleg}-{request.material_nummer}"

        with FileLock(self.lock_file):
            state = self._read_state()

            # Check if already processed (Idempotency)
            if request_key in state["processed_requests"]:
                assigned_kc = state["processed_requests"][request_key]
                logger.info(f"Request {request_key} already processed. Reusing {assigned_kc}")
                return assigned_kc

            # Extract number from last KC
            last_kc = state["last_kc"]
            try:
                last_num = int(last_kc.replace("KC", ""))
            except ValueError:
                raise ValueError(f"Corrupted state file: invalid KC format '{last_kc}'")

            next_num = last_num + 1
            next_kc = f"KC{next_num}"

            # Update state
            state["last_kc"] = next_kc
            state["processed_requests"][request_key] = next_kc
            self._write_state(state)

            logger.info(f"Assigned new {next_kc} to request {request_key}")
            return next_kc

    def is_processed(self, request: SAPRequest) -> bool:
        """Checks if a request is already successfully processed."""
        request_key = f"{request.eink_beleg}-{request.material_nummer}"
        with FileLock(self.lock_file):
            state = self._read_state()
            return request_key in state["processed_requests"]
