from backend import db, models
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Security
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.models import User, Order, DriverLocation, Vehicle
from backend.db import SessionLocal
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordBearer
from typing import List
from backend.models import Base
from backend.db import engine
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_pool = None
redis_available = False

load_dotenv("startup")

Base.metadata.create_all(bind=db.engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY  = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours for better persistence
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

@app.on_event("startup")
async def startup():
    global redis_pool, redis_available
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
        redis_pool = await redis.from_url(redis_url, decode_responses=True)
        # Test connection
        await redis_pool.ping()
        redis_available = True
    except Exception as e:
        print(f"Redis not available: {e}. Continuing without Redis (real-time features disabled).")
        redis_available = False

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
    phone: str = ""  # phone number for agents

class OrderCreate(BaseModel):
    customer_name: str
    delivery_address: str
    delivery_latitude: float = None  # Optional coordinates
    delivery_longitude: float = None
    pickup_address: str = None  # Optional pickup location
    pickup_latitude: float = None
    pickup_longitude: float = None
    assigned_agent_id: int = None  # Optional, will be assigned by admin

class OrderApproval(BaseModel):
    assigned_agent_id: int

class OrderStatusUpdate(BaseModel):
    status: str  # "pending", "approved", "picked_up", "in_transit", "delivered"
    vehicle_id: int = None  # Optional vehicle ID when picking up

class VehicleCreate(BaseModel):
    license_plate: str
    model: str
    vehicle_type: str
    status: str = "available"
    
class VehicleApproval(BaseModel):
    approval_status: str  # "approved" or "rejected"
    
class VehicleAgentAssignment(BaseModel):
    assigned_agent_id: int

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
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Validate role - allow pending roles for signup (will be approved by admin later)
    valid_roles = ["admin", "agent", "owner", "agent_pending", "owner_pending"]
    if user.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Broadcast signup event to admins
    if redis_available:
        message = json.dumps({
            "event": "user_signup",
            "user_id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        })
        await redis_pool.publish("ops_events", message)
    return {"message": "User created successfully"}

@app.post("/login/", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Prevent pending users from logging in until admin approval
    if db_user.role in ["agent_pending", "owner_pending"]:
        raise HTTPException(
            status_code=403, 
            detail="Your account is pending admin approval. Please wait for an admin to verify your account."
        )
    
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": db_user.email, "role": db_user.role, "user_id": db_user.id}
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
    # Filter out rejected users from the list
    return db.query(User).filter(User.role != "rejected").all()

class UserRoleUpdate(BaseModel):
    role: str  # "owner", "agent", "admin", "rejected"

@app.patch("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If rejecting, delete the user instead of setting role to "rejected"
    if role_update.role == "rejected":
        db.delete(db_user)
        db.commit()
        # Broadcast user deleted event
        if redis_available:
            message = json.dumps({
                "event": "user_deleted",
                "user_id": user_id
            })
            await redis_pool.publish("ops_events", message)
        return {"message": "User rejected and deleted successfully"}
    
    db_user.role = role_update.role
    db.commit()
    db.refresh(db_user)
    # Broadcast role update event
    if redis_available:
        message = json.dumps({
            "event": "user_role_updated",
            "user_id": user_id,
            "new_role": role_update.role
        })
        await redis_pool.publish("ops_events", message)
    return db_user

@app.post("/orders/")
async def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin", "agent", "owner"]))):
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    
    # Set owner_id if user is owner
    owner_id = user_id if user_role == "owner" else None
    
    db_order = Order(
        customer_name=order.customer_name,
        delivery_address=order.delivery_address,
        delivery_latitude=order.delivery_latitude if order.delivery_latitude else None,
        delivery_longitude=order.delivery_longitude if order.delivery_longitude else None,
        pickup_address=order.pickup_address if order.pickup_address else None,
        pickup_latitude=order.pickup_latitude if order.pickup_latitude else None,
        pickup_longitude=order.pickup_longitude if order.pickup_longitude else None,
        assigned_agent_id=order.assigned_agent_id if order.assigned_agent_id else None,
        owner_id=owner_id,
        status="pending"  # Always start as pending
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    if redis_available:
        message = json.dumps({
            "event": "order_created", 
            "order_id": db_order.id, 
            "customer_name": db_order.customer_name,
            "owner_id": db_order.owner_id,
            "status": db_order.status
        })
        await redis_pool.publish("ops_events", message)
    return db_order

@app.get("/orders/")
def read_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin", "agent", "owner"]))
):
    # If user is owner, only return orders belonging to that owner
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "owner" and user_id:
        return db.query(Order).filter(Order.owner_id == user_id).all()
    # Admin and agent can see all orders
    return db.query(Order).all()


@app.patch("/orders/{order_id}/approve")
async def approve_order(
    order_id: int,
    approval: OrderApproval,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin approves order and assigns agent, or reassigns agent for existing orders"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate assigned_agent_id is provided and is a valid integer
    try:
        agent_id = int(approval.assigned_agent_id)
        if agent_id <= 0:
            raise HTTPException(status_code=400, detail="assigned_agent_id must be a valid positive integer")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="assigned_agent_id must be a valid integer")
    
    # Verify agent exists and is actually an agent
    from sqlalchemy import and_
    agent = db.query(User).filter(and_(User.id == approval.assigned_agent_id, User.role == "agent")).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent with ID {approval.assigned_agent_id} not found or is not an agent")
    
    # If order is pending, approve it. Otherwise, just reassign agent.
    was_pending = order.status == "pending"
    old_agent_id = order.assigned_agent_id
    
    order.assigned_agent_id = approval.assigned_agent_id
    if was_pending:
        order.status = "approved"
    db.commit()
    db.refresh(order)
    
    if redis_available:
        message = json.dumps({
            "event": "order_status",
            "order_id": order_id,
            "new_status": order.status,
            "owner_id": order.owner_id,
            "assigned_agent_id": approval.assigned_agent_id,
            "old_agent_id": old_agent_id
        })
        await redis_pool.publish("ops_events", message)
    return order

@app.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int, 
    status_update: OrderStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """Update order status - used by agents to update lifecycle"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    # Validate status transitions
    valid_statuses = ["pending", "approved", "picked_up", "in_transit", "delivered"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Agents can only update their own assigned orders
    if user_role == "agent":
        if order.assigned_agent_id != user_id:
            raise HTTPException(status_code=403, detail="You can only update orders assigned to you")
        
        # Validate agent status transitions
        allowed_agent_statuses = ["picked_up", "in_transit", "delivered"]
        if status_update.status not in allowed_agent_statuses:
            raise HTTPException(status_code=400, detail=f"Agents can only set status to: {', '.join(allowed_agent_statuses)}")
        
        # Ensure proper progression
        if order.status == "approved" and status_update.status not in ["picked_up"]:
            raise HTTPException(status_code=400, detail="Order must be picked_up before other statuses")
        if order.status == "picked_up" and status_update.status not in ["in_transit"]:
            raise HTTPException(status_code=400, detail="Order must be in_transit after picked_up")
        if order.status == "in_transit" and status_update.status not in ["delivered"]:
            raise HTTPException(status_code=400, detail="Order must be delivered after in_transit")
        
        # When picking up, require vehicle assignment
        if status_update.status == "picked_up":
            if not status_update.vehicle_id:
                raise HTTPException(status_code=400, detail="Vehicle must be assigned when picking up order")
            vehicle = db.query(Vehicle).filter(Vehicle.id == status_update.vehicle_id).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")
            if vehicle.status != "available":
                raise HTTPException(status_code=400, detail="Vehicle is not available")
            order.vehicle_id = status_update.vehicle_id
            vehicle.status = "in_use"
            # Update vehicle location to agent's current location
            agent_location = db.query(DriverLocation).filter(
                DriverLocation.agent_id == user_id
            ).order_by(DriverLocation.timestamp.desc()).first()
            if agent_location:
                vehicle.current_latitude = agent_location.latitude
                vehicle.current_longitude = agent_location.longitude
            db.commit()
    
    # Release vehicle when order is delivered
    if status_update.status == "delivered" and order.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == order.vehicle_id).first()
        if vehicle:
            vehicle.status = "available"
            db.commit()
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    
    if redis_available:
        message = json.dumps({
            "event": "order_status", 
            "order_id": order_id, 
            "new_status": status_update.status,
            "owner_id": order.owner_id,
            "assigned_agent_id": order.assigned_agent_id
        })
        await redis_pool.publish("ops_events", message)
    
    return order

@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    if not redis_available:
        await websocket.close(code=1003, reason="Redis not available")
        return
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
    
    # Update vehicle location if agent is assigned to a vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.assigned_agent_id == loc.agent_id).first()
    if vehicle:
        vehicle.current_latitude = loc.latitude
        vehicle.current_longitude = loc.longitude
    
    db.commit()
    db.refresh(driver_location)
    if redis_available:
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
    # Get latest location for each agent
    from sqlalchemy import func
    subquery = db.query(
        DriverLocation.agent_id,
        func.max(DriverLocation.timestamp).label('max_timestamp')
    ).group_by(DriverLocation.agent_id).subquery()
    
    latest_locations = db.query(DriverLocation).join(
        subquery,
        (DriverLocation.agent_id == subquery.c.agent_id) &
        (DriverLocation.timestamp == subquery.c.max_timestamp)
    ).all()
    
    return latest_locations

@app.get("/agents/")
def get_agents(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin","owner"]))):
    """Get agents - owners see agents assigned to their orders, admins see all agents"""
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "owner" and user_id:
        # Get unique agent IDs from owner's orders
        owner_orders = db.query(Order).filter(Order.owner_id == user_id).all()
        agent_ids = list(set([o.assigned_agent_id for o in owner_orders if o.assigned_agent_id]))
        
        if agent_ids:
            # Return agents assigned to owner's orders
            from sqlalchemy import and_
            return db.query(User).filter(and_(User.id.in_(agent_ids), User.role == "agent")).all()
        else:
            return []
    else:
        # Admin sees all agents
        return db.query(User).filter(User.role == "agent").all()

@app.get("/vehicles/")
def get_vehicles(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin", "agent", "owner"]))):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    # Owners can only see their own vehicles
    if user_role == "owner" and user_id:
        return db.query(Vehicle).filter(Vehicle.owner_id == user_id).all()
    # Admin and agent can see all vehicles
    return db.query(Vehicle).all()

@app.post("/vehicles/")
async def create_vehicle(vehicle_data: VehicleCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin", "agent", "owner"]))):
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    # Set owner_id if user is owner
    owner_id = user_id if user_role == "owner" else None
    # Owners register vehicles as pending, admins can set status directly
    approval_status = "pending" if user_role == "owner" else "approved"
    
    vehicle = Vehicle(
        license_plate=vehicle_data.license_plate,
        model=vehicle_data.model,
        vehicle_type=vehicle_data.vehicle_type,
        status=vehicle_data.status,
        approval_status=approval_status,
        owner_id=owner_id
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    
    # Broadcast vehicle registration event
    if redis_available:
        message = json.dumps({
            "event": "vehicle_registered",
            "vehicle_id": vehicle.id,
            "owner_id": owner_id,
            "approval_status": approval_status
        })
        await redis_pool.publish("ops_events", message)
    
    return vehicle

@app.patch("/vehicles/{vehicle_id}/approve")
async def approve_vehicle(
    vehicle_id: int,
    approval: VehicleApproval,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin", "owner"]))
):
    """Admin or owner approves or rejects a fleet vehicle (owners can only approve their own vehicles)"""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    # Owners can only approve their own vehicles
    if user_role == "owner":
        if vehicle.owner_id != user_id:
            raise HTTPException(status_code=403, detail="You can only approve vehicles you registered")
    
    vehicle.approval_status = approval.approval_status
    # If approved, set status to available if it was pending
    if approval.approval_status == "approved" and vehicle.status == "pending":
        vehicle.status = "available"
    
    db.commit()
    db.refresh(vehicle)
    
    # Broadcast vehicle approval event
    if redis_available:
        message = json.dumps({
            "event": "vehicle_approved",
            "vehicle_id": vehicle_id,
            "approval_status": approval.approval_status,
            "owner_id": vehicle.owner_id
        })
        await redis_pool.publish("ops_events", message)
    
    return vehicle

@app.patch("/vehicles/{vehicle_id}/assign-agent")
async def assign_agent_to_vehicle(
    vehicle_id: int,
    assignment: VehicleAgentAssignment,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin assigns an agent to a vehicle"""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.approval_status != "approved":
        raise HTTPException(status_code=400, detail="Vehicle must be approved before assigning an agent")
    
    # Verify agent exists and is actually an agent
    agent = db.query(User).filter(User.id == assignment.assigned_agent_id, User.role == "agent").first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    vehicle.assigned_agent_id = assignment.assigned_agent_id
    db.commit()
    db.refresh(vehicle)
    
    return vehicle

