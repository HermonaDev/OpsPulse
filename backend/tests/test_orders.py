import pytest
from httpx import AsyncClient
from backend.main import app

pytest_plugins = ("pytest_asyncio",)

@pytest.mark.asyncio
async def test_create_and_get_orders():
    async with AsyncClient(base_url="http://test") as ac:
        # Create an order
        order_data = {
            "customer_name": "John Doe",
            "delivery_address": "123 Main St",
            "assigned_agent_id": 1
        }
        response = await ac.post("http://localhost:8000/orders/", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "John Doe"

        # Fetch all orders
        response = await ac.get("http://localhost:8000/orders/")
        assert response.status_code == 200
        orders = response.json()
        assert any(order["customer_name"] == "John Doe" for order in orders)
