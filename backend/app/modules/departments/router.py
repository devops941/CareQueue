from fastapi import APIRouter, Depends
from app.modules.departments.schemas import DepartmentCreate, DepartmentOut, DepartmentUpdate
from app.modules.departments.service import DepartmentService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/departments", tags=["Departments"])

@router.post("", response_model=DepartmentOut, status_code=201)
async def create_dept(clinic_id: str, data: DepartmentCreate, _=Depends(require_roles("super_admin", "clinic_admin"))):
    return await DepartmentService().create_department(clinic_id, data)

@router.get("", response_model=list[DepartmentOut])
async def list_depts(clinic_id: str, _=Depends(get_current_user)):
    return await DepartmentService().list_departments(clinic_id)

@router.get("/{dept_id}", response_model=DepartmentOut)
async def get_dept(clinic_id: str, dept_id: str, _=Depends(get_current_user)):
    return await DepartmentService().get_department(clinic_id, dept_id)

@router.patch("/{dept_id}", response_model=DepartmentOut)
async def update_dept(clinic_id: str, dept_id: str, data: DepartmentUpdate, _=Depends(require_roles("super_admin", "clinic_admin"))):
    return await DepartmentService().update_department(clinic_id, dept_id, data)

@router.delete("/{dept_id}")
async def deactivate_dept(clinic_id: str, dept_id: str, _=Depends(require_roles("super_admin", "clinic_admin"))):
    await DepartmentService().deactivate_department(clinic_id, dept_id)
    return {"message": "Department deactivated"}
