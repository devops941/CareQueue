from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal
from datetime import datetime, date

class VisitCreate(BaseModel):
    patient_token: str
    visit_date: date
    department_id: str
    doctor_id: Optional[str] = None
    arrival_time: datetime
    registration_time: Optional[datetime] = None
    triage_time: Optional[datetime] = None
    called_time: Optional[datetime] = None
    service_start_time: Optional[datetime] = None
    service_end_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    visit_type: Literal["new", "follow_up", "emergency", "walk_in"] = "new"
    notes: Optional[str] = None

    @model_validator(mode="after")
    def check_chronology(self):
        from app.domain.visit_validation import validate_visit_chronology
        data = self.model_dump()
        errors = validate_visit_chronology({k: v for k, v in data.items() if v is not None})
        if errors:
            raise ValueError("; ".join(errors))
        return self

class VisitOut(BaseModel):
    id: str
    clinic_id: str
    patient_token: str
    visit_date: date
    department_id: str
    doctor_id: Optional[str]
    arrival_time: datetime
    registration_time: Optional[datetime]
    triage_time: Optional[datetime]
    called_time: Optional[datetime]
    service_start_time: Optional[datetime]
    service_end_time: Optional[datetime]
    departure_time: Optional[datetime]
    visit_type: str
    notes: Optional[str]
    excluded: bool = False
    registration_wait_minutes: Optional[float] = None
    queue_wait_minutes: Optional[float] = None
    service_time_minutes: Optional[float] = None
    total_visit_minutes: Optional[float] = None
    created_at: datetime
    model_config = {"populate_by_name": True}

class VisitUpdate(BaseModel):
    registration_time: Optional[datetime] = None
    triage_time: Optional[datetime] = None
    called_time: Optional[datetime] = None
    service_start_time: Optional[datetime] = None
    service_end_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    visit_type: Optional[str] = None
    notes: Optional[str] = None
