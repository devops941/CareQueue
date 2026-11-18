from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ColumnMapping(BaseModel):
    source_column: str
    target_field: str
    datetime_format: Optional[str] = None

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_system: Optional[str] = None

class DatasetCommitRequest(BaseModel):
    column_mappings: list[ColumnMapping]
    timezone: str = "Asia/Kolkata"

class DatasetOut(BaseModel):
    id: str
    clinic_id: str
    name: str
    status: Literal["staged","validating","preview_ready","committed","failed"]
    total_rows: int
    valid_rows: int
    invalid_rows: int
    file_hash: str
    created_at: datetime
    committed_at: Optional[datetime] = None
    model_config = {"populate_by_name": True}

class RowPreview(BaseModel):
    row_number: int
    raw_data: dict
    mapped_data: Optional[dict]
    validation_errors: list[str]
    is_valid: bool
