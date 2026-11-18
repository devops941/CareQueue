from fastapi import APIRouter, Depends, BackgroundTasks
from app.modules.simulation.schemas import SimConfigCreate, SimConfigOut, SimResultOut
from app.modules.simulation.service import SimulationService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/simulation", tags=["Simulation"])

@router.post("/configs", response_model=SimConfigOut, status_code=201)
async def create_config(clinic_id: str, data: SimConfigCreate, current_user=Depends(require_roles("super_admin","clinic_admin","analyst"))):
    created = await SimulationService().create_config(clinic_id, data)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="simulation.config_created",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=created.id,
            target_type="simulation_config",
            metadata={"name": created.name, "replications": created.num_replications}
        )
    except Exception:
        pass
    return created

@router.get("/configs", response_model=list[SimConfigOut])
async def list_configs(clinic_id: str, _=Depends(get_current_user)):
    return await SimulationService().list_configs(clinic_id)

@router.post("/configs/{config_id}/run", response_model=SimResultOut)
async def run_simulation(clinic_id: str, config_id: str, current_user=Depends(require_roles("super_admin","clinic_admin","analyst"))):
    result = await SimulationService().run_simulation(clinic_id, config_id)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="simulation.run",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=config_id,
            target_type="simulation_result",
            metadata={"mean_queue_wait": result.overall.get("mean_queue_wait"), "replications": result.replications}
        )
    except Exception:
        pass
    return result

@router.get("/results", response_model=list[SimResultOut])
async def list_results(clinic_id: str, config_id: str = None, _=Depends(get_current_user)):
    return await SimulationService().list_results(clinic_id, config_id)

@router.post("/compare")
async def compare_scenarios(clinic_id: str, payload: dict, _=Depends(get_current_user)):
    result_ids = payload.get("result_ids", [])
    return await SimulationService().compare_scenarios(clinic_id, result_ids)
