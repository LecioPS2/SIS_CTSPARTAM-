const router = require('express').Router();
const { Notice } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Listar avisos ativos para o usuário logado (aluno ou personal visualiza, admin visualiza todos)
router.get('/', async (req, res) => {
  let filter = { active: true };
  if (req.user.role !== 'admin') {
    filter.targetRole = { $in: ['todos', req.user.role] };
  } else {
    // Admin vê todos independentemente da flag active na tela de gerenciamento
    filter = {};
  }
  
  const notices = await Notice.find(filter).populate('createdBy', 'name').sort({ createdAt: -1 });
  res.json(notices.map((n) => n.toJSON()));
});

// Admin: Criar aviso
router.post('/', requireRole('admin'), async (req, res) => {
  const { title, message, targetRole, active } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });

  const notice = await Notice.create({
    title,
    message,
    targetRole: targetRole || 'todos',
    createdBy: req.user.id,
    active: active !== undefined ? active : true
  });
  res.status(201).json(notice.toJSON());
});

// Admin: Atualizar aviso
router.put('/:id', requireRole('admin'), async (req, res) => {
  const { title, message, targetRole, active } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (message !== undefined) update.message = message;
  if (targetRole !== undefined) update.targetRole = targetRole;
  if (active !== undefined) update.active = active;

  const notice = await Notice.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!notice) return res.status(404).json({ error: 'Aviso não encontrado' });
  res.json(notice.toJSON());
});

// Admin: Deletar aviso
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
