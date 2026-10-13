const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// ROTA TEMPORÁRIA PARA RECRIAR O ADMIN (caso o Seed tenha falhado)
router.get('/fix-admin', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ctspartan.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'adminCT123';
    const hash = await bcrypt.hash(adminPass, 10);
    const existing = await User.findOne({ email: adminEmail });
    
    if (existing) {
      existing.passwordHash = hash;
      await existing.save();
      return res.json({ message: 'Senha do admin resetada' });
    } else {
      await User.create({
        name: 'Administrador',
        email: adminEmail,
        passwordHash: hash,
        role: 'admin',
        active: true
      });
      return res.json({ message: 'Conta admin criada com sucesso!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wipe-all-data', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ctspartan.com';
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
    await User.deleteMany({ email: { $ne: adminEmail } });
    
    res.json({ message: 'Banco de dados limpo com sucesso! Apenas o admin sobrou.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(requireAuth);

router.get('/', requireRole('admin', 'personal', 'assessor'), async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (req.user.role === 'personal') {
    filter.role = 'aluno';
    filter.personalId = req.user._id;
  }
  if (req.user.role === 'assessor' && !role) {
      filter.role = 'aluno';
  }
  const users = await User.find(filter).populate('planId', 'name price').populate('personalId', 'name').sort({ createdAt: -1 });
  res.json(users.map((u) => u.toJSON()));
});

const ANAMNESIS_FIELDS = ['goal', 'healthConditions', 'medications', 'injuries', 'experienceLevel', 'trainingFrequency', 'anamnesisNotes'];

router.get('/classes', requireRole('admin', 'personal', 'assessor'), async (req, res) => {
  const slots = [
    '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', 
    '21:00', '22:00'
  ];
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

// GET /api/users/:id/overview — visão completa da aluna (perfil, treinos, evolução, financeiro, check-ins)
router.get('/:id/overview', requireRole('admin', 'personal', 'assessor'), async (req, res) => {
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { Workout, WorkoutLog, Measurement, Payment, CheckIn, DietPlan } = require('../models');
  const student = await User.findById(req.params.id).populate('planId', 'name price durationDays').populate('personalId', 'name');
  if (!student || student.role !== 'aluno') return res.status(404).json({ error: 'Aluna não encontrada' });
  if (req.user.role === 'personal' && String(student.personalId?._id || student.personalId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  const sid = student._id;
  const [workouts, logs, measurements, payments, checkins, diets] = await Promise.all([
    Workout.find({ studentId: sid }).populate('personalId', 'name').sort({ createdAt: -1 }),
    WorkoutLog.find({ studentId: sid }).populate('workoutId', 'name').sort({ date: -1 }).limit(60),
    Measurement.find({ studentId: sid }).sort({ date: 1 }),
    req.user.role === 'personal' ? Promise.resolve([]) : Payment.find({ studentId: sid }).populate('planId', 'name').sort({ dueDate: 1 }),
    CheckIn.find({ studentId: sid }).sort({ date: -1, time: -1 }).limit(60),
    DietPlan.find({ studentId: sid }).sort({ createdAt: -1 }),
  ]);
  res.json({
    student: student.toJSON(),
    workouts: workouts.map((w) => w.toJSON()),
    logs: logs.map((l) => l.toJSON()),
    measurements: measurements.map((m) => m.toJSON()),
    payments: payments.map((p) => p.toJSON()),
    checkins: checkins.map((c) => c.toJSON()),
    diets: diets.map((d) => d.toJSON()),
  });
});

router.post('/', requireRole('admin', 'personal', 'assessor'), async (req, res) => {
  const { name, email, password, role, phone, personalId, planId, birthDate, timeSlot, paymentDueDate, planDuration } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  const newRole = (req.user.role === 'personal' || req.user.role === 'assessor') ? 'aluno' : role || 'aluno';
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
    paymentDueDate,
    planDuration,
    ...anamnesis,
  });
  res.status(201).json(user.toJSON());
});

router.put('/:id', requireRole('admin', 'personal', 'assessor'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (req.user.role === 'personal' && String(user.personalId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (req.user.role === 'assessor' && user.role !== 'aluno') {
    return res.status(403).json({ error: 'Assessores só podem editar alunas' });
  }
  const { name, email, phone, personalId, planId, active, password, birthDate, timeSlot, paymentDueDate, planDuration } = req.body;
  
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
  if (paymentDueDate !== undefined) user.paymentDueDate = paymentDueDate;
  if (planDuration !== undefined) user.planDuration = planDuration;
  if (req.user.role === 'admin' || req.user.role === 'assessor') {
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
