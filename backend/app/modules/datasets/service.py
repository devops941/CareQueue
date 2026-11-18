from fastapi import HTTPException, UploadFile
from bson import ObjectId
from datetime import datetime, timezone
from app.modules.datasets.schemas import DatasetCreate, DatasetOut, DatasetCommitRequest, RowPreview
from app.modules.datasets.repository import DatasetRepository, DatasetRowRepository
from app.modules.datasets.importer import compute_file_hash, read_file, apply_column_mapping, validate_row, parse_datetime_str

class DatasetService:
    def __init__(self):
        self.repo = DatasetRepository()
        self.row_repo = DatasetRowRepository()

    def _to_out(self, doc: dict) -> DatasetOut:
        return DatasetOut(**doc)

    async def upload_dataset(self, clinic_id: str, file_bytes: bytes, filename: str, meta: DatasetCreate) -> DatasetOut:
        file_hash = compute_file_hash(file_bytes)
        # Check idempotency
        existing = await self.repo.find_one({"clinic_id": clinic_id, "file_hash": file_hash, "status": "committed"})
        if existing:
            raise HTTPException(400, f"This file was already imported (dataset id: {existing['id']})")

        try:
            df = read_file(file_bytes, filename)
        except Exception as e:
            raise HTTPException(400, f"Could not read file: {e}")

        doc = {
            **meta.model_dump(),
            "status": "staged",
            "file_hash": file_hash,
            "original_filename": filename,
            "total_rows": len(df),
            "valid_rows": 0,
            "invalid_rows": 0,
            "columns": list(df.columns),
        }
        dataset_id = await self.repo.create_dataset(clinic_id, doc)

        # Store raw rows
        rows = []
        for i, row in df.iterrows():
            rows.append({
                "dataset_id": dataset_id,
                "clinic_id": clinic_id,
                "row_number": int(i) + 1,
                "raw_data": row.to_dict(),
            })
        await self.row_repo.insert_rows(rows)

        created = await self.repo.find_one({"_id": ObjectId(dataset_id)}, clinic_id)
        return self._to_out(created)

    async def preview_dataset(self, clinic_id: str, dataset_id: str, request: DatasetCommitRequest) -> dict:
        raw_rows = await self.row_repo.find_by_dataset(dataset_id, limit=100)
        import pandas as pd
        if not raw_rows:
            return {"total": 0, "valid": 0, "invalid": 0, "rows": []}

        df = pd.DataFrame([r["raw_data"] for r in raw_rows])
        mapped_df = apply_column_mapping(df, [m.model_dump() for m in request.column_mappings])

        previews = []
        valid = invalid = 0
        for i, raw_row in enumerate(raw_rows[:100]):
            mapped = mapped_df.iloc[i].to_dict() if i < len(mapped_df) else {}
            errors = validate_row(mapped)
            is_valid = len(errors) == 0
            if is_valid: valid += 1
            else: invalid += 1
            previews.append(RowPreview(
                row_number=raw_row["row_number"],
                raw_data=raw_row["raw_data"],
                mapped_data=mapped,
                validation_errors=errors,
                is_valid=is_valid,
            ).model_dump())

        return {"total": len(raw_rows), "valid": valid, "invalid": invalid, "rows": previews}

    async def commit_dataset(self, clinic_id: str, dataset_id: str, request: DatasetCommitRequest) -> dict:
        raw_rows = await self.row_repo.find_by_dataset(dataset_id, limit=50000)
        import pandas as pd
        if not raw_rows:
            return {"committed": 0, "skipped": 0}

        df = pd.DataFrame([r["raw_data"] for r in raw_rows])
        mapped_df = apply_column_mapping(df, [m.model_dump() for m in request.column_mappings])

        # Map datetime format per field
        fmt_map = {m.target_field: m.datetime_format for m in request.column_mappings}

        from app.modules.visits.repository import VisitRepository
        visit_repo = VisitRepository()

        visits_to_insert = []
        skipped = 0
        for i in range(len(mapped_df)):
            row = mapped_df.iloc[i].to_dict()
            errors = validate_row(row)
            if errors:
                skipped += 1
                continue

            visit = {}
            datetime_fields = ["arrival_time","registration_time","triage_time","called_time","service_start_time","service_end_time","departure_time"]
            for field in datetime_fields:
                if field in row and row[field]:
                    visit[field] = parse_datetime_str(str(row[field]), fmt_map.get(field), request.timezone)
            for field in ["patient_token","visit_type","notes","department_id","doctor_id"]:
                if field in row and row[field]:
                    visit[field] = str(row[field])
            if "visit_date" in row and row["visit_date"]:
                visit["visit_date"] = str(row["visit_date"])[:10]
            elif visit.get("arrival_time"):
                try:
                    visit["visit_date"] = visit["arrival_time"].date().isoformat()
                except Exception:
                    pass

            if not visit.get("visit_type"):
                visit["visit_type"] = "walk_in"
            if not visit.get("patient_token"):
                visit["patient_token"] = f"CQ-{1000 + i}"
            visits_to_insert.append(visit)

        committed = await visit_repo.bulk_insert(clinic_id, visits_to_insert)

        from bson import ObjectId
        from datetime import datetime, timezone
        await self.repo.update_one({"_id": ObjectId(dataset_id)}, {
            "status": "committed",
            "valid_rows": committed,
            "invalid_rows": skipped,
            "committed_at": datetime.now(timezone.utc),
        }, clinic_id)

        # Log audit trail for dataset ingestion
        try:
            from app.modules.audit.service import log_event
            await log_event(
                clinic_id=clinic_id,
                event_type="dataset.imported",
                actor_user_id="user_admin",
                actor_email="admin@gmail.com",
                target_id=str(dataset_id),
                target_type="dataset",
                metadata={"valid_rows": committed, "skipped": skipped}
            )
        except Exception:
            pass

        return {
            "success": True,
            "committed": committed,
            "valid_rows": committed,
            "invalid_rows": skipped,
            "skipped": skipped,
        }

    async def list_datasets(self, clinic_id: str) -> list[DatasetOut]:
        docs = await self.repo.find_many({}, clinic_id=clinic_id, sort=[("created_at", -1)])
        return [self._to_out(d) for d in docs]
