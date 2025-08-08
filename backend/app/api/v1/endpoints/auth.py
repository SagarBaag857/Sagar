from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@router.post("/login")
async def login(request: LoginRequest):
    return {"access_token": "demo_token", "token_type": "bearer"}

@router.post("/register")
async def register(request: RegisterRequest):
    return {"message": "User registered successfully", "user_id": "demo_user"}