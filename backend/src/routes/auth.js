const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { requireAuth } = require('../middleware/auth');

const attempts = new Map();

function createToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET || 'supersecret_ctspartan_2026_fallback', { expiresIn: '7d' });
}

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const password = req.body.password || '';
  const key = `${req.ip}:${email}`;
  const rec = attempts.get(key);
  if (rec && rec.count >= 5 && Date.now() - rec.last < 15 * 60 * 1000) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
  }
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    attempts.set(key, { count: (rec?.count || 0) + 1, last: Date.now() });
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }
  if (!user.active) return res.status(403).json({ error: 'Conta desativada. Fale com a academia.' });
  attempts.delete(key);
  const token = createToken(user);
  res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000, path: '/' });
  res.json({ token, user: user.toJSON() });
});

router.post('/logout', (req, res) => {
  res.clearCookie('access_token', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const userData = req.user.toJSON();
  
  // Check if student has overdue payments (1 day past due)
  if (req.user.role === 'aluno') {
    const { Payment } = require('../models');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    const overduePayment = await Payment.findOne({
      studentId: req.user._id,
      type: 'entrada',
      status: { $in: ['pendente', 'atrasado'] },
      dueDate: { $lte: yesterdayStr }
    });
    
    userData.isBlocked = !!overduePayment;
  }
  
  res.json(userData);
});

module.exports = router;
