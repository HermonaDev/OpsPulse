import db
from fastapi import FastAPI
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from models import Order
from db import SessionLocal
from pydantic import BaseModel
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import json

app= FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(
        customer_name=order.customer_name,
        delivery_address=order.delivery_address,
        assigned_agent_id=order.assigned_agent_id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
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
    await manager.broadcast(json.dumps({"order_id": order_id, "new_status": status_update.status}))
    db.commit()
    db.refresh(order)
    return order

manager = ConnectionManager()

@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)