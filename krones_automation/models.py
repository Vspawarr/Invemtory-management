from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class ProcessingState(str, Enum):
    DISCOVERED = "DISCOVERED"
    DOWNLOADING = "DOWNLOADING"
    DOWNLOADED = "DOWNLOADED"
    EXTRACTING = "EXTRACTING"
    EXTRACTED = "EXTRACTED"
    VALIDATING = "VALIDATING"
    VALIDATED = "VALIDATED"
    PARSING = "PARSING"
    PARSED = "PARSED"
    PACKAGED = "PACKAGED"
    FAILED = "FAILED"

class SAPRequest(BaseModel):
    eink_beleg: str = Field(..., description="EinkBeleg - Request/Order Number")
    material_nummer: str = Field(..., description="Materialnummer - 10 digits starting with 09")
    material_kurztext: Optional[str] = None
    erfassungsdatum: str = Field(..., description="Input Date directly from SAP (DD.MM.YYYY)")
    status: str
    supplier: Optional[str] = None
    supplier_email: Optional[str] = None
    designer_note: Optional[str] = None
    u: Optional[str] = None
    supplier_source: Optional[str] = None

    # Internal fields for tracking
    processing_state: ProcessingState = ProcessingState.DISCOVERED
    failure_reason: Optional[str] = None
    assigned_kc: Optional[str] = None
    downloaded_files: List[str] = Field(default_factory=list)

    @property
    def input_date(self) -> str:
        """Alias for erfassungsdatum to make it clear"""
        return self.erfassungsdatum

    @property
    def identity_tuple(self) -> tuple[str, str]:
        """Unique identifier combination for the request"""
        return (self.eink_beleg, self.material_nummer)
