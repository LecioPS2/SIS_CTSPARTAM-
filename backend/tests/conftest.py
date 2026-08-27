import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
_base = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not _base:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = _base.rstrip("/")
API = f"{BASE_URL}/api"


def _creds():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("missing test_credentials.md")
    content = path.read_text(encoding="utf-8")
    rows = re.findall(r"\|\s*(Admin|Personal|Aluno)\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|", content)
    return {r[0].lower(): {"email": r[1], "password": r[2]} for r in rows}


@pytest.fixture(scope="session")
def credentials():
    c = _creds()
    if not c:
        pytest.skip("no credentials parsed")
    return c


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Login failed for {email}: {r.status_code} {r.text[:300]}")
    return r.json()


def _client(email, password):
    data = _login(email, password)
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {data['token']}"})
    s.user = data["user"]
    return s


@pytest.fixture(scope="session")
def admin(credentials):
    return _client(credentials["admin"]["email"], credentials["admin"]["password"])


@pytest.fixture(scope="session")
def personal(credentials):
    return _client(credentials["personal"]["email"], credentials["personal"]["password"])


@pytest.fixture(scope="session")
def aluno(credentials):
    return _client(credentials["aluno"]["email"], credentials["aluno"]["password"])


@pytest.fixture(scope="session")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
