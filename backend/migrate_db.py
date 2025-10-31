import sqlite3
import os

# Connect to your database
db_path = os.getenv("DATABASE_URL", "sqlite:///backend/test.db").replace("sqlite:///", "")
if not os.path.exists(db_path):
    # Try alternative path
    db_path = "backend/test.db"

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
                status VARCHAR DEFAULT 'available',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Created vehicles table!")
        
        # Add some sample vehicles
        sample_vehicles = [
            ("ET-12345", "Hino Ranger FL8J", "available"),
            ("ET-67890", "Isuzu NPR", "available"),
            ("ET-11111", "Mercedes Actros", "available"),
        ]
        cursor.executemany("""
            INSERT INTO vehicles (license_plate, model, status) 
            VALUES (?, ?, ?)
        """, sample_vehicles)
        print(f"✅ Added {len(sample_vehicles)} sample vehicles to fleet!")
    else:
        print("ℹ️  vehicles table already exists")
        # Check if we need to add sample vehicles
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        count = cursor.fetchone()[0]
        if count == 0:
            sample_vehicles = [
                ("ET-12345", "Hino Ranger FL8J", "available"),
                ("ET-67890", "Isuzu NPR", "available"),
                ("ET-11111", "Mercedes Actros", "available"),
            ]
            cursor.executemany("""
                INSERT INTO vehicles (license_plate, model, status) 
                VALUES (?, ?, ?)
            """, sample_vehicles)
            print(f"✅ Added {len(sample_vehicles)} sample vehicles to fleet!")
    
    # Add owner_id if it doesn't exist (for backward compatibility)
    cursor.execute("PRAGMA table_info(orders)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'owner_id' not in columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN owner_id INTEGER;")
        print("✅ Added owner_id column to orders table!")
    
    conn.commit()
    print("✅ Database migration completed successfully!")
    
except sqlite3.OperationalError as e:
    print(f"⚠️  Migration error: {e}")
    conn.rollback()

conn.close()
