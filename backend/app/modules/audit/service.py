from typing import Optional
from datetime import datetime, timezone
from app.modules.audit.repository import AuditRepository

_repo = None

def get_audit_repo() -> AuditRepository:
    global _repo
    if _repo is None:
        _repo = AuditRepository()
    return _repo

async def log_event(
    clinic_id: str,
    event_type: str,
    actor_user_id: str,
    actor_email: str,
    target_id: Optional[str] = None,
    target_type: Optional[str] = None,
    metadata: dict = None,
) -> None:
    try:
        entry = {
            "clinic_id": clinic_id,
            "event_type": event_type,
            "actor_user_id": actor_user_id,
            "actor_email": actor_email,
            "target_id": target_id,
            "target_type": target_type,
            "metadata": metadata or {},
        }
        await get_audit_repo().append(entry)
    except Exception:
        pass  # Never fail on audit

async def list_entries(clinic_id: str, event_types: list = None, page: int = 1, page_size: int = 50) -> dict:
    skip = (page - 1) * page_size
    filters = {"event_types": event_types} if event_types else {}
    items = await get_audit_repo().find_by_clinic(clinic_id, filters, skip=skip, limit=page_size)
    total = await get_audit_repo().count({"clinic_id": clinic_id})
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}
