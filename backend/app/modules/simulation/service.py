from fastapi import HTTPException
from bson import ObjectId
from app.modules.simulation.schemas import SimConfigCreate, SimConfigOut, SimResultOut
from app.modules.simulation.repository import SimConfigRepository, SimResultRepository
from app.domain.simulation.engine import run_replications

class SimulationService:
    def __init__(self):
        self.config_repo = SimConfigRepository()
        self.result_repo = SimResultRepository()

    async def create_config(self, clinic_id: str, data: SimConfigCreate) -> SimConfigOut:
        doc = data.model_dump()
        config_id = await self.config_repo.create(clinic_id, doc)
        created = await self.config_repo.find_one({"_id": ObjectId(config_id)}, clinic_id)
        return SimConfigOut(**created)

    async def list_configs(self, clinic_id: str) -> list:
        docs = await self.config_repo.find_many({}, clinic_id=clinic_id)
        return [SimConfigOut(**d) for d in docs]

    async def run_simulation(self, clinic_id: str, config_id: str) -> SimResultOut:
        config_doc = await self.config_repo.find_one({"_id": ObjectId(config_id)}, clinic_id)
        if not config_doc:
            raise HTTPException(404, "Simulation config not found")

        result = run_replications(config_doc, config_doc.get("num_replications", 10))

        result_doc = {
            "config_id": config_id,
            "source": "simulation",
            "model_version": "1.0",
            "assumptions": {k: v for k, v in config_doc.items() if k not in ["id", "_id", "clinic_id", "created_at"]},
            "overall": result.get("overall", {}),
            "by_department": result.get("by_department", {}),
            "replications": result.get("replications", 1),
        }
        result_id = await self.result_repo.create(clinic_id, result_doc)
        created = await self.result_repo.find_one({"_id": ObjectId(result_id)}, clinic_id)
        return SimResultOut(**created)

    async def list_results(self, clinic_id: str, config_id: str = None) -> list:
        f = {}
        if config_id:
            f["config_id"] = config_id
        docs = await self.result_repo.find_many(f, clinic_id=clinic_id)
        return [SimResultOut(**d) for d in docs]

    async def compare_scenarios(self, clinic_id: str, result_ids: list) -> dict:
        scenarios = []
        for rid in result_ids:
            doc = await self.result_repo.find_one({"_id": ObjectId(rid)}, clinic_id)
            if doc:
                scenarios.append({
                    "id": doc["id"],
                    "config_name": doc["assumptions"].get("name", rid),
                    "mean_queue_wait": doc["overall"].get("mean_queue_wait", 0),
                    "ci_lower": doc["overall"].get("ci_lower", 0),
                    "ci_upper": doc["overall"].get("ci_upper", 0),
                    "total_patients": doc["overall"].get("total_patients", 0),
                    "overall": doc["overall"],
                })

        if scenarios:
            winner = min(scenarios, key=lambda s: s["mean_queue_wait"])
        else:
            winner = None

        return {"source": "simulation", "scenarios": scenarios, "winner": winner, "comparison": scenarios}
