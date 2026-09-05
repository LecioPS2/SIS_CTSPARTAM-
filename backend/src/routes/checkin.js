const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { CheckIn, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/checkin/token — gera QR token diário para a aluna
router.get('/token', requireRole('aluno'), async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const token = jwt.sign(
    { sub: req.user._id.toString(), name: req.user.name, date: today, purpose: 'checkin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, date: today });
});

// POST /api/checkin/validate — Admin valida QR e registra check-in
router.post('/validate', requireRole('admin', 'assessor'), async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token não informado' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(400).json({ error: 'QR Code inválido ou expirado' });
  }

  if (payload.purpose !== 'checkin') {
    return res.status(400).json({ error: 'QR Code inválido' });
  }

  const student = await User.findById(payload.sub);
  if (!student || !student.active) {
    return res.status(404).json({ error: 'Aluna não encontrada ou inativa' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const existing = await CheckIn.findOne({ studentId: payload.sub, date: today });
  if (existing) {
    return res.status(400).json({
      error: 'Check-in já realizado hoje',
      student: { id: student._id, name: student.name, avatarUrl: student.avatarUrl },
      checkin: existing.toJSON(),
    });
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const checkin = await CheckIn.create({
    studentId: payload.sub,
    date: today,
    time,
    method: 'qrcode',
  });

  res.status(201).json({
    student: { id: student._id, name: student.name, avatarUrl: student.avatarUrl },
    checkin: checkin.toJSON(),
  });
});

// POST /api/checkin/manual — Check-in manual pelo Admin
router.post('/manual', requireRole('admin', 'assessor'), async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'ID da aluna não informado' });

  const student = await User.findById(studentId);
  if (!student || !student.active) {
    return res.status(404).json({ error: 'Aluna não encontrada ou inativa' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const existing = await CheckIn.findOne({ studentId, date: today });
  if (existing) {
    return res.status(400).json({ error: 'Check-in já realizado hoje' });
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const checkin = await CheckIn.create({ studentId, date: today, time, method: 'manual' });

  res.status(201).json({
    student: { id: student._id, name: student.name },
    checkin: checkin.toJSON(),
  });
});

// POST /api/checkin/scan — Aluna scaneia o QR da portaria
router.post('/scan', requireRole('aluno'), async (req, res) => {
  const { qrCode } = req.body;
  if (!qrCode || qrCode !== 'CHECKIN_CTSPARTAN') {
    return res.status(400).json({ error: 'QR Code inválido da portaria' });
  }

  const studentId = req.user._id;
  const today = new Date().toISOString().slice(0, 10);
  const existing = await CheckIn.findOne({ studentId, date: today });
  
  if (existing) {
    return res.status(400).json({ error: 'Check-in já realizado hoje!' });
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const checkin = await CheckIn.create({
    studentId,
    date: today,
    time,
    method: 'qrcode_student',
  });

  res.status(201).json({
    message: 'Check-in realizado com sucesso!',
    checkin: checkin.toJSON()
  });
});

// GET /api/checkin/today — lista check-ins do dia (Admin)
router.get('/today', requireRole('admin', 'assessor'), async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const checkins = await CheckIn.find({ date: today })
    .populate('studentId', 'name avatarUrl')
    .sort({ time: -1 });
  res.json(checkins.map((c) => c.toJSON()));
});

// GET /api/checkin/history — histórico de check-ins da aluna
router.get('/history', requireRole('aluno'), async (req, res) => {
  const checkins = await CheckIn.find({ studentId: req.user._id })
    .sort({ date: -1, time: -1 })
    .limit(30);
  res.json(checkins.map((c) => c.toJSON()));
});

// GET /api/checkin/report — Relatórios dinâmicos de check-ins (Admin)
router.get('/report', requireRole('admin', 'assessor'), async (req, res) => {
  const { start, end, studentId } = req.query;
  const filter = {};
  
  if (start && end) {
    filter.date = { $gte: start, $lte: end };
  } else if (start) {
    filter.date = { $gte: start };
  } else if (end) {
    filter.date = { $lte: end };
  }
  
  if (studentId) {
    filter.studentId = studentId;
  }

  const checkins = await CheckIn.find(filter)
    .populate('studentId', 'name email avatarUrl')
    .sort({ date: -1, time: -1 });
    
  res.json(checkins.map((c) => c.toJSON()));
});

module.exports = router;
