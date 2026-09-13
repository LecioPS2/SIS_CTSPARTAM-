const router = require('express').Router();
const whatsappService = require('../services/whatsapp');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/status', (req, res) => {
  res.json(whatsappService.getStatus());
});

router.post('/start', (req, res) => {
  whatsappService.initialize();
  res.json({ message: 'Inicialização solicitada.' });
});

router.post('/logout', async (req, res) => {
  await whatsappService.logout();
  res.json({ message: 'WhatsApp desconectado.' });
});

module.exports = router;
