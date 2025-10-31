from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # "admin", "agent", "owner"
    phone = Column(String)  # phone number for agents

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True)
    delivery_address = Column(String)
    status = Column(String, default="pending")# "pending", "approved", "picked_up", "in_transit", "delivered"
    assigned_agent_id = Column(Integer, ForeignKey('users.id'))
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Owner who created/manages this order
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=True)  # Vehicle assigned to order
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
    owner = relationship("User", foreign_keys=[owner_id])
    vehicle = relationship("Vehicle")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    model = Column(String)
    status = Column(String, default="available")  # "available", "in_use", "maintenance"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DriverLocation(Base):
    __tablename__ = "driver_locations"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey('users.id'))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("User")