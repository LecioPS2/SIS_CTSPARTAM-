const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

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

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { name, email, password, role, phone, personalId, planId, birthDate } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  const newRole = req.user.role === 'personal' ? 'aluno' : role || 'aluno';
  if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(400).json({ error: 'Email já cadastrado' });
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
  const { name, email, phone, personalId, planId, active, password, birthDate } = req.body;
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
