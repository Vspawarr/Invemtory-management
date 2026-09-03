import logging
from pathlib import Path
from typing import List, Optional
import pdfplumber
import xml.etree.ElementTree as ET

from .models import SAPRequest

logger = logging.getLogger(__name__)

class PackageValidator:
    """
    Validates that a package of downloaded files truly belongs to the specific SAPRequest.
    Checks primary documents (PDF, XML) for EinkBeleg and Materialnummer.
    """

    def validate_package(self, request: SAPRequest, downloaded_files: List[Path]) -> bool:
        """
        Validates the overall package identity.
        At least one primary document must contain strong evidence (EinkBeleg/Materialnummer).
        If any document shows clear evidence of belonging to a DIFFERENT request, reject.
        """
        if not downloaded_files:
            logger.error("No files downloaded for package validation.")
            return False

        primary_match_found = False

        for file_path in downloaded_files:
            if not file_path.exists():
                continue

            file_ext = file_path.suffix.lower()

            if file_ext == '.pdf':
                match, wrong_id = self._validate_pdf(file_path, request)
                if wrong_id:
                    logger.error(f"File {file_path.name} belongs to another request!")
                    return False
                if match:
                    primary_match_found = True

            elif file_ext == '.xml':
                match, wrong_id = self._validate_xml(file_path, request)
                if wrong_id:
                    logger.error(f"File {file_path.name} belongs to another request!")
                    return False
                if match:
                    primary_match_found = True

        if not primary_match_found:
            # If we didn't find positive identity in any primary document
            # and no generic documents triggered a failure, we should log a warning.
            # But the requirement states: "If package identity does not match... mark failed."
            # Since this is strict, if we have NO identifying docs but only generic ones,
            # this depends on the context. For now, strict mode: require positive identification.

            # Let's check if there are ONLY generic files (e.g. zip)
            non_generic = [f for f in downloaded_files if f.suffix.lower() in ['.pdf', '.xml']]
            if not non_generic:
                # Only generic files present, trust the SAP download context.
                logger.info("Only generic files found. Relying on SAP request context.")
                return True

            logger.error(f"Package validation failed: No positive ID found for {request.eink_beleg} / {request.material_nummer}")
            return False

        return True

    def _validate_pdf(self, file_path: Path, request: SAPRequest) -> tuple[bool, bool]:
        """Returns (is_match, is_wrong_identity)"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                # Read at least first 2 pages
                pages_to_read = min(2, len(pdf.pages))
                for i in range(pages_to_read):
                    page_text = pdf.pages[i].extract_text()
                    if page_text:
                        text += page_text + "\n"

            # Check for matches
            has_eink = request.eink_beleg in text
            has_mat = request.material_nummer in text

            # Very basic check for a completely different material number
            # Using the strict regex from config, check if ANY OTHER 10 digit 09... exists
            import re
            from .config import MATERIAL_NUMMER_REGEX
            found_mats = set(MATERIAL_NUMMER_REGEX.findall(text))

            # Remove our target mat
            found_mats.discard(request.material_nummer)

            if found_mats:
                # We found a material number that is NOT ours!
                logger.error(f"PDF {file_path.name} contains wrong Materialnummer: {found_mats}")
                return False, True

            if has_eink or has_mat:
                return True, False

            return False, False
        except Exception as e:
            logger.warning(f"Could not parse PDF {file_path.name}: {e}")
            return False, False

    def _validate_xml(self, file_path: Path, request: SAPRequest) -> tuple[bool, bool]:
        """Returns (is_match, is_wrong_identity)"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            # Convert XML to string for naive text search,
            # ideally we'd look at specific tags if we knew the schema.
            text = ET.tostring(root, encoding='unicode')

            has_eink = request.eink_beleg in text
            has_mat = request.material_nummer in text

            import re
            from .config import MATERIAL_NUMMER_REGEX
            found_mats = set(MATERIAL_NUMMER_REGEX.findall(text))
            found_mats.discard(request.material_nummer)

            if found_mats:
                logger.error(f"XML {file_path.name} contains wrong Materialnummer: {found_mats}")
                return False, True

            if has_eink or has_mat:
                return True, False

            return False, False
        except Exception as e:
            logger.warning(f"Could not parse XML {file_path.name}: {e}")
            return False, False
