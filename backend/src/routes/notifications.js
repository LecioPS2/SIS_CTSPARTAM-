const router = require('express').Router();
const { Payment, User, Notice } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/notifications — notificações dinâmicas por role
router.get('/', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const notifications = [];

  if (req.user.role === 'admin') {
    // Admin vê todas as pendências
    const payments = await Payment.find({ type: 'entrada', status: { $ne: 'pago' } })
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
      type: 'entrada',
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
      type: 'entrada',
      studentId: req.user._id,
      status: { $ne: 'pago' },
    }).sort({ dueDate: 1 });

    payments.forEach((p) => {
      const isOverdue = p.dueDate < today;
      const isDueSoon = !isOverdue && p.dueDate <= inSevenDays;
      if (isOverdue || isDueSoon) {
        const [y, m, d] = (p.dueDate || '').split('-');
        const dateFormatted = d && m && y ? `${d}/${m}/${y}` : p.dueDate;
        const diffDays = Math.round((new Date(p.dueDate + 'T12:00:00') - new Date(today + 'T12:00:00')) / 86400000);

        let msg = '';
        if (isOverdue) {
          msg = `Sua mensalidade de ${p.amount ? 'R$ ' + Number(p.amount).toFixed(2).replace('.', ',') : ''} venceu em ${dateFormatted} e está pendente. Procure a recepção para regularizar.`;
        } else if (diffDays === 0) {
          msg = `Sua mensalidade de ${p.amount ? 'R$ ' + Number(p.amount).toFixed(2).replace('.', ',') : ''} vence HOJE (${dateFormatted})!`;
        } else {
          msg = `Sua mensalidade de ${p.amount ? 'R$ ' + Number(p.amount).toFixed(2).replace('.', ',') : ''} vence em ${diffDays} dia(s) (${dateFormatted}).`;
        }

        notifications.push({
          id: p._id.toString(),
          type: isOverdue ? 'atrasado' : 'vencimento',
          title: isOverdue ? 'Mensalidade Atrasada' : (diffDays === 0 ? 'Vencimento Hoje' : 'Vencimento Próximo'),
          message: msg,
          content: msg,
          studentName: req.user.name,
          dueDate: p.dueDate,
          amount: p.amount,
          paymentId: p._id.toString(),
          createdAt: p.createdAt || p.dueDate,
        });
      }
    });
  }

  // 2. Busca Avisos Globais (Mural)
  let noticeFilter = { active: true };
  if (req.user.role !== 'admin') {
    noticeFilter.$and = [
      { targetRole: { $in: ['todos', req.user.role] } },
      { $or: [{ targetUser: null }, { targetUser: req.user._id }] }
    ];
  }
  const notices = await Notice.find(noticeFilter).sort({ createdAt: -1 });
  
  notices.forEach((n) => {
    notifications.unshift({
      id: `notice_${n._id.toString()}`,
      type: 'aviso',
      title: n.title,
      message: n.message,
    });
  });

  res.json(notifications);
});

module.exports = router;
