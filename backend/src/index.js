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
const workoutRoutes = require('./routes/workouts');
const sessionRoutes = require('./routes/sessions');
const statsRoutes = require('./routes/stats');
const studentRoutes = require('./routes/student');
const measurementRoutes = require('./routes/measurements');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');
const checkinRoutes = require('./routes/checkin');

const app = express();
app.use(express.json());
app.use(cookieParser());
const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim());
app.use(cors({ origin: corsOrigins.includes('*') ? true : corsOrigins, credentials: !corsOrigins.includes('*') }));

// Servir arquivos de upload como estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', engine: 'node-express' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/checkin', checkinRoutes);

app.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });
  next();
});

// === INTEGRAÇÃO COM O FRONTEND (PRODUÇÃO / HOSTINGER) ===
// Serve os arquivos estáticos compilados do React
const frontendPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendPath));

// Redireciona qualquer rota não reconhecida (que não seja /api/) para o index.html do React
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(400).json({ error: 'ID ou valor inválido' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: 'Dados inválidos' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

const PORT = process.env.PORT || 8002;
connectDb().then(() => {
  app.listen(PORT, '127.0.0.1', () => console.log(`Node backend rodando na porta ${PORT}`));
});
