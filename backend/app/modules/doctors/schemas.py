from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class DaySchedule(BaseModel):
    start: str = "09:00"
    end: str = "17:00"
    break_start: Optional[str] = "13:00"
    break_end: Optional[str] = "14:00"
    is_working: bool = True

class WeeklySchedule(BaseModel):
    monday: Optional[DaySchedule] = None
    tuesday: Optional[DaySchedule] = None
    wednesday: Optional[DaySchedule] = None
    thursday: Optional[DaySchedule] = None
    friday: Optional[DaySchedule] = None
    saturday: Optional[DaySchedule] = None
    sunday: Optional[DaySchedule] = None

class DoctorCreate(BaseModel):
    full_name: str
    specialization: str
    department_id: str
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    license_number: Optional[str] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    shift_timing: Optional[str] = "09:00 AM - 01:00 PM"
    available_days: Optional[list[str]] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "13:00"
    break_time: Optional[str] = None
    schedule: WeeklySchedule = WeeklySchedule()
    max_patients_per_slot: int = 1
    avg_consultation_minutes: float = 15.0

class DoctorOut(BaseModel):
    id: str
    clinic_id: str
    department_id: str
    full_name: str
    specialization: str
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    license_number: Optional[str] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    shift_timing: Optional[str] = "09:00 AM - 01:00 PM"
    available_days: Optional[list[str]] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "13:00"
    break_time: Optional[str] = None
    schedule: WeeklySchedule = WeeklySchedule()
    max_patients_per_slot: int = 1
    avg_consultation_minutes: float = 15.0
    is_active: bool = True
    created_at: datetime
    model_config = {"populate_by_name": True, "extra": "ignore"}

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    department_id: Optional[str] = None
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    license_number: Optional[str] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    shift_timing: Optional[str] = None
    available_days: Optional[list[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    break_time: Optional[str] = None
    schedule: Optional[WeeklySchedule] = None
    max_patients_per_slot: Optional[int] = None
    avg_consultation_minutes: Optional[float] = None
    is_active: Optional[bool] = None
