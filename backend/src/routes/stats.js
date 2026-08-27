const router = require('express').Router();
const { User, Payment, Workout, Session, WorkoutLog } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/admin', requireRole('admin'), async (req, res) => {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const [totalAlunos, totalPersonais, payments] = await Promise.all([
    User.countDocuments({ role: 'aluno', active: true }),
    User.countDocuments({ role: 'personal', active: true }),
    Payment.find({}),
  ]);
  const paid = payments.filter((p) => p.status === 'pago');
  const monthRevenue = paid.filter((p) => p.paidAt && p.paidAt >= monthStart).reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status !== 'pago').length;
  const pendingAmount = payments.filter((p) => p.status !== 'pago').reduce((s, p) => s + p.amount, 0);

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' });
    const total = paid.filter((p) => p.paidAt && p.paidAt.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    months.push({ month: label, receita: total });
  }
  const recent = await Payment.find({}).populate('studentId', 'name').sort({ createdAt: -1 }).limit(5);
  res.json({ totalAlunos, totalPersonais, monthRevenue, pendingCount, pendingAmount, revenueChart: months, recentPayments: recent.map((p) => p.toJSON()) });
});

router.get('/personal', requireRole('personal'), async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [totalAlunos, totalTreinos, sessions, logs] = await Promise.all([
    User.countDocuments({ role: 'aluno', personalId: req.user._id, active: true }),
    Workout.countDocuments({ personalId: req.user._id, active: true }),
    Session.find({ personalId: req.user._id, date: today, status: 'agendada' }).populate('studentId', 'name').sort({ time: 1 }),
    WorkoutLog.find({ date: today }),
  ]);
  const myWorkouts = await Workout.find({ personalId: req.user._id }).select('_id');
  const ids = new Set(myWorkouts.map((w) => w._id.toString()));
  const completedToday = logs.filter((l) => ids.has(l.workoutId.toString())).length;
  res.json({ totalAlunos, totalTreinos, sessionsToday: sessions.map((s) => s.toJSON()), completedToday });
});

module.exports = router;
