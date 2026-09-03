import os
from pathlib import Path
from typing import List, Dict
import zipfile
import logging

from .utils import get_month_folder

logger = logging.getLogger(__name__)

class ZipGenerator:
    """
    Handles the generation of Month-Level ZIP files containing strictly
    the KC folders for a specific date, excluding any Excel files.
    """

    def __init__(self, base_output_dir: Path):
        self.base_output_dir = Path(base_output_dir)

    def generate_zip_for_date(self, date_str: str, target_kcs: List[str]):
        """
        Generates the ZIP at the Month level, containing ONLY the specified KC folders
        from the Date folder.

        target_kcs: List of KC folders that should be in the zip (e.g., ["KC49371", "KC49372"]).
        We look at the actual folders in the date path and include all KC* folders,
        ensuring we don't drop previously processed folders on a rerun.
        """
        month_folder, date_folder_name = get_month_folder(date_str)
        month_path = self.base_output_dir / month_folder
        date_path = month_path / date_folder_name
        zip_path = month_path / f"{date_folder_name}.zip"

        if not date_path.exists():
            logger.warning(f"Date path {date_path} does not exist. Skipping ZIP.")
            return

        # Find all KC* folders in the date path to include them all
        kc_folders = [f.name for f in date_path.iterdir() if f.is_dir() and f.name.startswith("KC")]
        if not kc_folders:
            logger.warning(f"No KC folders found in {date_path}. Skipping ZIP.")
            return

        logger.info(f"Generating ZIP: {zip_path} with folders: {kc_folders}")

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for kc in kc_folders:
                kc_path = date_path / kc
                # Walk the KC directory
                for root, _, files in os.walk(kc_path):
                    for file in files:
                        file_path = Path(root) / file
                        # Relative path inside the ZIP should start with KCxxx/
                        arcname = file_path.relative_to(date_path)
                        zipf.write(file_path, arcname)

        logger.info(f"ZIP {zip_path.name} created successfully.")
