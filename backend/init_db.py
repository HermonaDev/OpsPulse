from backend.db import Base, engine
from backend.models import User, Agent, Owner, Order, Vehicle

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")
