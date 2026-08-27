const router = require('express').Router();
const { Payment } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('admin'), async (req, res) => {
  const payments = await Payment.find({}).populate('studentId', 'name email').populate('planId', 'name').sort({ dueDate: -1 });
  res.json(payments.map((p) => p.toJSON()));
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { studentId, planId, amount, dueDate, status, method, reference } = req.body;
  if (!studentId || amount === undefined || !dueDate) return res.status(400).json({ error: 'Aluno, valor e vencimento são obrigatórios' });
  const payment = await Payment.create({
    studentId, planId: planId || null, amount, dueDate, method, reference,
    status: status || 'pendente',
    paidAt: status === 'pago' ? new Date().toISOString().slice(0, 10) : null,
  });
  res.status(201).json(payment.toJSON());
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { planId, amount, dueDate, status, method, reference, paidAt } = req.body;
  const update = {};
  [['planId', planId], ['amount', amount], ['dueDate', dueDate], ['status', status], ['method', method], ['reference', reference], ['paidAt', paidAt]].forEach(([k, v]) => { if (v !== undefined) update[k] = v; });
  if (update.status === 'pago' && !update.paidAt) update.paidAt = new Date().toISOString().slice(0, 10);
  if (update.status && update.status !== 'pago') update.paidAt = null;
  const payment = await Payment.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });
  res.json(payment.toJSON());
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Payment.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
