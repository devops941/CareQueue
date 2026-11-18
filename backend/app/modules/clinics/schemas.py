from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime
import pytz

class DaySchedule(BaseModel):
    open: str = "08:00"
    close: str = "18:00"
    is_open: bool = True

class WorkingHours(BaseModel):
    monday: Optional[DaySchedule] = None
    tuesday: Optional[DaySchedule] = None
    wednesday: Optional[DaySchedule] = None
    thursday: Optional[DaySchedule] = None
    friday: Optional[DaySchedule] = None
    saturday: Optional[DaySchedule] = None
    sunday: Optional[DaySchedule] = None

class ClinicCreate(BaseModel):
    name: str
    slug: str
    timezone: str = "Asia/Kolkata"
    working_hours: WorkingHours = WorkingHours()
    contact_email: EmailStr
    address: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v):
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError("Slug must be lowercase letters, numbers, hyphens only")
        return v

class ClinicOut(BaseModel):
    id: str
    name: str
    slug: str
    timezone: str
    working_hours: WorkingHours
    contact_email: str
    address: Optional[str]
    is_active: bool
    is_onboarded: bool = False
    created_at: datetime
    updated_at: datetime
    model_config = {"populate_by_name": True}

class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    working_hours: Optional[WorkingHours] = None
    contact_email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_onboarded: Optional[bool] = None

class ClinicOnboardingPayload(BaseModel):
    name: str
    address: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    shift_start: str = "08:00"
    shift_end: str = "18:00"
    departments: list[dict] = []
    lead_doctor: Optional[dict] = None
    seed_demo_visits: bool = True
