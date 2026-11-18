from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class DepartmentCreate(BaseModel):
    name: str
    code: str
    service_type: Literal["consultation", "diagnostic", "procedure", "pharmacy"] = "consultation"
    avg_service_time_minutes: float = 15.0
    max_concurrent_patients: int = 1
    description: Optional[str] = None

class DepartmentOut(BaseModel):
    id: str
    clinic_id: str
    name: str
    code: str
    service_type: str
    avg_service_time_minutes: float
    max_concurrent_patients: int
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    model_config = {"populate_by_name": True, "extra": "ignore"}

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    service_type: Optional[str] = None
    avg_service_time_minutes: Optional[float] = None
    max_concurrent_patients: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
