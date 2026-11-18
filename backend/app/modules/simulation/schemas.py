from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class DeptSimConfig(BaseModel):
    department_id: str
    num_servers: int = 1
    arrival_distribution: Literal["exponential","lognormal","gamma","uniform"] = "exponential"
    arrival_params: dict = {"rate": 0.5}
    service_distribution: Literal["exponential","lognormal","triangular","deterministic"] = "lognormal"
    service_params: dict = {"mean": 15.0, "std": 5.0}

class SimConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    simulation_hours: float = 8.0
    num_replications: int = 10
    base_seed: int = 42
    warm_up_minutes: float = 30.0
    departments: List[DeptSimConfig]

class SimConfigOut(BaseModel):
    id: str
    clinic_id: str
    name: str
    description: Optional[str]
    simulation_hours: float
    num_replications: int
    base_seed: int
    departments: List[DeptSimConfig]
    created_at: datetime
    model_config = {"populate_by_name": True}

class SimResultOut(BaseModel):
    id: str
    clinic_id: str
    config_id: str
    source: str = "simulation"
    model_version: str = "1.0"
    assumptions: dict
    overall: dict
    by_department: dict
    replications: Optional[int] = 10
    computed_at: datetime
    model_config = {"populate_by_name": True}
