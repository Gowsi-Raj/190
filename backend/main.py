from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.admin import router as admin_router

app = FastAPI(
    title="Secure Legal DMS Engine",
    description="Role-Based Access Control, Section 63 BSA Compliance, and Evidentiary Chain of Custody",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(admin_router)



@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "HEALTHY", "engine": "Legal DMS Backend"}