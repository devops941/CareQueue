# Phase 08 — Dataset Staging & Import

You are implementing Phase 08 of CareQueue: **Two-Stage Dataset Upload, Mapping & Import Pipeline**.

## Project Context
CareQueue imports historical visit data from CSV/XLSX files. Import is **two-stage**:
1. **Upload & Validate**: File uploaded, rows staged, preview shown to user
2. **Commit**: User confirms mapping, only valid rows are committed to `visits` collection

**Rules**:
- Never silently import rejected rows
- Track file hash + row number for idempotency
- Preview before commit — user must explicitly confirm

## Your Task

### 1. Dataset Module Backend (`backend/app/modules/datasets/`)

```
modules/datasets/
├── __init__.py
├── schemas.py
├── repository.py
├── service.py
├── controller.py
├── router.py
└── importer.py    # CSV/XLSX parsing logic
```

**`schemas.py`**:
```python
class DatasetUploadInit(BaseModel):
    clinic_id: str
    name: str
    description: Optional[str]
    source_system: Optional[str]  # e.g. "HIS", "manual"

class ColumnMapping(BaseModel):
    source_column: str          # column name in uploaded file
    target_field: str           # CareQueue field name (e.g. "arrival_time")
    transform: Optional[str]    # datetime format string if needed (e.g. "%d/%m/%Y %H:%M")

class DatasetCommitRequest(BaseModel):
    dataset_id: str
    column_mappings: list[ColumnMapping]
    timezone: str  # clinic timezone for timestamp parsing

class DatasetOut(BaseModel):
    id: str
    clinic_id: str
    name: str
    status: Literal["staged", "validating", "preview_ready", "committed", "failed"]
    total_rows: int
    valid_rows: int
    invalid_rows: int
    file_hash: str
    created_at: datetime
    committed_at: Optional[datetime]

class RowPreview(BaseModel):
    row_number: int
    raw_data: dict
    mapped_data: Optional[dict]
    validation_errors: list[str]
    is_valid: bool
```

**`importer.py`**:
```python
def read_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Read CSV or XLSX file, return DataFrame. Detect encoding."""

def compute_file_hash(file_bytes: bytes) -> str:
    """SHA-256 hash of file bytes."""

def apply_column_mapping(df: pd.DataFrame, mappings: list[ColumnMapping]) -> pd.DataFrame:
    """Rename + transform columns according to mapping."""

def validate_row(row: dict) -> list[str]:
    """Return list of validation errors for a single visit row."""
    # Check: required fields present, timestamps parseable, chronological order valid
    # Use validate_visit_chronology from domain/

def parse_timestamps(row: dict, timezone: str) -> dict:
    """Convert naive timestamps to UTC-aware datetimes using clinic timezone."""
```

**`service.py`**:
```python
class DatasetService:
    async def upload_dataset(file: UploadFile, meta: DatasetUploadInit) -> DatasetOut
        # 1. Read file bytes, compute hash
        # 2. Check hash not already committed (idempotency)
        # 3. Parse file into DataFrame
        # 4. Store raw rows in dataset_rows collection with dataset_id + row_number
        # 5. Set status = "staged"
        # 6. Return DatasetOut

    async def preview_dataset(dataset_id: str, clinic_id: str, mappings: list[ColumnMapping], timezone: str) -> PreviewResult
        # 1. Load dataset_rows for dataset_id
        # 2. Apply column mappings
        # 3. Validate each row
        # 4. Return first 100 rows with validation results, counts

    async def commit_dataset(request: DatasetCommitRequest, clinic_id: str) -> CommitResult
        # 1. Apply mappings to all rows
        # 2. Filter to valid rows only
        # 3. Bulk insert into visits collection
        # 4. Update dataset status to "committed"
        # 5. Return {committed: N, skipped: M, errors: [...]}
```

**`router.py`**:
```
POST   /api/v1/clinics/{clinic_id}/datasets/upload     → upload file (multipart/form-data)
GET    /api/v1/clinics/{clinic_id}/datasets            → list datasets
GET    /api/v1/clinics/{clinic_id}/datasets/{id}       → get dataset status
POST   /api/v1/clinics/{clinic_id}/datasets/{id}/preview → preview with mappings
POST   /api/v1/clinics/{clinic_id}/datasets/{id}/commit  → commit valid rows
DELETE /api/v1/clinics/{clinic_id}/datasets/{id}       → delete staged dataset
```

### 2. Frontend — Data Import Wizard (`frontend/src/modules/data-import/`)

**`ImportWizardPage.tsx`** — 3-step wizard:

**Step 1: Upload**
- File dropzone (CSV/XLSX, max 50MB)
- Dataset name + description fields
- Upload button → progress indicator
- Shows: file name, row count, columns detected

**Step 2: Map Columns**
- Table showing detected columns vs CareQueue fields
- Dropdown per row to select target field (or "Skip")
- Datetime format input for timestamp columns
- "Preview Mapping" button

**Step 3: Preview & Commit**
- Summary: total rows, valid rows, invalid rows
- Table of first 50 rows with validation status (green/red)
- Expandable error details per invalid row
- "Commit Valid Rows" button with confirmation dialog
- Shows final result: "X visits imported, Y skipped"

**`DatasetListPage.tsx`**:
- Table of all datasets: Name, Status, Total/Valid/Invalid rows, Import Date
- Re-import and delete actions

**`useDatasets.ts`**: TanStack Query hooks

Routes: `/data/import` → ImportWizardPage, `/data/datasets` → DatasetListPage

### 3. Idempotency Check
In `DatasetService.upload_dataset()`: query `datasets` collection for `{clinic_id, file_hash, status: "committed"}`. If found, return error `"This file has already been imported."` with the existing dataset ID.

## Exit Gates
- [ ] `POST .../datasets/upload` accepts CSV/XLSX and returns staged dataset with row count
- [ ] `POST .../datasets/{id}/preview` returns per-row validation results
- [ ] `POST .../datasets/{id}/commit` only inserts valid rows into `visits` collection
- [ ] File hash idempotency check prevents double-import
- [ ] Frontend 3-step wizard: upload → map → preview/commit
- [ ] Invalid rows are shown with error details, never silently skipped
- [ ] Timestamps converted from clinic timezone to UTC on commit
