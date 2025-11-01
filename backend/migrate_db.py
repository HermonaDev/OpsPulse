import sqlite3
import os

# Connect to your database
db_path = os.getenv("DATABASE_URL", "sqlite:///backend/test.db").replace("sqlite:///", "")
# Handle different path formats
if "://" in db_path:
    db_path = db_path.split("://")[-1]
if not os.path.exists(db_path):
    # Try alternative paths
    if os.path.exists("test.db"):
        db_path = "test.db"
    elif os.path.exists("backend/test.db"):
        db_path = "backend/test.db"
    else:
        # Create it if it doesn't exist
        db_path = "test.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add the missing columns and tables
try:
    # Add vehicle_id to orders table if it doesn't exist
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='orders'
    """)
    if cursor.fetchone():
        # Check if column exists
        cursor.execute("PRAGMA table_info(orders)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'vehicle_id' not in columns:
            cursor.execute("ALTER TABLE orders ADD COLUMN vehicle_id INTEGER;")
            print("✅ Added vehicle_id column to orders table!")
        else:
            print("ℹ️  vehicle_id column already exists in orders table")
    
    # Create vehicles table if it doesn't exist
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='vehicles'
    """)
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE vehicles (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                license_plate VARCHAR NOT NULL UNIQUE,
                model VARCHAR,
                vehicle_type VARCHAR,
                status VARCHAR DEFAULT 'available',
                approval_status VARCHAR DEFAULT 'pending',
                owner_id INTEGER,
                assigned_agent_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Created vehicles table!")
    else:
        print("ℹ️  vehicles table already exists")
        # Add new columns if they don't exist
        cursor.execute("PRAGMA table_info(vehicles)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'vehicle_type' not in columns:
            cursor.execute("ALTER TABLE vehicles ADD COLUMN vehicle_type VARCHAR;")
            print("✅ Added vehicle_type column to vehicles table!")
        if 'approval_status' not in columns:
            cursor.execute("ALTER TABLE vehicles ADD COLUMN approval_status VARCHAR DEFAULT 'pending';")
            print("✅ Added approval_status column to vehicles table!")
        if 'owner_id' not in columns:
            cursor.execute("ALTER TABLE vehicles ADD COLUMN owner_id INTEGER;")
            print("✅ Added owner_id column to vehicles table!")
        if 'assigned_agent_id' not in columns:
            cursor.execute("ALTER TABLE vehicles ADD COLUMN assigned_agent_id INTEGER;")
            print("✅ Added assigned_agent_id column to vehicles table!")
        if 'updated_at' not in columns:
            cursor.execute("ALTER TABLE vehicles ADD COLUMN updated_at DATETIME;")
            print("✅ Added updated_at column to vehicles table!")
    
    # Add owner_id if it doesn't exist (for backward compatibility)
    cursor.execute("PRAGMA table_info(orders)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'owner_id' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN owner_id INTEGER;")
        print("✅ Added owner_id column to orders table!")
    if 'delivery_latitude' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_latitude REAL;")
        print("✅ Added delivery_latitude column to orders table!")
    if 'delivery_longitude' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_longitude REAL;")
        print("✅ Added delivery_longitude column to orders table!")
    if 'pickup_address' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN pickup_address VARCHAR;")
        print("✅ Added pickup_address column to orders table!")
    if 'pickup_latitude' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN pickup_latitude REAL;")
        print("✅ Added pickup_latitude column to orders table!")
    if 'pickup_longitude' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN pickup_longitude REAL;")
        print("✅ Added pickup_longitude column to orders table!")
    
    # Add vehicle location columns
    cursor.execute("PRAGMA table_info(vehicles)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'current_latitude' not in columns:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN current_latitude REAL;")
        print("✅ Added current_latitude column to vehicles table!")
    if 'current_longitude' not in columns:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN current_longitude REAL;")
        print("✅ Added current_longitude column to vehicles table!")
    
    conn.commit()
    print("✅ Database migration completed successfully!")
    
except sqlite3.OperationalError as e:
    print(f"⚠️  Migration error: {e}")
    conn.rollback()

conn.close()
