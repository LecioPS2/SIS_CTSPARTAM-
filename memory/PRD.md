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

## Implementado (ago/2026 — MVP completo + iteração 2, testado 64/64)
- Login JWT com redirecionamento por perfil + proteção de rotas por role
- Admin: visão geral (stats + gráfico receita 6 meses + pagamentos recentes), CRUD alunas (vínculo personal/plano), personais, planos, pagamentos (marcar pago), exercícios
- Personal: visão geral, minhas alunas (cadastro auto-vinculado), builder de treinos (dias da semana + exercícios do catálogo com séries/reps/carga/tempo editáveis), agenda de sessões, exercícios
- Aluna: treino do dia + concluir (1x/dia), ficha completa, evolução (medidas + gráfico de peso), mensalidade, perfil
- Segurança: ownership guards (IDOR corrigido), whitelist de campos em PUTs, CORS via env, cascade delete, ErrorBoundary, express-async-errors + validação de ObjectId (crash por ID inválido corrigido)
- Iteração 2: academia exclusiva para mulheres (linguagem feminina em toda UI; roles internas inalteradas para aceitar homens no futuro); questionário de anamnese no cadastro (meta, doenças, medicamentos, lesões, nível, frequência, observações — campos no User model); Avaliação Física registrada pelo personal (/api/measurements/:studentId GET/POST com ownership, modal em Minhas Alunas com histórico); tela de login com foto de atleta mulher enviada pelo usuário e fundo #040d1e

## Backlog priorizado
- P1: Notificações de vencimento de mensalidade; relatórios financeiros exportáveis; avaliação física registrada pelo personal
- P2: Upload de foto de perfil/exercício (object storage); check-in por QR code; dark date-picker customizado (substituir input nativo); recuperação de senha por email
- P2: Refatorar CRUDs repetidos do frontend em hook compartilhado

## Credenciais de teste
Ver `/app/memory/test_credentials.md` (admin@academia.com/admin123, personal@academia.com/senha123, aluno@academia.com/senha123)
