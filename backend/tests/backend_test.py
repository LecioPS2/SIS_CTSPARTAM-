"""IRON HUB backend API regression suite (Node/Express behind ASGI shim)."""
import requests

from conftest import API, BASE_URL  # noqa: F401


# ---------- health ----------
class TestHealth:
    def test_health(self, anon):
        r = anon.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ---------- auth ----------
class TestAuth:
    def test_login_admin(self, credentials):
        c = credentials["admin"]
        r = requests.post(f"{API}/auth/login", json=c if False else {"email": c["email"], "password": c["password"]})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert isinstance(d["token"], str) and len(d["token"]) > 20
        assert "passwordHash" not in d["user"]
        assert "_id" not in d["user"] and "id" in d["user"]

    def test_login_sets_httponly_cookie(self, credentials):
        c = credentials["admin"]
        r = requests.post(f"{API}/auth/login", json={"email": c["email"], "password": c["password"]})
        raw = r.headers.get("set-cookie", "")
        assert "access_token" in raw, f"no access_token cookie: {raw}"
        assert "HttpOnly" in raw, f"cookie not HttpOnly: {raw}"

    def test_login_roles(self, credentials):
        for role in ("personal", "aluno"):
            c = credentials[role]
            r = requests.post(f"{API}/auth/login", json={"email": c["email"], "password": c["password"]})
            assert r.status_code == 200, r.text[:200]
            assert r.json()["user"]["role"] == role

    def test_login_wrong_password(self, credentials):
        c = credentials["admin"]
        r = requests.post(f"{API}/auth/login", json={"email": c["email"], "password": "errado123"})
        assert r.status_code == 401
        assert "error" in r.json()

    def test_me_requires_token(self, anon):
        r = anon.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_admin(self, admin, credentials):
        r = admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == credentials["admin"]["email"]

    def test_invalid_token(self, anon):
        r = anon.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        assert r.status_code == 401

    def test_bruteforce_lockout(self):
        import uuid
        # unique email per run: lockout key is ip:email and persists 15 min
        email = f"test_bf_{uuid.uuid4().hex[:10]}@example.com"
        codes = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "nope"})
            codes.append(r.status_code)
        assert codes[:5] == [401] * 5, codes
        assert codes[5] == 429, f"expected lockout 429 after 5 fails, got {codes}"


# ---------- bcrypt hash format (direct DB check) ----------
class TestPasswordHash:
    def test_bcrypt_format(self):
        import os
        from pymongo import MongoClient
        from dotenv import dotenv_values
        env = dotenv_values("/app/backend/.env")
        url = os.environ.get("MONGO_URL") or env.get("MONGO_URL")
        db = os.environ.get("DB_NAME") or env.get("DB_NAME")
        client = MongoClient(url)
        u = client[db]["users"].find_one({"email": "admin@academia.com"})
        assert u is not None
        # bcryptjs (Node) emits $2a$ by default; $2a$/$2b$ are both valid bcrypt formats
        assert u["passwordHash"].startswith(("$2a$", "$2b$", "$2y$")), u["passwordHash"][:10]
        assert len(u["passwordHash"]) == 60


# ---------- plans CRUD ----------
class TestPlans:
    created = []

    def test_list_plans(self, admin):
        r = admin.get(f"{API}/plans")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_plan_crud(self, admin):
        r = admin.post(f"{API}/plans", json={"name": "TEST_Plano QA", "price": 149.9, "durationDays": 30, "description": "qa"})
        assert r.status_code == 201, r.text[:300]
        p = r.json()
        assert p["name"] == "TEST_Plano QA" and p["price"] == 149.9
        pid = p["id"]
        TestPlans.created.append(pid)

        lst = admin.get(f"{API}/plans").json()
        assert any(x["id"] == pid for x in lst)

        r = admin.put(f"{API}/plans/{pid}", json={"price": 199.0})
        assert r.status_code == 200 and r.json()["price"] == 199.0
        lst = admin.get(f"{API}/plans").json()
        assert next(x for x in lst if x["id"] == pid)["price"] == 199.0

        assert admin.delete(f"{API}/plans/{pid}").status_code == 200
        lst = admin.get(f"{API}/plans").json()
        assert not any(x["id"] == pid for x in lst)
        TestPlans.created.remove(pid)

    def test_plan_validation(self, admin):
        r = admin.post(f"{API}/plans", json={"name": "TEST_no_price"})
        assert r.status_code == 400

    def test_plan_create_forbidden_for_personal(self, personal):
        r = personal.post(f"{API}/plans", json={"name": "TEST_x", "price": 1})
        assert r.status_code == 403


