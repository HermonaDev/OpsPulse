from backend import db, models
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Security
from sqlalchemy.orm import Session
from backend.models import User, Order, DriverLocation
from backend.db import SessionLocal
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordBearer
from typing import List
import json
import redis.asyncio as redis
import asyncio
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv(dotenv_path="./backend/.env")

app= FastAPI()

redis_pool = None

load_dotenv("startup")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY  = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

@app.on_event("startup")
async def startup():
    global redis_pool
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_pool = await redis.from_url(redis_url, decode_responses=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Security(oauth2_scheme)):   
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_role(require_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in require_roles:
            raise HTTPException(status_code=403, detail=f"Access Denied: Requires role(s) {', '.join(require_roles)}")
        return current_user
    return role_checker

def hash_password(password:str):
    if len(password) == 0:
        raise ValueError("Password cannot be empty")
    return pwd_context.hash(password)

def hash_password(password: str):
    if not password or len(password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    if len(password) > 72:  
        raise HTTPException(status_code=400, detail="Password too long (max 72 characters)")

    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "admin", "agent", "owner"

class OrderCreate(BaseModel):
    customer_name: str
    delivery_address: str
    assigned_agent_id: int

class OrderStatusUpdate(BaseModel):
    status: str  # "pending", "shipped", "delivered"

class DriverLocationCreate(BaseModel):
    agent_id: int
    latitude: float
    longitude: float

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "OpsPulse backend API is running"}

@app.post("/signup/")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully"}

@app.post("/login/", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": db_user.email, "role": db_user.role}
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/admin/users/")
def list_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    return db.query(User).all()

@app.post("/orders/")
async def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin", "agent"]))):
    db_order = Order(
        customer_name=order.customer_name,
        delivery_address=order.delivery_address,
        assigned_agent_id=order.assigned_agent_id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    message = json.dumps({"event": "order_created", "order_id": db_order.id, "customer_name": db_order.customer_name})
    await redis_pool.publish("ops_events", message)
    return db_order

@app.get("/orders/")
def read_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin", "agent", "owner"]))
):
    return db.query(Order).all()


@app.patch("/orders/{order_id}/status")
async def update_order_status(order_id: int, status_update: OrderStatusUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    message = json.dumps({
        "event": "order_status", "order_id": order_id, "new_status": status_update.status
    })
    await redis_pool.publish("ops_events", message)    
    return order

@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    pubsub = redis_pool.pubsub()
    await pubsub.subscribe("ops_events")
    try:
        async for message in pubsub.listen():
            if message['type'] == 'message':
                await manager.broadcast(message['data'])
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        await pubsub.unsubscribe("ops_events")
        await pubsub.close()
        
@app.post("/locations/")
async def update_location(loc: DriverLocationCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin","agent"]))):
    driver_location = DriverLocation(
        agent_id=loc.agent_id,
        latitude=loc.latitude,
        longitude=loc.longitude
    )
    db.add(driver_location)
    db.commit()
    db.refresh(driver_location)
    message = json.dumps({
        "event": "location_update",
        "agent_id": loc.agent_id,
        "latitude": loc.latitude,
        "longitude": loc.longitude
    })
    await redis_pool.publish("ops_events", message)
    return driver_location

@app.get("/locations/")
def get_locations(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin","owner"]))):
    return db.query(DriverLocation).all()

