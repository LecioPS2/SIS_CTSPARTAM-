const router = require('express').Router();
const whatsappService = require('../services/whatsapp');
const {
  User,
  Automation,
  WhatsAppConfig,
  WhatsAppTemplate,
  WhatsAppMessageLog,
  WhatsAppWebhookEvent,
} = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// ============================================================================
// 1. WEBHOOK OFICIAL DA META (PÚBLICO - AUTENTICADO POR VERIFY_TOKEN E HMAC)
// ============================================================================

/**
 * GET /api/integrations/whatsapp/webhook
 * Verificação inicial do Webhook no painel Meta for Developers
 */
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const env = whatsappService.getEnvCredentials();
    if (!env.verifyToken) {
      return res.status(503).json({
        error: 'WHATSAPP_VERIFY_TOKEN ainda não configurado nas variáveis de ambiente do servidor.',
      });
    }

    if (mode === 'subscribe' && token === env.verifyToken) {
      return res.status(200).send(String(challenge || ''));
    }

    return res.status(403).json({ error: 'Falha na verificação do Webhook: token inválido.' });
  } catch (err) {
    console.error('[WhatsAppWebhook GET] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno na verificação do webhook.' });
  }
});

/**
 * POST /api/integrations/whatsapp/webhook
 * Recebimento de notificações de status (sent, delivered, read, failed) e mensagens recebidas.
 * Valida obrigatoriamente a assinatura HMAC-SHA256 (X-Hub-Signature-256) com o corpo bruto.
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody;

    const isValid = whatsappService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      await WhatsAppWebhookEvent.create({
        eventKey: `invalid_sig:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        eventType: 'signature_rejected',
        status: 'rejected',
        summary: 'Assinatura X-Hub-Signature-256 ausente ou inválida.',
      }).catch(() => {});

      return res.status(401).json({ error: 'Assinatura X-Hub-Signature-256 inválida.' });
    }

    // Responde 200 imediatamente conforme recomendação da Meta e processa
    const result = await whatsappService.processWebhookPayload(req.body);
    return res.status(200).json({ received: true, processed: result.processed });
  } catch (err) {
    console.error('[WhatsAppWebhook POST] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao processar evento do webhook.' });
  }
});

// ============================================================================
// 2. ROTAS ADMINISTRATIVAS PROTEGIDAS (EXCLUSIVAS PARA ADMIN)
// ============================================================================
router.use(requireAuth);
router.use(requireRole('admin'));

// Compatibilidade legada
router.get('/status', async (req, res) => {
  try {
    const sys = await whatsappService.getSystemStatus(`${req.protocol}://${req.get('host')}`);
    res.json({
      ...whatsappService.getStatus(),
      integrationState: sys.integrationState,
      connectedPhoneNumber: sys.connectedPhoneNumber,
      canDispatchLive: sys.canDispatchLive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/integrations/whatsapp/dashboard
 * Retorna indicadores consolidados, status da integração, últimos envios e estimativa de custos
 */
