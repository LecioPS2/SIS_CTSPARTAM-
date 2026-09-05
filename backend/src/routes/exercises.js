const router = require('express').Router();
const { Exercise } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const exercises = await Exercise.find({}).sort({ muscleGroup: 1, name: 1 });
  res.json(exercises.map((e) => e.toJSON()));
});

router.post('/seed', requireRole('admin', 'personal'), async (req, res) => {
  const superioress = [
    { name: 'Supino reto', muscleGroup: 'Peito' },
    { name: 'Supino inclinado', muscleGroup: 'Peito' },
    { name: 'Crucifixo', muscleGroup: 'Peito' },
    { name: 'Crossover', muscleGroup: 'Peito' },
    { name: 'Puxada alta', muscleGroup: 'Costas' },
    { name: 'Remada curvada', muscleGroup: 'Costas' },
    { name: 'Remada baixa', muscleGroup: 'Costas' },
    { name: 'Barra fixa', muscleGroup: 'Costas' },
    { name: 'Rosca direta', muscleGroup: 'Bíceps' },
    { name: 'Rosca alternada', muscleGroup: 'Bíceps' },
    { name: 'Rosca martelo', muscleGroup: 'Bíceps' },
    { name: 'Rosca na polia', muscleGroup: 'Bíceps' },
    { name: 'Tríceps testa', muscleGroup: 'Tríceps' },
    { name: 'Tríceps pulley', muscleGroup: 'Tríceps' },
    { name: 'Tríceps corda', muscleGroup: 'Tríceps' },
    { name: 'Mergulho', muscleGroup: 'Tríceps' },
    { name: 'Desenvolvimento', muscleGroup: 'Ombros' },
    { name: 'Elevação lateral', muscleGroup: 'Ombros' },
    { name: 'Elevação frontal', muscleGroup: 'Ombros' },
    { name: 'Crucifixo invertido', muscleGroup: 'Ombros' },
  ];

  const inferiores = [
    { name: 'Agachamento', muscleGroup: 'Pernas' },
    { name: 'Búlgaro', muscleGroup: 'Pernas' },
    { name: 'Sumô', muscleGroup: 'Pernas' },
    { name: 'Afundo', muscleGroup: 'Pernas' },
    { name: 'Passada', muscleGroup: 'Pernas' },
    { name: 'Agachamento livre', muscleGroup: 'Pernas' },
    { name: 'Agachamento no Smith', muscleGroup: 'Pernas' },
    { name: 'Polia', muscleGroup: 'Glúteos' },
    { name: 'Panturrilha', muscleGroup: 'Pernas' },
    { name: 'Elevação', muscleGroup: 'Glúteos' },
    { name: 'Mesa flexora', muscleGroup: 'Pernas' },
    { name: 'Flexora em pé', muscleGroup: 'Pernas' },
    { name: 'Abdução', muscleGroup: 'Glúteos' },
    { name: 'Adução', muscleGroup: 'Pernas' },
    { name: 'Cadeira extensora', muscleGroup: 'Pernas' }
  ];

  const core = [
    { name: 'Abdominal supra', muscleGroup: 'Abdômen' },
    { name: 'Abdominal infra', muscleGroup: 'Abdômen' },
    { name: 'Abdominal oblíquo', muscleGroup: 'Abdômen' },
    { name: 'Abdominal na polia', muscleGroup: 'Abdômen' },
    { name: 'Prancha abdominal', muscleGroup: 'Abdômen' }
  ];

  const allExercises = [...superioress, ...inferiores, ...core].map(ex => ({
    ...ex,
    sets: 3,
    reps: 12,
    load: 0,
    timeSeconds: 0,
    active: true,
    createdBy: req.user._id
  }));

  let inserted = 0;
  for (const ex of allExercises) {
    const exists = await Exercise.findOne({ name: ex.name });
    if (!exists) {
      await Exercise.create(ex);
      inserted++;
    }
  }

  res.json({ message: `${inserted} exercícios cadastrados com sucesso.` });
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