# ---------- exercises CRUD ----------
class TestExercises:
    def test_exercise_crud_admin(self, admin):
        payload = {"name": "TEST_Supino QA", "muscleGroup": "Peito", "sets": 4, "reps": 10, "load": 60, "timeSeconds": 45}
        r = admin.post(f"{API}/exercises", json=payload)
        assert r.status_code == 201, r.text[:300]
        e = r.json()
        for k, v in payload.items():
            assert e[k] == v, f"{k}: {e[k]} != {v}"
        eid = e["id"]
        lst = admin.get(f"{API}/exercises").json()
        got = next(x for x in lst if x["id"] == eid)
        assert got["load"] == 60 and got["timeSeconds"] == 45

        r = admin.put(f"{API}/exercises/{eid}", json={"load": 80})
        assert r.status_code == 200 and r.json()["load"] == 80
        assert admin.delete(f"{API}/exercises/{eid}").status_code == 200
        assert not any(x["id"] == eid for x in admin.get(f"{API}/exercises").json())

    def test_exercise_validation(self, personal):
        r = personal.post(f"{API}/exercises", json={"name": "TEST_nogroup"})
        assert r.status_code == 400

    def test_exercise_read_by_aluno(self, aluno):
        r = aluno.get(f"{API}/exercises")
        assert r.status_code == 200

    def test_exercise_create_forbidden_for_aluno(self, aluno):
        r = aluno.post(f"{API}/exercises", json={"name": "TEST_a", "muscleGroup": "Peito"})
        assert r.status_code == 403


# ---------- users CRUD ----------
class TestUsers:
    def test_list_users_admin(self, admin):
        r = admin.get(f"{API}/users")
        assert r.status_code == 200
        users = r.json()
        assert len(users) >= 3
        assert all("passwordHash" not in u and "_id" not in u for u in users)

    def test_list_users_filter_role(self, admin):
        r = admin.get(f"{API}/users", params={"role": "personal"})
        assert r.status_code == 200
        assert all(u["role"] == "personal" for u in r.json())

    def test_personal_sees_only_own_students(self, personal):
        r = personal.get(f"{API}/users")
        assert r.status_code == 200
        for u in r.json():
            assert u["role"] == "aluno"

    def test_admin_full_student_lifecycle(self, admin):
        plans = admin.get(f"{API}/plans").json()
        personais = admin.get(f"{API}/users", params={"role": "personal"}).json()
        payload = {
            "name": "TEST_Aluno QA",
            "email": "test_aluno_qa@example.com",
            "password": "senha123",
            "role": "aluno",
            "phone": "11999998888",
            "goal": "Hipertrofia",
        }
        if plans:
            payload["planId"] = plans[0]["id"]
        if personais:
            payload["personalId"] = personais[0]["id"]
        # pre-clean leftovers from previous runs
        for existing in admin.get(f"{API}/users", params={"role": "aluno"}).json():
            if existing["email"] == payload["email"].lower():
                admin.delete(f"{API}/users/{existing['id']}")
        r = admin.post(f"{API}/users", json=payload)
        assert r.status_code == 201, r.text[:300]
        u = r.json()
        uid = u["id"]
        assert u["role"] == "aluno" and u["email"] == payload["email"].lower()

        # duplicate email
        assert admin.post(f"{API}/users", json=payload).status_code == 400

        # persisted with relations
        lst = admin.get(f"{API}/users", params={"role": "aluno"}).json()
        got = next(x for x in lst if x["id"] == uid)
        assert got["name"] == "TEST_Aluno QA"
        if personais:
            assert got.get("personalId") is not None

        # new student can login
        lr = requests.post(f"{API}/auth/login", json={"email": payload["email"], "password": "senha123"})
        assert lr.status_code == 200, lr.text[:200]

        # update
        r = admin.put(f"{API}/users/{uid}", json={"name": "TEST_Aluno QA Editado", "goal": "Emagrecer"})
        assert r.status_code == 200 and r.json()["name"] == "TEST_Aluno QA Editado"
        lst = admin.get(f"{API}/users", params={"role": "aluno"}).json()
        got = next(x for x in lst if x["id"] == uid)
        assert got["name"] == "TEST_Aluno QA Editado" and got["goal"] == "Emagrecer"

        # deactivate blocks login
        assert admin.put(f"{API}/users/{uid}", json={"active": False}).status_code == 200
        lr = requests.post(f"{API}/auth/login", json={"email": payload["email"], "password": "senha123"})
        assert lr.status_code == 403, f"inactive user login should be 403, got {lr.status_code}"

        # delete
        assert admin.delete(f"{API}/users/{uid}").status_code == 200
        lst = admin.get(f"{API}/users", params={"role": "aluno"}).json()
        assert not any(x["id"] == uid for x in lst)

    def test_user_validation(self, admin):
        r = admin.post(f"{API}/users", json={"name": "TEST_x"})
        assert r.status_code == 400

    def test_personal_creates_student_auto_linked(self, personal, admin):
        r = personal.post(f"{API}/users", json={"name": "TEST_Aluno do Personal", "email": "test_aluno_p@example.com", "password": "senha123", "role": "admin"})
        assert r.status_code == 201, r.text[:300]
        u = r.json()
        assert u["role"] == "aluno", "personal must not be able to escalate role"
        assert str(u["personalId"]) == str(personal.user["id"])
        mine = personal.get(f"{API}/users").json()
        assert any(x["id"] == u["id"] for x in mine)
        # personal cannot delete
        assert personal.delete(f"{API}/users/{u['id']}").status_code == 403
        admin.delete(f"{API}/users/{u['id']}")

    def test_aluno_cannot_list_users(self, aluno):
        assert aluno.get(f"{API}/users").status_code == 403


