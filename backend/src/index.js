require('dotenv').config();
const express = require('express');
require('express-async-errors');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDb } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const planRoutes = require('./routes/plans');
const paymentRoutes = require('./routes/payments');
const exerciseRoutes = require('./routes/exercises');
const dietRoutes = require('./routes/diets');
const workoutRoutes = require('./routes/workouts');
const sessionRoutes = require('./routes/sessions');
const statsRoutes = require('./routes/stats');
const studentRoutes = require('./routes/student');
const measurementRoutes = require('./routes/measurements');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');
const checkinRoutes = require('./routes/checkin');
const noticeRoutes = require('./routes/notices');

const app = express();
app.use(express.json());
app.use(cookieParser());
const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim());
app.use(cors({ origin: corsOrigins.includes('*') ? true : corsOrigins, credentials: !corsOrigins.includes('*') }));

// Servir arquivos de upload — rota /api/files garante passagem pelo Node no Hostinger
const uploadsBasePath = path.join(__dirname, '..', 'uploads');
app.use('/api/files', express.static(uploadsBasePath));
app.use('/uploads', express.static(uploadsBasePath));

app.get('/api/health', (req, res) => res.json({ status: 'ok', engine: 'node-express', v: 2 }));

// Debug: verificar se a pasta de uploads existe e listar arquivos
app.get('/api/debug/uploads', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const exercisesDir = path.join(uploadsDir, 'exercises');
  const result = {
    uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
    exercisesDir,
    exercisesDirExists: fs.existsSync(exercisesDir),
    files: [],
    cwd: process.cwd(),
    dirname: __dirname
  };
  if (result.exercisesDirExists) {
    try { result.files = fs.readdirSync(exercisesDir); } catch(e) { result.filesError = e.message; }
  }
  res.json(result);
});

// Debug: verificar imageUrl no banco
app.get('/api/debug/exercise', async (req, res) => {
  const { Exercise } = require('./models');
  const ex = await Exercise.findOne({ imageUrl: { $exists: true, $ne: null } });
  res.json({ exercise: ex });
});

// Debug: deletar todos os exercícios
app.delete('/api/debug/exercises', async (req, res) => {
  const { Exercise } = require('./models');
  await Exercise.deleteMany({});
  res.json({ message: 'Todos os exercícios foram apagados.' });
});

// Debug: check persistent storage
app.get('/api/debug/storage', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const rootDir = '/home/u925652802/domains/sistema.ctspartan.com/uploads_persistent';
  let success = false;
  let msg = '';
  try {
    if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'test.txt'), 'hello');
    success = true;
    msg = 'Write successful to ' + rootDir;
  } catch (e) {
    msg = e.message;
  }
  res.json({ success, msg, rootDir });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/notices', noticeRoutes);

app.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });
  next();
});

// === INTEGRAÇÃO COM O FRONTEND (PRODUÇÃO / HOSTINGER) ===
// Serve os arquivos estáticos compilados do React (agora dentro da pasta do backend)
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// Redireciona qualquer rota não reconhecida para o index.html do React
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #C10514;">API CT Spartan Online</h2>
        <p>A API do backend está rodando perfeitamente!</p>
        <p style="color: #666; font-size: 14px;">(Nota: O painel visual do React não foi encontrado no servidor no caminho esperado. Verifique se a pasta 'build' foi copiada corretamente para a Hostinger).</p>
      </div>
    `);
  }
});

app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(400).json({ error: 'ID ou valor inválido' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: 'Dados inválidos' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor: ' + err.message });
});

process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

const PORT = process.env.PORT || 8002;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Node backend rodando na porta ${PORT}`);
  // Inicia a conexão com o banco em background para não travar o boot da Hostinger
  connectDb().catch(err => console.error('Falha crítica no DB:', err));
});
