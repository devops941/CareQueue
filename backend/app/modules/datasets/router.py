from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.modules.datasets.schemas import DatasetCreate, DatasetOut, DatasetCommitRequest
from app.modules.datasets.service import DatasetService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetOut, status_code=201)
async def upload_dataset(
    clinic_id: str,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    _=Depends(require_roles("super_admin", "clinic_admin", "analyst")),
):
    file_bytes = await file.read()
    meta = DatasetCreate(name=name, description=description)
    return await DatasetService().upload_dataset(clinic_id, file_bytes, file.filename, meta)

@router.get("", response_model=list[DatasetOut])
async def list_datasets(clinic_id: str, _=Depends(get_current_user)):
    return await DatasetService().list_datasets(clinic_id)

@router.post("/{dataset_id}/preview")
async def preview_dataset(clinic_id: str, dataset_id: str, request: DatasetCommitRequest, _=Depends(get_current_user)):
    return await DatasetService().preview_dataset(clinic_id, dataset_id, request)

@router.post("/{dataset_id}/commit")
async def commit_dataset(clinic_id: str, dataset_id: str, request: DatasetCommitRequest, _=Depends(require_roles("super_admin", "clinic_admin", "analyst"))):
    return await DatasetService().commit_dataset(clinic_id, dataset_id, request)
