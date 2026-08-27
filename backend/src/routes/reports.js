const router = require('express').Router();
const { Payment } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

// GET /api/reports/payments/csv — exporta pagamentos em CSV
router.get('/payments/csv', async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.dueDate = {};
    if (from) filter.dueDate.$gte = from;
    if (to) filter.dueDate.$lte = to;
  }

  const payments = await Payment.find(filter)
    .populate('studentId', 'name email')
    .populate('planId', 'name')
    .sort({ dueDate: -1 });

  const BOM = '\uFEFF';
  const header = 'Aluna;Email;Plano;Valor;Vencimento;Pago em;Status;Método';
  const rows = payments.map((p) => {
    const j = p.toJSON();
    return [
      j.studentId?.name || '—',
      j.studentId?.email || '—',
      j.planId?.name || '—',
      String(j.amount).replace('.', ','),
      j.dueDate || '—',
      j.paidAt || '—',
      j.status || '—',
      j.method || '—',
    ].join(';');
  });

  const csv = BOM + [header, ...rows].join('\r\n');
  const filename = `pagamentos_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// GET /api/reports/summary — resumo financeiro JSON
router.get('/summary', async (req, res) => {
  const payments = await Payment.find({}).populate('planId', 'name');
  const now = new Date();

  const totalReceived = payments
    .filter((p) => p.status === 'pago')
    .reduce((s, p) => s + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'pendente')
    .reduce((s, p) => s + p.amount, 0);

  const totalOverdue = payments
    .filter((p) => p.status === 'atrasado')
    .reduce((s, p) => s + p.amount, 0);

  // Receita por mês (últimos 12 meses)
  const revenueByMonth = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const total = payments
      .filter((p) => p.status === 'pago' && p.paidAt && p.paidAt.startsWith(key))
      .reduce((s, p) => s + p.amount, 0);
    revenueByMonth.push({ month: label, key, receita: total });
  }

  // Receita por plano
  const planMap = {};
  payments.filter((p) => p.status === 'pago').forEach((p) => {
    const planName = p.planId?.name || 'Sem plano';
    planMap[planName] = (planMap[planName] || 0) + p.amount;
  });
  const revenueByPlan = Object.entries(planMap).map(([plan, total]) => ({ plan, total }));

  res.json({ totalReceived, totalPending, totalOverdue, revenueByMonth, revenueByPlan });
});

module.exports = router;
