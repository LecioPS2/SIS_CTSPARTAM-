const router = require('express').Router();
const { Automation } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('admin'));

// Obter automações
router.get('/', async (req, res) => {
  const automations = await Automation.find({});
  res.json(automations.map(a => a.toJSON()));
});

// Salvar/Atualizar automação
router.put('/:type', async (req, res) => {
  const { active, sendApp, sendWhatsapp, appMessage, whatsappMessage } = req.body;
  const { type } = req.params;

  let auto = await Automation.findOne({ type });
  if (!auto) {
    auto = new Automation({ type });
  }

  auto.active = active !== undefined ? active : auto.active;
  auto.sendApp = sendApp !== undefined ? sendApp : auto.sendApp;
  auto.sendWhatsapp = sendWhatsapp !== undefined ? sendWhatsapp : auto.sendWhatsapp;
  auto.appMessage = appMessage !== undefined ? appMessage : auto.appMessage;
  auto.whatsappMessage = whatsappMessage !== undefined ? whatsappMessage : auto.whatsappMessage;

  await auto.save();
  res.json(auto.toJSON());
});

module.exports = router;
