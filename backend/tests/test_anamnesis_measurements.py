"""Iteration 2 — Anamnesis fields on /api/users + /api/measurements/:studentId (physical assessment)."""
import time

import pytest
import requests

from conftest import API

ANAMNESIS = {
    "goal": "hipertrofia",
    "healthConditions": "hipertensao controlada",
    "medications": "losartana",
    "injuries": "lesao no joelho direito",
    "experienceLevel": "intermediaria",
    "trainingFrequency": "3-4x",
    "anamnesisNotes": "Prefere treinar de manha",
}


# ---------- helpers ----------
def _uniq(prefix):
    return f"TEST_{prefix}_{int(time.time() * 1000)}"


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids


@pytest.fixture(scope="module", autouse=True)
def cleanup(created_ids, credentials):
    yield
    r = requests.post(f"{API}/auth/login", json={
        "email": credentials["admin"]["email"], "password": credentials["admin"]["password"]}, timeout=30)
    token = r.json()["token"]
    for uid in created_ids:
        requests.delete(f"{API}/users/{uid}", headers={"Authorization": f"Bearer {token}"}, timeout=30)


# ---------- Anamnesis via admin ----------
class TestAnamnesisAdmin:
    def test_create_student_with_anamnesis_persists(self, admin, created_ids):
        email = f"{_uniq('anam')}@test.com"
        payload = {"name": "TEST_Aluna Anamnese", "email": email, "password": "senha123",
                   "role": "aluno", "phone": "11999998888", **ANAMNESIS}
        r = admin.post(f"{API}/users", json=payload, timeout=30)
        assert r.status_code == 201, r.text
        body = r.json()
        created_ids.append(body["id"])
        assert "_id" not in body and "passwordHash" not in body
        for k, v in ANAMNESIS.items():
            assert body.get(k) == v, f"POST response missing/incorrect {k}: {body.get(k)}"

        # GET to verify persistence
        lst = admin.get(f"{API}/users?role=aluno", timeout=30).json()
        found = next((u for u in lst if u["id"] == body["id"]), None)
        assert found is not None
        for k, v in ANAMNESIS.items():
            assert found.get(k) == v, f"Persisted {k} mismatch: {found.get(k)}"

    def test_update_anamnesis_persists(self, admin, created_ids):
        email = f"{_uniq('anamupd')}@test.com"
        r = admin.post(f"{API}/users", json={"name": "TEST_Upd", "email": email,
                                             "password": "senha123", "role": "aluno"}, timeout=30)
        assert r.status_code == 201, r.text
        uid = r.json()["id"]
        created_ids.append(uid)

        upd = dict(ANAMNESIS)
        upd["goal"] = "emagrecimento"
        upd["experienceLevel"] = "avancada"
        pr = admin.put(f"{API}/users/{uid}", json=upd, timeout=30)
        assert pr.status_code == 200, pr.text
        for k, v in upd.items():
            assert pr.json().get(k) == v

        lst = admin.get(f"{API}/users?role=aluno", timeout=30).json()
        found = next(u for u in lst if u["id"] == uid)
        assert found["goal"] == "emagrecimento"
        assert found["experienceLevel"] == "avancada"
        assert found["injuries"] == ANAMNESIS["injuries"]


# ---------- Anamnesis via personal (auto link) ----------
class TestAnamnesisPersonal:
    def test_personal_creates_student_with_anamnesis(self, personal, created_ids):
        email = f"{_uniq('panam')}@test.com"
        r = personal.post(f"{API}/users", json={"name": "TEST_Aluna Personal", "email": email,
                                                "password": "senha123", **ANAMNESIS}, timeout=30)
        assert r.status_code == 201, r.text
        body = r.json()
        created_ids.append(body["id"])
        assert body["role"] == "aluno"
        assert str(body["personalId"]) == str(personal.user["id"])
        for k, v in ANAMNESIS.items():
            assert body.get(k) == v

        mine = personal.get(f"{API}/users", timeout=30).json()
        found = next(u for u in mine if u["id"] == body["id"])
        assert found["healthConditions"] == ANAMNESIS["healthConditions"]


# ---------- Measurements ----------
@pytest.fixture(scope="module")
def personal_student(personal, created_ids):
    email = f"{_uniq('meas')}@test.com"
    r = personal.post(f"{API}/users", json={"name": "TEST_Aluna Medidas", "email": email,
                                            "password": "senha123", "goal": "definicao"}, timeout=30)
    assert r.status_code == 201, r.text
    created_ids.append(r.json()["id"])
    return {"id": r.json()["id"], "email": email, "password": "senha123"}


