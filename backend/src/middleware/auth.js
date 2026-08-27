const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function requireAuth(req, res, next) {
  let token = req.cookies?.access_token;
  const header = req.headers.authorization || '';
  if (!token && header.startsWith('Bearer ')) token = header.slice(7);
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_ctspartan_2026_fallback');
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
