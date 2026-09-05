import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session_manager import session_manager


@pytest.mark.asyncio
async def test_ephemeral_multi_session_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Visitor A creates profile
        headers_a = {"x-session-id": "visitor_alice_123"}
        headers_b = {"x-session-id": "visitor_bob_456"}

        res_a = await client.patch(
            "/api/candidate",
            headers=headers_a,
            json={"full_name": "Alice Engineer", "target_salary": 150000}
        )
        assert res_a.status_code == 200
        assert res_a.json()["full_name"] == "Alice Engineer"

        # 2. Visitor B checks profile - should be completely blank and NOT Alice
        res_b = await client.get("/api/candidate", headers=headers_b)
        assert res_b.status_code == 200
        assert res_b.json()["full_name"] == ""
        assert res_b.json()["target_salary"] == 0

        # 3. Visitor A checks profile again - should still be Alice
        res_a_check = await client.get("/api/candidate", headers=headers_a)
        assert res_a_check.status_code == 200
        assert res_a_check.json()["full_name"] == "Alice Engineer"

        # 4. Visitor A resets session
        reset_res = await client.post("/api/session/reset", headers=headers_a)
        assert reset_res.status_code == 200
        assert reset_res.json()["status"] == "reset_successful"

        # 5. Visitor A checks profile after reset - should be wiped clean
        res_a_after = await client.get("/api/candidate", headers=headers_a)
        assert res_a_after.status_code == 200
        assert res_a_after.json()["full_name"] == ""
