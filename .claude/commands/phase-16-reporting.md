# Phase 16 — Reporting & Exports

You are implementing Phase 16 of CareQueue: **Dashboard Reports, PDF/XLSX/CSV Export**.

## Project Context
CareQueue provides exportable reports in three formats:
- **PDF**: formatted report for stakeholders
- **XLSX**: structured data for further analysis
- **CSV**: raw data export

**Export Rule**: Every export must include:
1. Source label ("Historical Data" or "Simulation Estimates")
2. Date range and clinic name
3. Generation timestamp
4. If simulation: warning "These are estimates, not actual outcomes."

## Your Task

### 1. Reporting Module (`backend/app/modules/reporting/`)

```
modules/reporting/
├── __init__.py
├── schemas.py
├── service.py
├── pdf_generator.py
├── xlsx_generator.py
└── router.py
```

**`schemas.py`**:
```python
class ReportRequest(BaseModel):
    clinic_id: str
    report_type: Literal["waiting_time", "time_slot", "quality", "simulation_summary"]
    source: Literal["historical", "simulation"]
    start_date: Optional[date]
    end_date: Optional[date]
    simulation_result_id: Optional[str]  # for simulation reports
    department_ids: Optional[list[str]]
    format: Literal["pdf", "xlsx", "csv"]
    include_charts: bool = True  # PDF only

class ReportJob(BaseModel):
    job_id: str
    status: Literal["pending", "ready", "failed"]
    download_url: Optional[str]
    created_at: datetime
    expires_at: datetime  # download link expires in 1 hour
```

**`xlsx_generator.py`** using openpyxl:
```python
def generate_waiting_time_xlsx(data: dict, clinic_name: str) -> bytes:
    """
    Multi-sheet XLSX:
    - Sheet 1: Summary stats
    - Sheet 2: By department breakdown
    - Sheet 3: By time slot
    - Sheet 4: Raw visit data (if requested)
    Header row frozen, columns auto-fitted.
    Include source label in cell A1 of each sheet.
    """

def generate_simulation_xlsx(data: dict, clinic_name: str) -> bytes:
    """
    XLSX with simulation results.
    Include warning: 'SIMULATION ESTIMATES — Not actual outcomes' in bold red in A1.
    """
```

**`pdf_generator.py`** using ReportLab or WeasyPrint (use ReportLab for simplicity):
```python
def generate_waiting_time_pdf(data: dict, clinic_name: str) -> bytes:
    """
    PDF with:
    - Header: CareQueue logo placeholder, clinic name, date range
    - Source badge (green box: 'Historical Data')
    - KPI summary section with large numbers
    - Bar chart image (render with matplotlib, embed as PNG)
    - Breakdown table
    - Footer with generation timestamp
    """
```

Add `reportlab` and `matplotlib` to `requirements.txt`.

**`service.py`**:
```python
class ReportingService:
    async def generate_report(request: ReportRequest, clinic_id: str) -> bytes:
        # 1. Load analytics data
        # 2. Route to appropriate generator based on format
        # 3. Return file bytes

    async def create_report_job(request: ReportRequest, clinic_id: str) -> ReportJob:
        # For large reports: create async job, return job_id
        # For small reports: generate synchronously, return download URL directly
```

**`router.py`**:
```
POST  /api/v1/clinics/{clinic_id}/reports/generate  → generate report (returns file or job_id)
GET   /api/v1/clinics/{clinic_id}/reports/jobs/{id} → check report job status
GET   /api/v1/clinics/{clinic_id}/reports/download/{token} → download generated file
```

### 2. CSV Export (Simple)

Add CSV export directly to analytics endpoints:
- `GET .../analytics/historical/compute?format=csv` → returns CSV file

**`csv_exporter.py`** in domain:
```python
def visits_to_csv(visits: list[dict], include_fields: list[str]) -> str:
    """Convert visits list to CSV string using csv module."""

def analytics_to_csv(result: AnalyticsResult) -> str:
    """Convert analytics breakdown to CSV."""
```

### 3. Frontend — Reports Page (`frontend/src/modules/reports/`)

**`ReportsPage.tsx`**:

**Report Builder Panel**:
- Report Type selector: Waiting Time Analysis | Time-Slot Heatmap | Data Quality | Simulation Summary
- Source toggle: Historical | Simulation (shows appropriate date/config selectors)
- Date range picker (historical)
- Simulation result selector dropdown (simulation)
- Department filter
- Format buttons: PDF | XLSX | CSV
- "Generate Report" button

**Export Button Group Component**:
```
[ PDF ]  [ XLSX ]  [ CSV ]
```
On click: POST to generate endpoint → show download link or progress indicator.

**Report History Table**:
- Columns: Report Type, Source, Format, Generated At, Download (link with expiry warning)
- "Download" button disabled after 1 hour expiry

**`useReports.ts`**: TanStack Query hooks

Route: `/reports` → ReportsPage

### 4. Download Handler (Frontend)
```typescript
// utils/download.ts
export async function downloadReport(url: string, filename: string): Promise<void>
  // Fetch blob from URL, create object URL, trigger browser download, revoke URL
```

### 5. Simulation Report Warning Component
**`SimulationWarningBanner.tsx`**:
```
⚠ SIMULATION ESTIMATES
These figures are model-generated estimates based on configured assumptions.
They are NOT actual clinic outcomes. Verify assumptions before using for decisions.
```
Show this banner on every simulation-sourced report or export preview.

## Exit Gates
- [ ] XLSX export has multi-sheet structure with frozen header row
- [ ] XLSX simulation export shows bold red warning in A1
- [ ] PDF export includes source label and generation timestamp
- [ ] CSV export available on analytics endpoints via `?format=csv`
- [ ] Frontend report builder generates and downloads all 3 formats
- [ ] SimulationWarningBanner appears on simulation reports
- [ ] Download links expire after 1 hour
- [ ] `reportlab` and `matplotlib` added to `requirements.txt`
