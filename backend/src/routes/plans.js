const router = require('express').Router();
const { Plan } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const plans = await Plan.find({}).sort({ price: 1 });
  res.json(plans.map((p) => p.toJSON()));
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name, price, durationDays, daysPerWeek, description } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  const plan = await Plan.create({ name, price, durationDays, daysPerWeek, description });
  res.status(201).json(plan.toJSON());
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
  res.json(plan.toJSON());
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
