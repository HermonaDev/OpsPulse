from backend.db import Base, engine
from backend import models

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")
print("You can now create users via the API signup endpoint.")
