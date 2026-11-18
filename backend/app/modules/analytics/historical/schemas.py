from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import date, datetime

class AnalyticsQuery(BaseModel):
    start_date: date
    end_date: date
    metric: Literal["queue_wait","registration_wait","service_time","total_visit"] = "queue_wait"
    group_by: Literal["department","doctor","day_of_week","time_slot","visit_type"] = "department"
    slot_minutes: int = 60
    department_ids: Optional[List[str]] = None

class HeatmapQuery(BaseModel):
    start_date: date
    end_date: date
    metric: Literal["count","queue_wait","service_time","total_visit"] = "count"
    slot_minutes: int = 60
