import pytest
import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL)

def test_signup_and_login(client):
    email = f"testuser{uuid.uuid4().hex[:8]}@example.com"
    password = "testpass"
    signup_payload = {
        "email": email,
        "password": password,
        "role": "admin",
        "name": "Test Admin"
    }
    r = client.post("/signup/", json=signup_payload)
    assert r.status_code == 200

    login_payload = {"email": email, "password": password}
    r = client.post("/login/", json=login_payload)
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert token

def test_protected_orders_requires_jwt(client):
    r = client.get("/orders/")
    assert r.status_code == 401

def test_create_order_with_token(client):
    email = f"orderuser{uuid.uuid4().hex[:8]}@example.com"
    password = "orderpass456"
    signup_payload = {
        "email": email,
        "password": password,
        "role": "agent",
        "name": "Order Test User"
    }
    r_signup = client.post("/signup/", json=signup_payload)
    assert r_signup.status_code == 200, f"Signup failed: {r_signup.json()}"
    
    r = client.post("/login/", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.json()}"
    token = r.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    order_payload = {
        "customer_name": "John Doe",
        "delivery_address": "Test Street",
        "assigned_agent_id": 1
    }
    r = client.post("/orders/", json=order_payload, headers=headers)
    assert r.status_code in (200, 201)

def test_role_based_access_denied(client):
    email = f"owner{uuid.uuid4().hex[:8]}@example.com"
    password = "ownerpass789"
    signup_payload = {
        "email": email,
        "password": password,
        "role": "owner",
        "name": "Test Owner"
    }
    r_signup = client.post("/signup/", json=signup_payload)
    assert r_signup.status_code == 200, f"Signup failed: {r_signup.json()}"
    
    r = client.post("/login/", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.json()}"
    token = r.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    order_payload = {
        "customer_name": "Test Deny",
        "delivery_address": "No Access",
        "assigned_agent_id": 2
    }
    r = client.post("/orders/", json=order_payload, headers=headers)
    assert r.status_code == 403
