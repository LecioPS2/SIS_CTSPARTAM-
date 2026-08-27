"""Cross-tenant (IDOR) checks: can personal B mutate personal A's workouts/sessions?"""
import requests
import pytest

from conftest import API


@pytest.fixture(scope="module")
def second_personal(admin):
    email = "test_personal_b@example.com"
    for u in admin.get(f"{API}/users", params={"role": "personal"}).json():
        if u["email"] == email:
            admin.delete(f"{API}/users/{u['id']}")
    r = admin.post(f"{API}/users", json={"name": "TEST_Personal B", "email": email, "password": "senha123", "role": "personal"})
    assert r.status_code == 201, r.text[:300]
    uid = r.json()["id"]
    tok = requests.post(f"{API}/auth/login", json={"email": email, "password": "senha123"}).json()["token"]
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
    yield s
    admin.delete(f"{API}/users/{uid}")


def test_personal_b_cannot_modify_personal_a_workout(personal, second_personal):
    alunos = personal.get(f"{API}/users").json()
    assert alunos
    r = personal.post(f"{API}/workouts", json={"name": "TEST_Treino Owner A", "studentId": alunos[0]["id"], "days": [1], "exercises": []})
    assert r.status_code == 201
    wid = r.json()["id"]
    try:
        upd = second_personal.put(f"{API}/workouts/{wid}", json={"name": "TEST_HACKED"})
        assert upd.status_code in (403, 404), f"IDOR: personal B updated another personal's workout ({upd.status_code})"
        dele = second_personal.delete(f"{API}/workouts/{wid}")
        assert dele.status_code in (403, 404), f"IDOR: personal B deleted another personal's workout ({dele.status_code})"
    finally:
        personal.delete(f"{API}/workouts/{wid}")


def test_personal_b_cannot_modify_personal_a_session(personal, second_personal):
    alunos = personal.get(f"{API}/users").json()
    r = personal.post(f"{API}/sessions", json={"studentId": alunos[0]["id"], "date": "2026-10-01", "time": "08:00"})
    assert r.status_code == 201
    sid = r.json()["id"]
    try:
        upd = second_personal.put(f"{API}/sessions/{sid}", json={"status": "cancelada"})
        assert upd.status_code in (403, 404), f"IDOR: personal B cancelled another personal's session ({upd.status_code})"
    finally:
        personal.delete(f"{API}/sessions/{sid}")


def test_workout_personalid_cannot_be_overwritten(personal):
    """PUT spreads req.body directly into findByIdAndUpdate -> mass assignment."""
    alunos = personal.get(f"{API}/users").json()
    r = personal.post(f"{API}/workouts", json={"name": "TEST_Mass Assign", "studentId": alunos[0]["id"], "days": [1], "exercises": []})
    wid = r.json()["id"]
    try:
        fake = "6a8f9e4bdc34a33668028239"
        upd = personal.put(f"{API}/workouts/{wid}", json={"personalId": fake})
        assert upd.json().get("personalId") != fake, "mass assignment: personalId overwritten via PUT body"
    finally:
        personal.delete(f"{API}/workouts/{wid}")