router.get('/dashboard', async (req, res) => {
  try {
    await whatsappService.ensureDefaults();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const systemStatus = await whatsappService.getSystemStatus(baseUrl);

    const [
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
      queuedCount,
      cancelledCount,
      inboundCount,
      costAgg,
      recentLogs,
      recentWebhooks,
      totalStudents,
      optOutStudents,
      automations,
      templates,
    ] = await Promise.all([
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: { $in: ['sent', 'delivered', 'read'] } }),
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: { $in: ['delivered', 'read'] } }),
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: 'read' }),
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: 'failed' }),
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: 'queued' }),
      WhatsAppMessageLog.countDocuments({ direction: 'outbound', status: 'cancelled' }),
      WhatsAppMessageLog.countDocuments({ direction: 'inbound' }),
      WhatsAppMessageLog.aggregate([
        { $match: { direction: 'outbound', status: { $in: ['sent', 'delivered', 'read'] } } },
        { $group: { _id: null, totalBrl: { $sum: '$estimatedCostBrl' } } },
      ]),
      WhatsAppMessageLog.find().sort({ createdAt: -1 }).limit(12),
      WhatsAppWebhookEvent.find().sort({ createdAt: -1 }).limit(10),
      User.countDocuments({ role: 'aluno', active: true }),
      User.countDocuments({ role: 'aluno', active: true, whatsappConsent: false }),
      Automation.find().sort({ createdAt: 1 }),
      WhatsAppTemplate.find().sort({ createdAt: 1 }),
    ]);

    const estimatedCostBrl = costAgg[0]?.totalBrl ? Number(costAgg[0].totalBrl.toFixed(2)) : 0;

    res.json({
      systemStatus,
      metrics: {
        sent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        failed: failedCount,
        queued: queuedCount,
        cancelled: cancelledCount,
        inbound: inboundCount,
        estimatedCostBrl,
        totalStudents,
        optInStudents: Math.max(0, totalStudents - optOutStudents),
        optOutStudents,
      },
      recentLogs: recentLogs.map((l) => l.toJSON()),
      recentWebhooks: recentWebhooks.map((w) => w.toJSON()),
      automations: automations.map((a) => a.toJSON()),
      templates: templates.map((t) => t.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/integrations/whatsapp/config
 */
router.get('/config', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const status = await whatsappService.getSystemStatus(baseUrl);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/integrations/whatsapp/config
 * Atualiza chave geral de envios automáticos no banco e limite diário de segurança
 */
router.put('/config', async (req, res) => {
  try {
    const cfg = await whatsappService.getOrCreateConfig();
    const { enabled, dailyLimit } = req.body;

    if (enabled !== undefined) {
      // Só permite ativar envios reais se as credenciais já tiverem sido validadas
      if (enabled === true && cfg.status !== 'configured') {
        return res.status(400).json({
          error: 'Não é possível ativar os disparos reais antes de configurar e validar a conexão com a API oficial da Meta.',
        });
      }
      cfg.enabled = Boolean(enabled);
    }

    if (dailyLimit !== undefined) {
      const lim = Number(dailyLimit);
      if (!Number.isNaN(lim) && lim >= 10 && lim <= 5000) {
        cfg.dailyLimit = lim;
      }
    }

    await cfg.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const updatedStatus = await whatsappService.getSystemStatus(baseUrl);
    res.json(updatedStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/test-connection
 * Testa a autenticação e conexão com a Graph API da Meta
 */
router.post('/test-connection', async (req, res) => {
  try {
    const result = await whatsappService.testConnection();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const systemStatus = await whatsappService.getSystemStatus(baseUrl);
    res.json({ ...result, systemStatus });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/test-send
 * Envia mensagem de teste para um número autorizado pelo administrador
 */
router.post('/test-send', async (req, res) => {
  try {
    const { phone, templateName = 'hello_world', language = 'pt_BR' } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Informe o número de telefone autorizado para o teste (com DDD).' });
    }

    const result = await whatsappService.enqueueAndDispatch({
      rawPhone: phone,
      automationType: 'test_message',
      messageType: 'template',
      templateName: templateName || 'hello_world',
      templateLanguage: language || 'pt_BR',
      allowTestSend: true,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/integrations/whatsapp/automations
 * Lista todas as automações com prévia renderizada e histórico recente de cada uma
 */
router.get('/automations', async (req, res) => {
  try {
    await whatsappService.ensureDefaults();
    const automations = await Automation.find().sort({ createdAt: 1 });
    const templates = await WhatsAppTemplate.find();

    const enriched = await Promise.all(
      automations.map(async (auto) => {
        const tpl = templates.find((t) => t.name === auto.templateName) || null;
        const recentLogs = await WhatsAppMessageLog.find({ automationType: auto.type })
          .sort({ createdAt: -1 })
          .limit(5);

        const totalSent = await WhatsAppMessageLog.countDocuments({
          automationType: auto.type,
          status: { $in: ['sent', 'delivered', 'read'] },
        });

        const samplePreview = tpl
          ? whatsappService.buildTemplateParameters(tpl, {
              studentName: 'Maria Espartana',
              dueDate: '25/10/2026',
              amount: 200,
              gymName: 'CT Spartan',
              customMessage: 'Lembrete importante sobre seu treino.',
            }).preview
          : whatsappService.renderTextPreview(auto.whatsappMessage, {
              studentName: 'Maria Espartana',
              dueDate: '25/10/2026',
              amount: 200,
              gymName: 'CT Spartan',
              customMessage: 'Lembrete importante sobre seu treino.',
            });

        return {
          ...auto.toJSON(),
          linkedTemplate: tpl ? tpl.toJSON() : null,
          samplePreview,
          totalSent,
          recentLogs: recentLogs.map((l) => l.toJSON()),
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/integrations/whatsapp/automations/:type
 * Atualiza configuração individual de uma automação
 */
router.put('/automations/:type', async (req, res) => {
  try {
    await whatsappService.ensureDefaults();
    const { type } = req.params;
    const {
      active,
      sendApp,
      sendWhatsapp,
      appMessage,
      whatsappMessage,
      templateName,
      templateLanguage,
      daysOffset,
      sendHour,
    } = req.body;

    const auto = await Automation.findOne({ type });
    if (!auto) {
      return res.status(404).json({ error: 'Automação não encontrada.' });
    }

    if (active !== undefined) auto.active = Boolean(active);
    if (sendApp !== undefined) auto.sendApp = Boolean(sendApp);
    if (sendWhatsapp !== undefined) auto.sendWhatsapp = Boolean(sendWhatsapp);
    if (appMessage !== undefined) auto.appMessage = String(appMessage);
    if (whatsappMessage !== undefined) auto.whatsappMessage = String(whatsappMessage);
    if (templateName !== undefined) auto.templateName = String(templateName).trim();
    if (templateLanguage !== undefined) auto.templateLanguage = String(templateLanguage).trim();
    if (daysOffset !== undefined) auto.daysOffset = Math.max(0, Number(daysOffset) || 0);
    if (sendHour !== undefined) auto.sendHour = String(sendHour).trim();

    await auto.save();
    res.json(auto.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/integrations/whatsapp/templates
 */
router.get('/templates', async (req, res) => {
  try {
    await whatsappService.ensureDefaults();
    const list = await WhatsAppTemplate.find().sort({ createdAt: 1 });
    res.json(list.map((t) => t.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/templates
 * Cadastra ou vincula um modelo de mensagem aprovado na Meta e valida parâmetros
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      displayName,
      category = 'UTILITY',
      language = 'pt_BR',
      status = 'DRAFT',
      bodyText,
      headerText = '',
      footerText = '',
      variables = [],
      automationType = '',
    } = req.body;

    if (!name || !displayName || !bodyText) {
      return res.status(400).json({ error: 'Nome técnico, nome de exibição e texto do corpo são obrigatórios.' });
    }

    const cleanName = String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    // Validar correspondência de variáveis {{1}}, {{2}}... no bodyText
    const matches = [...String(bodyText).matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const uniquePlaceholders = [...new Set(matches)].sort((a, b) => a - b);

    for (let i = 0; i < uniquePlaceholders.length; i++) {
      if (uniquePlaceholders[i] !== i + 1) {
        return res.status(400).json({
          error: `Os parâmetros do template devem ser sequenciais começando em {{1}}. Encontrado: {{${uniquePlaceholders[i]}}}.`,
        });
      }
    }

    // Não permitir classificar mensagens claramente promocionais como UTILITY se contiverem termos de promoção sem aviso
    const created = await WhatsAppTemplate.create({
      name: cleanName,
      displayName: String(displayName).trim(),
      category: ['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(category) ? category : 'UTILITY',
      language: String(language).trim() || 'pt_BR',
      status: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status) ? status : 'DRAFT',
      bodyText: String(bodyText).trim(),
      headerText: String(headerText || '').trim(),
      footerText: String(footerText || '').trim(),
      variables: Array.isArray(variables) ? variables : [],
      automationType: String(automationType || '').trim(),
    });

    res.status(201).json(created.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/integrations/whatsapp/templates/:id
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const tpl = await WhatsAppTemplate.findById(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Template não encontrado.' });

    const { displayName, category, language, status, bodyText, headerText, footerText, variables, automationType } = req.body;

    if (displayName !== undefined) tpl.displayName = String(displayName).trim();
    if (category !== undefined && ['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(category)) tpl.category = category;
    if (language !== undefined) tpl.language = String(language).trim();
    if (status !== undefined && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)) tpl.status = status;
    if (bodyText !== undefined) tpl.bodyText = String(bodyText).trim();
    if (headerText !== undefined) tpl.headerText = String(headerText).trim();
    if (footerText !== undefined) tpl.footerText = String(footerText).trim();
    if (Array.isArray(variables)) tpl.variables = variables;
    if (automationType !== undefined) tpl.automationType = String(automationType).trim();

    await tpl.save();
    res.json(tpl.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/integrations/whatsapp/templates/:id
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    await WhatsAppTemplate.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/templates/sync
 * Sincroniza status real dos templates direto da conta Meta WABA
 */
router.post('/templates/sync', async (req, res) => {
  try {
    const result = await whatsappService.syncTemplatesFromMeta();
    const list = await WhatsAppTemplate.find().sort({ createdAt: 1 });
    res.json({ ...result, templates: list.map((t) => t.toJSON()) });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * GET /api/integrations/whatsapp/logs
 * Histórico completo de mensagens com filtros por data, aluna, status e tipo
 */
router.get('/logs', async (req, res) => {
  try {
    const {
      studentId,
      search,
      status,
      automationType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (automationType) filter.automationType = automationType;

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ studentName: regex }, { maskedPhone: regex }, { wamid: regex }, { templateName: regex }];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const [total, items] = await Promise.all([
      WhatsAppMessageLog.countDocuments(filter),
      WhatsAppMessageLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
    ]);

    res.json({
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      items: items.map((i) => i.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/send-individual
 * Envio individual para uma aluna (via Template aprovado ou texto livre na janela de 24h)
 */
router.post('/send-individual', async (req, res) => {
  try {
    const {
      studentId,
      messageType = 'template',
      templateName = 'comunicado_individual_aluna',
      customMessage = '',
      dueDate = '',
      amount = 0,
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Selecione uma aluna para enviar a mensagem.' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Aluna não encontrada.' });
    }

    const result = await whatsappService.enqueueAndDispatch({
      student,
      automationType: 'direct_message',
      messageType,
      templateName,
      textBody: customMessage,
      customMessage,
      dueDate,
      amount,
      bypassAutomationSwitch: true,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/integrations/whatsapp/cron/run
 * Executa (ou simula com dryRun=true) a rotina diária de verificação de vencimentos e aniversários
 */
router.post('/cron/run', async (req, res) => {
  try {
    const dryRun = Boolean(req.body?.dryRun);
    const force = Boolean(req.body?.force);
    const summary = await whatsappService.runDailyAutomations({ dryRun, force });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/integrations/whatsapp/students/:id/consent
 * Atualiza preferência de consentimento LGPD da aluna
 */
router.put('/students/:id/consent', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Aluna não encontrada.' });

    const { whatsappConsent, whatsappMarketingConsent } = req.body;
    if (whatsappConsent !== undefined) {
      student.whatsappConsent = Boolean(whatsappConsent);
      student.whatsappOptOutAt = student.whatsappConsent ? null : new Date();
    }
    if (whatsappMarketingConsent !== undefined) {
      student.whatsappMarketingConsent = Boolean(whatsappMarketingConsent);
    }
    await student.save();

    res.json({
      id: student._id.toString(),
      name: student.name,
      whatsappConsent: student.whatsappConsent,
      whatsappMarketingConsent: student.whatsappMarketingConsent,
      whatsappOptOutAt: student.whatsappOptOutAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
