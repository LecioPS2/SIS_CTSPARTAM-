const router = require('express').Router();
const { Exercise } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const exercises = await Exercise.find({}).sort({ muscleGroup: 1, name: 1 });
  res.json(exercises.map((e) => e.toJSON()));
});

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { name, muscleGroup, sets, reps, load, timeSeconds, notes } = req.body;
  if (!name || !muscleGroup) return res.status(400).json({ error: 'Nome e grupo muscular são obrigatórios' });
  const exercise = await Exercise.create({ name, muscleGroup, sets, reps, load, timeSeconds, notes, createdBy: req.user._id });
  res.status(201).json(exercise.toJSON());
});

router.put('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const { name, muscleGroup, sets, reps, load, timeSeconds, notes } = req.body;
  const update = {};
  [['name', name], ['muscleGroup', muscleGroup], ['sets', sets], ['reps', reps], ['load', load], ['timeSeconds', timeSeconds], ['notes', notes]].forEach(([k, v]) => { if (v !== undefined) update[k] = v; });
  const exercise = await Exercise.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!exercise) return res.status(404).json({ error: 'Exercício não encontrado' });
  res.json(exercise.toJSON());
});

router.delete('/:id', requireRole('admin', 'personal'), async (req, res) => {
  await Exercise.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
