const router = require('express').Router();
const { Payment, User } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/notifications — notificações dinâmicas por role
router.get('/', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const notifications = [];

  if (req.user.role === 'admin') {
    // Admin vê todas as pendências
    const payments = await Payment.find({ status: { $ne: 'pago' } })
      .populate('studentId', 'name email')
      .sort({ dueDate: 1 });

    payments.forEach((p) => {
      const isOverdue = p.dueDate < today;
      const isDueSoon = !isOverdue && p.dueDate <= inSevenDays;
      if (isOverdue || isDueSoon) {
        notifications.push({
          id: p._id.toString(),
          type: isOverdue ? 'atrasado' : 'vencimento',
          message: isOverdue
            ? `Mensalidade de ${p.studentId?.name || 'Aluna'} está atrasada`
            : `Mensalidade de ${p.studentId?.name || 'Aluna'} vence em breve`,
          studentName: p.studentId?.name || '—',
          dueDate: p.dueDate,
          amount: p.amount,
          paymentId: p._id.toString(),
        });
      }
    });
  } else if (req.user.role === 'personal') {
    // Personal vê alunas vinculadas
    const students = await User.find({ role: 'aluno', personalId: req.user._id, active: true }).select('_id name');
    const studentIds = students.map((s) => s._id);
    const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s.name]));

    const payments = await Payment.find({
      studentId: { $in: studentIds },
      status: { $ne: 'pago' },
    }).sort({ dueDate: 1 });

    payments.forEach((p) => {
      const isOverdue = p.dueDate < today;
      const isDueSoon = !isOverdue && p.dueDate <= inSevenDays;
      if (isOverdue || isDueSoon) {
        const name = studentMap[p.studentId.toString()] || 'Aluna';
        notifications.push({
          id: p._id.toString(),
          type: isOverdue ? 'atrasado' : 'vencimento',
          message: isOverdue
            ? `Mensalidade de ${name} está atrasada`
            : `Mensalidade de ${name} vence em breve`,
          studentName: name,
          dueDate: p.dueDate,
          amount: p.amount,
          paymentId: p._id.toString(),
        });
      }
    });
  } else if (req.user.role === 'aluno') {
    // Aluna vê próprias pendências
    const payments = await Payment.find({
      studentId: req.user._id,
      status: { $ne: 'pago' },
    }).sort({ dueDate: 1 });

    payments.forEach((p) => {
      const isOverdue = p.dueDate < today;
      const isDueSoon = !isOverdue && p.dueDate <= inSevenDays;
      if (isOverdue || isDueSoon) {
        notifications.push({
          id: p._id.toString(),
          type: isOverdue ? 'atrasado' : 'vencimento',
          message: isOverdue
            ? 'Sua mensalidade está atrasada. Procure a recepção.'
            : 'Sua mensalidade vence em breve.',
          studentName: req.user.name,
          dueDate: p.dueDate,
          amount: p.amount,
          paymentId: p._id.toString(),
        });
      }
    });
  }

  res.json(notifications);
});

module.exports = router;
