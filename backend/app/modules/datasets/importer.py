import hashlib
import pandas as pd
from io import BytesIO
from datetime import datetime
import pytz

VISIT_FIELDS = [
    "patient_token", "visit_date", "department_id", "doctor_id",
    "arrival_time", "registration_time", "triage_time", "called_time",
    "service_start_time", "service_end_time", "departure_time",
    "visit_type", "notes"
]

def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

def read_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith(".csv"):
        return pd.read_csv(BytesIO(file_bytes), dtype=str).fillna("")
    elif filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(BytesIO(file_bytes), dtype=str).fillna("")
    raise ValueError(f"Unsupported file type: {filename}")

def apply_column_mapping(df: pd.DataFrame, mappings: list[dict]) -> pd.DataFrame:
    mapped = {}
    mapped_sources = set()
    mapped_targets = set()

    # 1. Apply explicit mappings requested by user
    if mappings:
        for m in mappings:
            src = m.get("source_column")
            tgt = m.get("target_field")
            if src and src in df.columns and tgt:
                mapped[tgt] = df[src]
                mapped_sources.add(src)
                mapped_targets.add(tgt)

    # 2. Smart auto-match: if standard target fields are NOT yet mapped,
    # preserve columns directly from df (case-insensitive & clean)
    for col in df.columns:
        if col in mapped_sources:
            continue
        clean_col = str(col).strip().lower().replace(" ", "_").replace("-", "_")

        for field in VISIT_FIELDS:
            if field in mapped_targets:
                continue
            clean_field = field.lower()
            if clean_col == clean_field:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            # Fuzzy match common column aliases:
            if field == "arrival_time" and clean_col in ["arrival", "arrival_time", "checkin", "check_in", "entry_time"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "patient_token" and clean_col in ["token", "patient_id", "patient_token", "mrn", "id", "patient"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "registration_time" and clean_col in ["reg_time", "registration", "registration_time", "reg"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "called_time" and clean_col in ["called", "called_time", "call_time", "call"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "service_start_time" and clean_col in ["service_start", "consult_start", "service_start_time", "doctor_start"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "service_end_time" and clean_col in ["service_end", "consult_end", "service_end_time", "doctor_end"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "departure_time" and clean_col in ["departure", "departure_time", "exit_time", "checkout", "depart"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "visit_type" and clean_col in ["type", "visit_type", "category"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "department_id" and clean_col in ["department", "department_id", "dept", "specialization"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break
            if field == "visit_date" and clean_col in ["visit_date", "date"]:
                mapped[field] = df[col]
                mapped_targets.add(field)
                break

    return pd.DataFrame(mapped)

from typing import Optional

def parse_datetime_str(val, fmt: str = None, tz_str: str = "Asia/Kolkata") -> Optional[datetime]:
    if val is None or str(val).strip() == "":
        return None
    try:
        tz = pytz.timezone(tz_str)
        val_str = str(val).strip()
        if fmt:
            dt = datetime.strptime(val_str, fmt)
        else:
            from dateutil import parser as dateparser
            dt = dateparser.parse(val_str)
        if dt.tzinfo is None:
            dt = tz.localize(dt)
        return dt.astimezone(pytz.utc)
    except Exception:
        return None

def validate_row(row: dict) -> list[str]:
    errors = []
    if not row.get("arrival_time") and not row.get("arrival"):
        errors.append("arrival_time is required")
    return errors
