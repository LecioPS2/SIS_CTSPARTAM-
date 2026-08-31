const router = require('express').Router();
const { DietPlan } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/my-diet', async (req, res) => {
  const diet = await DietPlan.findOne({ studentId: req.user._id }).sort({ createdAt: -1 });
  if (!diet) return res.json(null);
  res.json(diet.toJSON());
});

router.get('/', requireRole('admin', 'personal'), async (req, res) => {
  let filter = {};
  if (req.user.role === 'personal') {
    filter = { createdBy: req.user._id };
  }
  const diets = await DietPlan.find(filter).populate('studentId', 'name email').sort({ createdAt: -1 });
  res.json(diets.map(d => d.toJSON()));
});

router.post('/', requireRole('admin', 'personal'), async (req, res) => {
  const { studentId, title, goal, notes, meals } = req.body;
  if (!studentId || !title) return res.status(400).json({ error: 'Aluna e Título são obrigatórios' });
  
  const diet = await DietPlan.create({
    studentId,
    title,
    goal,
    notes,
    meals,
    createdBy: req.user._id
  });
  res.status(201).json(diet.toJSON());
});

router.put('/:id', requireRole('admin', 'personal'), async (req, res) => {
  const { title, goal, notes, meals } = req.body;
  const diet = await DietPlan.findByIdAndUpdate(req.params.id, {
    title, goal, notes, meals
  }, { new: true });
  
  if (!diet) return res.status(404).json({ error: 'Dieta não encontrada' });
  res.json(diet.toJSON());
});

router.delete('/:id', requireRole('admin', 'personal'), async (req, res) => {
  await DietPlan.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
