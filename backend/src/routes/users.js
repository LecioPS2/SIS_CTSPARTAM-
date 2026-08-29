const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// ROTA TEMPORÁRIA PARA RECRIAR O ADMIN (caso o Seed tenha falhado)
router.get('/fix-admin', async (req, res) => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const existing = await User.findOne({ email: 'admin@academia.com' });
    
    if (existing) {
      existing.passwordHash = hash;
      await existing.save();
      return res.json({ message: 'Senha do admin resetada para admin123' });
    } else {
      await User.create({
        name: 'Administrador',
        email: 'admin@academia.com',
        passwordHash: hash,
        role: 'admin',
        active: true
      });
      return res.json({ message: 'Conta admin criada com sucesso! (admin123)' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wipe-all-data', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    await mongoose.model('Plan').deleteMany({});
    await mongoose.model('Payment').deleteMany({});
    await mongoose.model('Notice').deleteMany({});
    await mongoose.model('Exercise').deleteMany({});
    await mongoose.model('Workout').deleteMany({});
    await mongoose.model('WorkoutLog').deleteMany({});
    await mongoose.model('Measurement').deleteMany({});
    await mongoose.model('Session').deleteMany({});
    await mongoose.model('CheckIn').deleteMany({});
    
    // Delete all users EXCEPT the admin
    await User.deleteMany({ email: { $ne: 'admin@academia.com' } });
    
    res.json({ message: 'Banco de dados limpo com sucesso! Apenas o admin sobrou.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(requireAuth);

router.get('/', requireRole('admin', 'personal'), async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (req.user.role === 'personal') {
    filter.role = 'aluno';
    filter.personalId = req.user._id;
  }
  const users = await User.find(filter).populate('planId', 'name price').populate('personalId', 'name').sort({ createdAt: -1 });
  res.json(users.map((u) => u.toJSON()));
});

const ANAMNESIS_FIELDS = ['goal', 'healthConditions', 'medications', 'injuries', 'experienceLevel', 'trainingFrequency', 'anamnesisNotes'];

router.get('/classes', requireRole('admin', 'personal'), async (req, res) => {
  const slots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  const counts = await User.aggregate([
    { $match: { role: 'aluno', active: true, timeSlot: { $ne: null } } },
    { $group: { _id: '$timeSlot', count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => countMap[c._id] = c.count);
  
  const result = slots.map(slot => ({
    time: slot,
    count: countMap[slot] || 0,
    limit: 25,
    full: (countMap[slot] || 0) >= 25
  }));
  res.json(result);
});

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { name, email, password, role, phone, personalId, planId, birthDate, timeSlot } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  const newRole = req.user.role === 'personal' ? 'aluno' : role || 'aluno';
  if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(400).json({ error: 'Email já cadastrado' });
  
  if (timeSlot && newRole === 'aluno') {
    const count = await User.countDocuments({ timeSlot, active: true, role: 'aluno' });
    if (count >= 25) return res.status(400).json({ error: `A turma de ${timeSlot} já atingiu o limite de 25 alunas.` });
  }

  const anamnesis = {};
  ANAMNESIS_FIELDS.forEach((f) => { if (req.body[f] !== undefined) anamnesis[f] = req.body[f]; });
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(password, 10),
    role: newRole,
    phone,
    personalId: req.user.role === 'personal' ? req.user._id : personalId || null,
    planId: planId || null,
    birthDate,
    timeSlot: timeSlot || null,
    ...anamnesis,
  });
  res.status(201).json(user.toJSON());
});

router.put('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (req.user.role === 'personal' && String(user.personalId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const { name, email, phone, personalId, planId, active, password, birthDate, timeSlot } = req.body;
  
  if (timeSlot !== undefined && timeSlot !== user.timeSlot && user.role === 'aluno') {
    if (timeSlot) {
      const count = await User.countDocuments({ timeSlot, active: true, role: 'aluno' });
      if (count >= 25) return res.status(400).json({ error: `A turma de ${timeSlot} já atingiu o limite de 25 alunas.` });
    }
    user.timeSlot = timeSlot || null;
  }

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase().trim();
  if (phone !== undefined) user.phone = phone;
  if (birthDate !== undefined) user.birthDate = birthDate;
  ANAMNESIS_FIELDS.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
  if (req.user.role === 'admin') {
    if (personalId !== undefined) user.personalId = personalId || null;
    if (planId !== undefined) user.planId = planId || null;
    if (active !== undefined) user.active = active;
  }
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  res.json(user.toJSON());
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { Payment, Workout, Session, WorkoutLog, Measurement } = require('../models');
  await Promise.all([
    Payment.deleteMany({ studentId: user._id }),
    Workout.deleteMany({ $or: [{ studentId: user._id }, { personalId: user._id }] }),
    Session.deleteMany({ $or: [{ studentId: user._id }, { personalId: user._id }] }),
    WorkoutLog.deleteMany({ studentId: user._id }),
    Measurement.deleteMany({ studentId: user._id }),
  ]);
  res.json({ ok: true });
});

module.exports = router;
