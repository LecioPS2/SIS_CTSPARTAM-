# PRD — IRON HUB (Sistema de Gestão de Academia)

## Problema original
Sistema para gerenciamento de academia com Dashboard do ADM, Dashboard do Personal e app web para o Aluno/atleta. Backend em Node.js, banco MongoDB. Página de login + dashboards completas para os 3 perfis. Cadastro de exercícios (carga, repetições, séries e/ou tempo) disponível para ADM e Personal. Idioma: Português (BR). Auth: JWT email/senha. Envio ao GitHub via botão "Save to GitHub" da plataforma.

## Arquitetura
- **Backend**: Node.js + Express + Mongoose (porta interna 8002). Exposto pelo supervisor via shim ASGI Python (`/app/backend/server.py`, porta 8001) que spawna `node --watch src/index.js` e faz proxy de todas as requisições. NÃO remover o shim — o supervisor da plataforma só roda uvicorn.
- **Frontend**: React (CRA) + Tailwind, tema dark "Performance Pro" (Bebas Neue + DM Sans, accent #FF3B30), Recharts, sonner, lucide-react.
- **Banco**: MongoDB (`gym_management`). Modelos: User (admin/personal/aluno), Plan, Payment, Exercise, Workout, WorkoutLog, Measurement, Session.
- Auth: JWT Bearer (localStorage) + cookie httpOnly, bcryptjs, brute-force lockout (5 tentativas/15min), seed de admin idempotente.
- Seed demo: `node /app/backend/scripts/seed.js` (idempotente).

## Personas
- **Admin**: dono/gerente — finanças, cadastros gerais.
- **Personal**: treinador — alunos próprios, fichas de treino, agenda.
- **Aluno**: atleta — app mobile-first com bottom nav.

## Implementado (ago/2026 — MVP completo, testado 51/51)
- Login JWT com redirecionamento por perfil + proteção de rotas por role
- Admin: visão geral (stats + gráfico receita 6 meses + pagamentos recentes), CRUD alunos (vínculo personal/plano), personais, planos, pagamentos (marcar pago), exercícios
- Personal: visão geral (alunos, treinos, sessões de hoje, concluídos hoje), meus alunos (cadastro auto-vinculado), builder de treinos (dias da semana + exercícios do catálogo com séries/reps/carga/tempo editáveis), agenda de sessões (concluir/cancelar), exercícios
- Aluno: treino do dia + concluir (1x/dia), ficha completa, evolução (medidas + gráfico de peso), mensalidade (plano + status + histórico), perfil (histórico de treinos + logout)
- Segurança: ownership guards (IDOR corrigido), whitelist de campos em PUTs, CORS via env, cascade delete de usuário, ErrorBoundary no frontend

## Backlog priorizado
- P1: Notificações de vencimento de mensalidade; relatórios financeiros exportáveis; avaliação física registrada pelo personal
- P2: Upload de foto de perfil/exercício (object storage); check-in por QR code; dark date-picker customizado (substituir input nativo); recuperação de senha por email
- P2: Refatorar CRUDs repetidos do frontend em hook compartilhado

## Credenciais de teste
Ver `/app/memory/test_credentials.md` (admin@academia.com/admin123, personal@academia.com/senha123, aluno@academia.com/senha123)
