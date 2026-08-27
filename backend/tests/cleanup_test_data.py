"""Utility: delete every TEST_* user created during QA runs."""
import requests
from dotenv import dotenv_values

BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"

tok = requests.post(f"{API}/auth/login", json={"email": "admin@academia.com", "password": "admin123"}, timeout=30).json()["token"]
h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
users = requests.get(f"{API}/users", headers=h, timeout=30).json()
removed = 0
for u in users:
    if u["name"].startswith("TEST_") or u["email"].startswith("test_"):
        r = requests.delete(f"{API}/users/{u['id']}", headers=h, timeout=30)
        print("delete", u["email"], r.status_code)
        removed += 1
print("removed:", removed)
print("remaining:", len(requests.get(f"{API}/users", headers=h, timeout=30).json()))
