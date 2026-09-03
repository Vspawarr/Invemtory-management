import logging
import asyncio
from pathlib import Path
from typing import List, Optional
from playwright.async_api import Page, Download

from .models import SAPRequest
from .config import TEMP_DIR

logger = logging.getLogger(__name__)

class Downloader:
    """
    Handles file downloads securely within an isolated temp directory per request.
    """

    def __init__(self, temp_base: Path = TEMP_DIR):
        self.temp_base = Path(temp_base)
        self.temp_base.mkdir(parents=True, exist_ok=True)

    async def download_files_for_request(self, page: Page, request: SAPRequest) -> List[Path]:
        """
        Since we do not have live SAP, this method outlines how a standard
        Playwright async download flow is managed, ensuring awaiting is handled.

        Args:
            page: Active Playwright page (already navigated to the request details).
            request: The SAPRequest being processed.

        Returns:
            List of downloaded file Paths.
        """
        request_temp_dir = self.temp_base / f"{request.eink_beleg}_{request.material_nummer}"
        request_temp_dir.mkdir(parents=True, exist_ok=True)

        downloaded_paths = []

        # Example logic for downloading:
        # In a real scenario, we would click the download link and wait for the event.
        # This implementation serves as the architectural skeleton for when live SAP is used.
        try:
            # We assume the user has clicked something that triggers downloads.
            # Example:
            # async with page.expect_download() as download_info:
            #     await page.click("text=Download All")
            # download = await download_info.value
            # final_path = request_temp_dir / download.suggested_filename
            # await download.save_as(final_path)
            # downloaded_paths.append(final_path)

            # For the mock/test architecture, we will simulate this by copying
            # test fixture files if they exist in a mocks folder, or creating dummy files.
            pass

        except Exception as e:
            logger.error(f"Download failed for request {request.eink_beleg}: {e}")
            raise

        return downloaded_paths

    def clean_temp_dir(self, request: SAPRequest):
        """Cleans up the temporary directory for the request after successful processing."""
        request_temp_dir = self.temp_base / f"{request.eink_beleg}_{request.material_nummer}"
        if request_temp_dir.exists():
            for child in request_temp_dir.iterdir():
                if child.is_file():
                    child.unlink()
            request_temp_dir.rmdir()
            logger.info(f"Cleaned temp dir: {request_temp_dir}")
