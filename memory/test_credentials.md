# Credenciais de Teste — IRON HUB (Gestão de Academia)

## Contas
| Perfil | Email | Senha |
|---|---|---|
| Admin | admin@academia.com | admin123 |
| Personal | personal@academia.com | senha123 |
| Aluno | aluno@academia.com | senha123 |

## Arquitetura
- Backend: Node.js + Express (porta interna 8002), exposto via shim ASGI Python (`/app/backend/server.py`) na porta 8001 (supervisor)
- Frontend: React (CRA) + Tailwind, porta 3000
- Banco: MongoDB (db: gym_management)

## Endpoints principais
- POST /api/auth/login {email, password} → {token, user}
- GET /api/auth/me (Bearer token)
- CRUD: /api/users, /api/plans, /api/payments, /api/exercises, /api/workouts, /api/sessions
- Stats: /api/stats/admin, /api/stats/personal
- Aluno: /api/student/today, /api/student/complete/:workoutId, /api/student/measurements, /api/student/membership, /api/student/history

## Rotas frontend
- /login | /admin/* | /personal/* | /aluno/*