class TestMeasurements:
    def test_personal_post_and_get_measurements(self, personal, personal_student):
        sid = personal_student["id"]
        before = personal.get(f"{API}/measurements/{sid}", timeout=30)
        assert before.status_code == 200, before.text
        assert before.json() == []

        r1 = personal.post(f"{API}/measurements/{sid}",
                           json={"weight": 62.5, "waist": 70, "date": "2026-01-10"}, timeout=30)
        assert r1.status_code == 201, r1.text
        m1 = r1.json()
        assert m1["weight"] == 62.5 and m1["waist"] == 70
        assert "_id" not in m1 and m1["studentId"] == sid

        r2 = personal.post(f"{API}/measurements/{sid}",
                           json={"weight": 61.0, "waist": 68.5, "date": "2026-02-10"}, timeout=30)
        assert r2.status_code == 201, r2.text

        lst = personal.get(f"{API}/measurements/{sid}", timeout=30).json()
        assert len(lst) == 2
        assert [m["date"] for m in lst] == ["2026-01-10", "2026-02-10"], "should be sorted asc by date"

    def test_admin_can_access_measurements(self, admin, personal_student):
        r = admin.get(f"{API}/measurements/{personal_student['id']}", timeout=30)
        assert r.status_code == 200, r.text
        assert len(r.json()) >= 2

    def test_default_date_applied(self, admin, personal_student):
        r = admin.post(f"{API}/measurements/{personal_student['id']}", json={"weight": 60.0}, timeout=30)
        assert r.status_code == 201, r.text
        assert r.json()["date"], "date should default to today"

    def test_student_sees_measurements_in_evolucao(self, personal_student):
        s = requests.Session()
        login = s.post(f"{API}/auth/login", json={"email": personal_student["email"],
                                                  "password": personal_student["password"]}, timeout=30)
        assert login.status_code == 200, login.text
        s.headers.update({"Authorization": f"Bearer {login.json()['token']}"})
        r = s.get(f"{API}/student/measurements", timeout=30)
        assert r.status_code == 200, r.text
        assert len(r.json()) >= 3
        assert any(m["weight"] == 62.5 for m in r.json())

    def test_other_personal_cannot_access(self, admin, personal_student, created_ids):
        email = f"{_uniq('p2')}@test.com"
        cr = admin.post(f"{API}/users", json={"name": "TEST_Personal2", "email": email,
                                              "password": "senha123", "role": "personal"}, timeout=30)
        assert cr.status_code == 201, cr.text
        created_ids.append(cr.json()["id"])
        s = requests.Session()
        login = s.post(f"{API}/auth/login", json={"email": email, "password": "senha123"}, timeout=30)
        assert login.status_code == 200
        s.headers.update({"Authorization": f"Bearer {login.json()['token']}"})
        assert s.get(f"{API}/measurements/{personal_student['id']}", timeout=30).status_code == 403
        assert s.post(f"{API}/measurements/{personal_student['id']}",
                      json={"weight": 99}, timeout=30).status_code == 403

    def test_aluno_forbidden(self, aluno, personal_student):
        assert aluno.get(f"{API}/measurements/{personal_student['id']}", timeout=30).status_code == 403
        assert aluno.post(f"{API}/measurements/{personal_student['id']}",
                          json={"weight": 50}, timeout=30).status_code == 403

    def test_requires_auth(self, anon, personal_student):
        assert anon.get(f"{API}/measurements/{personal_student['id']}", timeout=30).status_code == 401

    def test_unknown_student_404(self, admin):
        assert admin.get(f"{API}/measurements/6a8f9e3e553236ba2dc01799", timeout=30).status_code == 404
        assert admin.post(f"{API}/measurements/6a8f9e3e553236ba2dc01799",
                          json={"weight": 60}, timeout=30).status_code == 404

    def test_invalid_student_id_not_500(self, admin):
        r = admin.get(f"{API}/measurements/not-an-objectid", timeout=30)
        assert r.status_code in (400, 404), f"expected 400/404, got {r.status_code}: {r.text[:200]}"

    def test_empty_payload_validation(self, admin, personal_student):
        r = admin.post(f"{API}/measurements/{personal_student['id']}", json={}, timeout=30)
        assert r.status_code == 400, (
            f"POST with no measures should be rejected, got {r.status_code}: {r.text[:200]}")
