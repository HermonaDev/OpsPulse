from backend import db, models
from fastapi import FastAPI
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models import User, Order, DriverLocation
from backend.db import SessionLocal
from pydantic import BaseModel
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import json
import redis.asyncio as redis
import asyncio

app= FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

redis_url = "redis://localhost:6379"
redis_pool = None

@app.on_event("startup")
async def startup():
    global redis_pool
    redis_pool = await redis.from_url(redis_url, decode_responses=True)

class UserCreate(BaseModel):
    name: str
    email: str
    hashed_password: str
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

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=user.hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/orders/")
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
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
def read_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.patch("/orders/{order_id}/status")
async def update_order_status(order_id: int, status_update: OrderStatusUpdate, db: Session = Depends(get_db)):
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
async def update_location(loc: DriverLocationCreate, db: Session = Depends(get_db)):
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
def get_locations(db: Session = Depends(get_db)):
    return db.query(DriverLocation).all()


