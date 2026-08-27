const router = require('express').Router();
const mongoose = require('mongoose');
const { Measurement, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'personal'));

async function canAccess(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.studentId)) return res.status(400).json({ error: 'ID inválido' });
  const student = await User.findById(req.params.studentId);
  if (!student || student.role !== 'aluno') return res.status(404).json({ error: 'Aluna não encontrada' });
  if (req.user.role === 'personal' && String(student.personalId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

router.get('/:studentId', canAccess, async (req, res) => {
  const list = await Measurement.find({ studentId: req.params.studentId }).sort({ date: 1 });
  res.json(list.map((m) => m.toJSON()));
});

router.post('/:studentId', canAccess, async (req, res) => {
  const fields = ['weight', 'height', 'chest', 'waist', 'hip', 'arm', 'thigh'];
  const data = {};
  for (const f of fields) {
    if (req.body[f] !== undefined && req.body[f] !== null && req.body[f] !== '') {
      const n = Number(req.body[f]);
      if (Number.isNaN(n) || n < 0) return res.status(400).json({ error: `Valor inválido para ${f}` });
      data[f] = n;
    }
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Informe pelo menos uma medida' });
  const m = await Measurement.create({
    studentId: req.params.studentId,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    ...data,
  });
  res.status(201).json(m.toJSON());
});

module.exports = router;
