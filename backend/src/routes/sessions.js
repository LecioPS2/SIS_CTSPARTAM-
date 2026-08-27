const router = require('express').Router();
const { Session } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('admin', 'personal'), async (req, res) => {
  const filter = {};
  if (req.user.role === 'personal') filter.personalId = req.user._id;
  const sessions = await Session.find(filter).populate('studentId', 'name').sort({ date: 1, time: 1 });
  res.json(sessions.map((s) => s.toJSON()));
});

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { studentId, date, time, durationMin, notes } = req.body;
  if (!studentId || !date || !time) return res.status(400).json({ error: 'Aluno, data e hora são obrigatórios' });
  const session = await Session.create({ personalId: req.user._id, studentId, date, time, durationMin, notes });
  res.status(201).json(session.toJSON());
});

function ownerFilter(req) {
  const filter = { _id: req.params.id };
  if (req.user.role === 'personal') filter.personalId = req.user._id;
  return filter;
}

router.put('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const { studentId, date, time, durationMin, notes, status } = req.body;
  const update = {};
  if (studentId !== undefined) update.studentId = studentId;
  if (date !== undefined) update.date = date;
  if (time !== undefined) update.time = time;
  if (durationMin !== undefined) update.durationMin = durationMin;
  if (notes !== undefined) update.notes = notes;
  if (status !== undefined) update.status = status;
  const session = await Session.findOneAndUpdate(ownerFilter(req), update, { new: true });
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
  res.json(session.toJSON());
});

router.delete('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const session = await Session.findOneAndDelete(ownerFilter(req));
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
  res.json({ ok: true });
});

module.exports = router;
