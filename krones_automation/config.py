import os
from pathlib import Path
import re

# Base directory for the automation output
BASE_OUTPUT_DIR = Path(os.getenv("KRONES_OUTPUT_DIR", "./output"))

# State file location
STATE_FILE_PATH = Path(os.getenv("KRONES_STATE_FILE", "./kc_production_state.json"))

# Start KC if none exists
INITIAL_PRODUCTION_KC = "KC49370"

# Material number regex (must start with 09, total 10 digits)
# \b strictly enforces word boundaries so a0907848663 fails
MATERIAL_NUMMER_REGEX = re.compile(r"\b09\d{8}\b")

# SAP Selectors (Mock/Live depending on actual implementation)
class SAPSelectors:
    TABLE_ID = "#WD33"
    PAGINATION_PREV = "#WD33-scrollV-Prev"
    PAGINATION_NEXT = "#WD33-scrollV-Nxt"

# SAP Labels (German)
class SAPLabels:
    STATUS_NEW = "Neu zu bearbeiten"
    DATE_COLUMN = "Erfassungsdatum"

# Temp folder
TEMP_DIR = Path("./temp_processing")
