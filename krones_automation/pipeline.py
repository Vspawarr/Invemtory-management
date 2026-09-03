import logging
import asyncio
from pathlib import Path
from typing import List
import shutil

from .models import SAPRequest, ProcessingState
from .config import BASE_OUTPUT_DIR, TEMP_DIR
from .kc_manager import KCManager
from .excel_generator import ExcelGenerator
from .zip_generator import ZipGenerator
from .package_validator import PackageValidator
from .downloader import Downloader
from .request_discovery import RequestDiscovery
from .utils import get_month_folder

logger = logging.getLogger(__name__)

class Pipeline:
    """
    Coordinates the entire automation flow:
    1. Discovers requests
    2. Downloads & Validates
    3. Allocates KC securely
    4. Packages to Output directory
    5. Generates Excel & ZIP
    """

    def __init__(self, output_dir: Path = BASE_OUTPUT_DIR, temp_dir: Path = TEMP_DIR):
        self.output_dir = output_dir
        self.temp_dir = temp_dir

        self.kc_manager = KCManager()
        self.excel_gen = ExcelGenerator(base_output_dir=self.output_dir)
        self.zip_gen = ZipGenerator(base_output_dir=self.output_dir)
        self.validator = PackageValidator()
        self.downloader = Downloader(temp_base=self.temp_dir)

    async def run(self, page=None, mock_requests: List[SAPRequest] = None, mock_download_func=None):
        """
        Executes the main pipeline.
        Accepts mock dependencies for local testing since live SAP is unavailable.
        """
        logger.info("Starting Krones Automation Pipeline")

        # 1. Discover Requests
        if mock_requests is not None:
            requests = mock_requests
            logger.info(f"Using {len(requests)} mock requests.")
        else:
            if not page:
                raise ValueError("A Playwright Page must be provided for live discovery.")
            requests = await RequestDiscovery.get_new_requests(page)

        if not requests:
            logger.info("No NEW requests found.")
            return

        # Track successfully processed requests to generate ZIPs at the end
        processed_by_date = {} # date_str -> list of KC names

        # 2. Process each request
        for req in requests:
            try:
                # Check Idempotency immediately
                if self.kc_manager.is_processed(req):
                    assigned_kc = self.kc_manager.get_or_assign_kc(req) # Will just fetch existing
                    req.assigned_kc = assigned_kc
                    req.processing_state = ProcessingState.PACKAGED
                    logger.info(f"Request {req.eink_beleg} was already processed successfully as {assigned_kc}. Skipping download.")
                    continue

                req.processing_state = ProcessingState.DOWNLOADING

                # Download
                if mock_download_func:
                    downloaded_files = await mock_download_func(req, self.temp_dir)
                else:
                    downloaded_files = await self.downloader.download_files_for_request(page, req)

                req.downloaded_files = downloaded_files
                req.processing_state = ProcessingState.DOWNLOADED

                # Validation
                req.processing_state = ProcessingState.VALIDATING
                is_valid = self.validator.validate_package(req, downloaded_files)

                if not is_valid:
                    req.processing_state = ProcessingState.FAILED
                    req.failure_reason = "Package identity mismatch"
                    logger.error(f"Validation failed for {req.eink_beleg}. Skipping.")
                    continue

                req.processing_state = ProcessingState.VALIDATED

                # KC Allocation
                req.assigned_kc = self.kc_manager.get_or_assign_kc(req)

                # Packaging (Move files to final output structure)
                self._package_request(req)
                req.processing_state = ProcessingState.PACKAGED

                # Excel Generation
                self.excel_gen.append_request(req)

                # Group for ZIP
                if req.input_date not in processed_by_date:
                    processed_by_date[req.input_date] = []
                processed_by_date[req.input_date].append(req.assigned_kc)

                logger.info(f"Successfully fully processed request {req.eink_beleg} -> {req.assigned_kc}")

            except Exception as e:
                logger.error(f"Unexpected error processing request {req.eink_beleg}: {e}")
                req.processing_state = ProcessingState.FAILED
                req.failure_reason = str(e)

            finally:
                # Clean temp files
                self.downloader.clean_temp_dir(req)

        # 3. Finalize ZIP generation for dates that had newly processed files
        for date_str, kc_list in processed_by_date.items():
            if kc_list:
                self.zip_gen.generate_zip_for_date(date_str, kc_list)

        logger.info("Pipeline execution completed.")

    def _package_request(self, request: SAPRequest):
        """
        Moves the downloaded files from the temp directory into the final KC folder structure.
        Structure: Output / Month / Date / KCxxx / files...
        """
        if not request.assigned_kc:
            raise ValueError("Cannot package request without an assigned KC.")

        month_folder, date_folder = get_month_folder(request.input_date)
        final_kc_dir = self.output_dir / month_folder / date_folder / request.assigned_kc

        final_kc_dir.mkdir(parents=True, exist_ok=True)

        for file_path in request.downloaded_files:
            if file_path.exists():
                dest = final_kc_dir / file_path.name
                shutil.copy2(file_path, dest)
                logger.debug(f"Copied {file_path.name} to {final_kc_dir}")
