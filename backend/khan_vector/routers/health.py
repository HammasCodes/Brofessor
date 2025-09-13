# routers/health.py
from fastapi import APIRouter

# Add prefix "/health" to the router
router = APIRouter(prefix="/health")

@router.get("/")
def health_check():
    return {"status": "ok", "message": "Backend is running fine 🚀"}