# ---------- payments ----------
class TestPayments:
    def test_list_payments_admin(self, admin):
        r = admin.get(f"{API}/payments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_payments_forbidden_personal_and_aluno(self, personal, aluno):
        assert personal.get(f"{API}/payments").status_code == 403
        assert aluno.get(f"{API}/payments").status_code == 403

    def test_payment_crud_and_mark_paid(self, admin):
        alunos = admin.get(f"{API}/users", params={"role": "aluno"}).json()
        assert alunos, "no students seeded"
        sid = alunos[0]["id"]
        r = admin.post(f"{API}/payments", json={"studentId": sid, "amount": 120.5, "dueDate": "2026-07-10", "status": "pendente", "method": "pix", "reference": "TEST_ref"})
        assert r.status_code == 201, r.text[:300]
        p = r.json()
        pid = p["id"]
        assert p["status"] == "pendente" and p["paidAt"] is None and p["amount"] == 120.5

        r = admin.put(f"{API}/payments/{pid}", json={"status": "pago"})
        assert r.status_code == 200
        assert r.json()["status"] == "pago" and r.json()["paidAt"]

        lst = admin.get(f"{API}/payments").json()
        got = next(x for x in lst if x["id"] == pid)
        assert got["status"] == "pago" and got["paidAt"]

        assert admin.delete(f"{API}/payments/{pid}").status_code == 200
        assert not any(x["id"] == pid for x in admin.get(f"{API}/payments").json())

    def test_payment_validation(self, admin):
        r = admin.post(f"{API}/payments", json={"amount": 10})
        assert r.status_code == 400

    def test_payment_update_404(self, admin):
        r = admin.put(f"{API}/payments/64b7f9a2c1d4e5f6a7b8c9d0", json={"status": "pago"})
        assert r.status_code == 404


# ---------- workouts ----------
class TestWorkouts:
    def test_list_workouts_personal(self, personal):
        r = personal.get(f"{API}/workouts")
        assert r.status_code == 200

    def test_workout_crud(self, personal):
        alunos = personal.get(f"{API}/users").json()
        assert alunos, "personal has no students"
        exercises = personal.get(f"{API}/exercises").json()
        assert exercises, "no exercises seeded"
        ex = exercises[0]
        payload = {
            "name": "TEST_Treino QA",
            "studentId": alunos[0]["id"],
            "days": [1, 3, 5],
            "exercises": [{"exerciseId": ex["id"], "name": ex["name"], "muscleGroup": ex["muscleGroup"], "sets": 5, "reps": 8, "load": 70, "timeSeconds": 30}],
        }
        r = personal.post(f"{API}/workouts", json=payload)
        assert r.status_code == 201, r.text[:300]
        w = r.json()
        wid = w["id"]
        assert w["days"] == [1, 3, 5]
        assert w["exercises"][0]["sets"] == 5 and w["exercises"][0]["load"] == 70
        assert str(w["personalId"]) == str(personal.user["id"])

        lst = personal.get(f"{API}/workouts").json()
        got = next(x for x in lst if x["id"] == wid)
        assert got["exercises"][0]["reps"] == 8

        r = personal.put(f"{API}/workouts/{wid}", json={"name": "TEST_Treino QA v2", "days": [2]})
        assert r.status_code == 200 and r.json()["name"] == "TEST_Treino QA v2"
        lst = personal.get(f"{API}/workouts").json()
        assert next(x for x in lst if x["id"] == wid)["days"] == [2]

        assert personal.delete(f"{API}/workouts/{wid}").status_code == 200
        assert not any(x["id"] == wid for x in personal.get(f"{API}/workouts").json())

    def test_workout_validation(self, personal):
        assert personal.post(f"{API}/workouts", json={"name": "TEST_x"}).status_code == 400

    def test_workout_forbidden_for_aluno(self, aluno):
        assert aluno.get(f"{API}/workouts").status_code == 403


# ---------- sessions ----------
class TestSessions:
    def test_session_crud(self, personal):
        alunos = personal.get(f"{API}/users").json()
        assert alunos
        r = personal.post(f"{API}/sessions", json={"studentId": alunos[0]["id"], "date": "2026-07-20", "time": "09:00", "durationMin": 45, "notes": "TEST_sessao"})
        assert r.status_code == 201, r.text[:300]
        s = r.json()
        sid = s["id"]
        assert s["status"] == "agendada" and s["durationMin"] == 45

        r = personal.put(f"{API}/sessions/{sid}", json={"status": "concluida"})
        assert r.status_code == 200 and r.json()["status"] == "concluida"
        lst = personal.get(f"{API}/sessions").json()
        assert next(x for x in lst if x["id"] == sid)["status"] == "concluida"

        r = personal.put(f"{API}/sessions/{sid}", json={"status": "cancelada"})
        assert r.status_code == 200 and r.json()["status"] == "cancelada"

        assert personal.delete(f"{API}/sessions/{sid}").status_code == 200
        assert not any(x["id"] == sid for x in personal.get(f"{API}/sessions").json())

    def test_session_validation(self, personal):
        assert personal.post(f"{API}/sessions", json={"date": "2026-07-20"}).status_code == 400

    def test_session_forbidden_for_aluno(self, aluno):
        assert aluno.get(f"{API}/sessions").status_code == 403


# ---------- stats ----------
class TestStats:
    def test_admin_stats(self, admin):
        r = admin.get(f"{API}/stats/admin")
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("totalAlunos", "totalPersonais", "monthRevenue", "pendingCount", "pendingAmount", "revenueChart", "recentPayments"):
            assert k in d, f"missing {k}"
        assert len(d["revenueChart"]) == 6
        assert isinstance(d["totalAlunos"], int) and d["totalAlunos"] >= 1
        assert isinstance(d["totalPersonais"], int) and d["totalPersonais"] >= 1

    def test_admin_stats_forbidden(self, personal, aluno):
        assert personal.get(f"{API}/stats/admin").status_code == 403
        assert aluno.get(f"{API}/stats/admin").status_code == 403

    def test_personal_stats(self, personal):
        r = personal.get(f"{API}/stats/personal")
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("totalAlunos", "totalTreinos", "sessionsToday", "completedToday"):
            assert k in d
        assert isinstance(d["sessionsToday"], list)

    def test_personal_stats_forbidden_admin(self, admin):
        assert admin.get(f"{API}/stats/personal").status_code == 403


# ---------- student area ----------
class TestStudent:
    def test_today(self, aluno):
        r = aluno.get(f"{API}/student/today")
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "todayWorkouts" in d and "allWorkouts" in d
        assert isinstance(d["todayWorkouts"], list)
        if d["todayWorkouts"]:
            w = d["todayWorkouts"][0]
            assert "completedToday" in w and "exercises" in w

    def test_complete_workout_idempotency(self, aluno):
        d = aluno.get(f"{API}/student/today").json()
        if not d["todayWorkouts"]:
            import pytest
            pytest.skip("no workout for today")
        wid = d["todayWorkouts"][0]["id"]
        r1 = aluno.post(f"{API}/student/complete/{wid}")
        assert r1.status_code in (201, 400), r1.text[:300]
        r2 = aluno.post(f"{API}/student/complete/{wid}")
        assert r2.status_code == 400
        assert "conclu" in r2.json()["error"].lower()
        after = aluno.get(f"{API}/student/today").json()
        assert next(w for w in after["todayWorkouts"] if w["id"] == wid)["completedToday"] is True

    def test_history(self, aluno):
        r = aluno.get(f"{API}/student/history")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_measurements(self, aluno):
        r = aluno.post(f"{API}/student/measurements", json={"weight": 81.5, "height": 178, "chest": 100, "waist": 82, "hip": 95, "arm": 36, "thigh": 58})
        assert r.status_code == 201, r.text[:300]
        m = r.json()
        assert m["weight"] == 81.5 and m["arm"] == 36
        lst = aluno.get(f"{API}/student/measurements").json()
        assert any(x["id"] == m["id"] and x["weight"] == 81.5 for x in lst)

    def test_membership(self, aluno):
        r = aluno.get(f"{API}/student/membership")
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "plan" in d and "payments" in d and "personal" in d
        assert isinstance(d["payments"], list)

    def test_student_routes_forbidden_for_others(self, admin, personal):
        for c in (admin, personal):
            assert c.get(f"{API}/student/today").status_code == 403
            assert c.get(f"{API}/student/membership").status_code == 403

    def test_student_routes_require_auth(self, anon):
        assert anon.get(f"{API}/student/today").status_code == 401
