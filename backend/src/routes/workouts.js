const router = require('express').Router();
const { Workout } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('admin', 'personal'), async (req, res) => {
  const filter = {};
  if (req.user.role === 'personal') filter.personalId = req.user._id;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  const workouts = await Workout.find(filter).populate('studentId', 'name').sort({ createdAt: -1 });
  res.json(workouts.map((w) => w.toJSON()));
});

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { name, studentId, days, exercises } = req.body;
  if (!name || !studentId) return res.status(400).json({ error: 'Nome e aluno são obrigatórios' });
  const workout = await Workout.create({
    name, studentId,
    personalId: req.user._id,
    days: days || [],
    exercises: exercises || [],
  });
  res.status(201).json(workout.toJSON());
});

function ownerFilter(req) {
  const filter = { _id: req.params.id };
  if (req.user.role === 'personal') filter.personalId = req.user._id;
  return filter;
}

router.put('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const { name, studentId, days, exercises, active } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (studentId !== undefined) update.studentId = studentId;
  if (days !== undefined) update.days = days;
  if (exercises !== undefined) update.exercises = exercises;
  if (active !== undefined) update.active = active;
  const workout = await Workout.findOneAndUpdate(ownerFilter(req), update, { new: true });
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado' });
  res.json(workout.toJSON());
});

router.delete('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const workout = await Workout.findOneAndDelete(ownerFilter(req));
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
