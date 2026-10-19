const crypto = require('crypto');
const {
  User,
  Payment,
  Notice,
  Automation,
  WhatsAppConfig,
  WhatsAppTemplate,
  WhatsAppMessageLog,
  WhatsAppWebhookEvent,
} = require('../models');

// Estimativa média por mensagem na Cloud API (Brasil - valores aproximados em BRL para estimativa no painel)
const COST_ESTIMATE_BRL = {
  UTILITY: 0.04,
  MARKETING: 0.35,
  AUTHENTICATION: 0.16,
  SERVICE: 0.0,
};

const DEFAULT_AUTOMATIONS = [
  {
    type: 'payment_due_soon',
    name: 'Aviso de Vencimento de Mensalidade',
    description: 'Envia lembrete automático antes do vencimento da mensalidade.',
    active: false,
    sendApp: true,
    sendWhatsapp: false,
    daysOffset: 3,
    sendHour: '09:00',
    templateName: 'aviso_vencimento_mensalidade',
    templateLanguage: 'pt_BR',
    appMessage: 'Olá, {{nome}}! Sua mensalidade vence em {{data}} (Valor: R$ {{valor}}).',
    whatsappMessage: 'Olá, {{nome}}! Sua mensalidade da academia CT Spartan vence em {{data}}. Valor: R$ {{valor}}. Esta é uma mensagem automática de lembrete.',
  },
  {
    type: 'payment_overdue',
    name: 'Aviso de Mensalidade Vencida',
    description: 'Envia lembrete após o vencimento para mensalidades ainda em aberto.',
    active: false,
    sendApp: true,
    sendWhatsapp: false,
    daysOffset: 2,
    sendHour: '10:00',
    templateName: 'aviso_mensalidade_vencida',
    templateLanguage: 'pt_BR',
    appMessage: 'Olá, {{nome}}! Identificamos que sua mensalidade com vencimento em {{data}} (R$ {{valor}}) encontra-se em aberto.',
    whatsappMessage: 'Olá, {{nome}}! Identificamos que sua mensalidade da CT Spartan com vencimento em {{data}} (Valor: R$ {{valor}}) ainda consta em aberto. Caso já tenha efetuado o pagamento, desconsidere.',
  },
  {
    type: 'payment_confirmed',
    name: 'Confirmação de Pagamento',
    description: 'Disparada automaticamente quando o pagamento da mensalidade é confirmado no sistema.',
    active: false,
    sendApp: true,
    sendWhatsapp: false,
    daysOffset: 0,
    sendHour: '09:00',
    templateName: 'confirmacao_pagamento',
    templateLanguage: 'pt_BR',
    appMessage: 'Pagamento confirmado! Obrigado, {{nome}}. Sua mensalidade de R$ {{valor}} foi registrada com sucesso.',
    whatsappMessage: 'Olá, {{nome}}! Confirmamos o recebimento da sua mensalidade no valor de R$ {{valor}} referente ao vencimento {{data}}. Obrigado por treinar na CT Spartan!',
  },
  {
    type: 'welcome_student',
    name: 'Mensagem de Boas-vindas',
    description: 'Enviada quando uma nova aluna é cadastrada no sistema.',
    active: false,
    sendApp: true,
    sendWhatsapp: false,
    daysOffset: 0,
    sendHour: '09:00',
    templateName: 'boas_vindas_aluna',
    templateLanguage: 'pt_BR',
    appMessage: 'Bem-vinda à CT Spartan, {{nome}}! Bons treinos!',
    whatsappMessage: 'Seja muito bem-vinda à {{academia}}, {{nome}}! Seu cadastro foi concluído. Acesse o aplicativo para acompanhar seus treinos e sua evolução.',
  },
  {
    type: 'birthday',
    name: 'Felicitação de Aniversário',
    description: 'Envia felicitação no dia do aniversário da aluna.',
    active: false,
    sendApp: true,
    sendWhatsapp: false,
    daysOffset: 0,
    sendHour: '08:00',
    templateName: 'felicitacao_aniversario',
    templateLanguage: 'pt_BR',
    appMessage: 'Feliz Aniversário, {{nome}}! 🎉 A família CT Spartan deseja muitas conquistas e saúde!',
    whatsappMessage: 'Parabéns, {{nome}}! 🎉 A equipe da {{academia}} deseja a você um feliz aniversário, muita saúde, força e grandes conquistas!',
  },
  {
    type: 'direct_message',
    name: 'Comunicação Individual com Alunas',
    description: 'Permite o envio individual para uma aluna específica via template aprovado ou dentro da janela de 24h.',
    active: false,
    sendApp: false,
    sendWhatsapp: false,
    daysOffset: 0,
    sendHour: '09:00',
    templateName: 'comunicado_individual_aluna',
    templateLanguage: 'pt_BR',
    appMessage: '',
    whatsappMessage: 'Olá, {{nome}}! Temos um recado da {{academia}} para você: {{mensagem}}',
  },
];

const DEFAULT_TEMPLATES = [
  {
    name: 'aviso_vencimento_mensalidade',
    displayName: 'Aviso de Vencimento (3 dias antes)',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'payment_due_soon',
    bodyText: 'Olá, {{1}}! Sua mensalidade da academia {{2}} vence em {{3}}. Valor: R$ {{4}}. Esta é uma mensagem automática de lembrete.',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
      { index: 3, key: 'due_date', label: 'Data de Vencimento', example: '25/10/2026' },
      { index: 4, key: 'amount', label: 'Valor da Mensalidade', example: '200,00' },
    ],
  },
  {
    name: 'aviso_mensalidade_vencida',
    displayName: 'Aviso de Mensalidade Vencida',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'payment_overdue',
    bodyText: 'Olá, {{1}}! Identificamos que sua mensalidade da {{2}} com vencimento em {{3}} (Valor: R$ {{4}}) encontra-se em aberto. Caso já tenha pago, desconsidere.',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
      { index: 3, key: 'due_date', label: 'Data de Vencimento', example: '10/10/2026' },
      { index: 4, key: 'amount', label: 'Valor da Mensalidade', example: '200,00' },
    ],
  },
  {
    name: 'confirmacao_pagamento',
    displayName: 'Confirmação de Pagamento',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'payment_confirmed',
    bodyText: 'Olá, {{1}}! Confirmamos o pagamento da sua mensalidade na {{2}} no valor de R$ {{3}} (vencimento {{4}}). Bons treinos!',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
      { index: 3, key: 'amount', label: 'Valor Pago', example: '200,00' },
      { index: 4, key: 'due_date', label: 'Referência/Vencimento', example: '25/10/2026' },
    ],
  },
  {
    name: 'boas_vindas_aluna',
    displayName: 'Boas-vindas Nova Aluna',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'welcome_student',
    bodyText: 'Seja bem-vinda à {{2}}, {{1}}! Seu cadastro está ativo. Acesse nosso aplicativo para acompanhar seus treinos e sua evolução.',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
    ],
  },
  {
    name: 'felicitacao_aniversario',
    displayName: 'Felicitação de Aniversário',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'birthday',
    bodyText: 'Parabéns, {{1}}! A equipe da {{2}} deseja um feliz aniversário, muita saúde, energia e conquistas!',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
    ],
  },
  {
    name: 'comunicado_individual_aluna',
    displayName: 'Comunicação Individual',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: 'direct_message',
    bodyText: 'Olá, {{1}}! Comunicado importante da {{2}}: {{3}}',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
      { index: 3, key: 'custom_message', label: 'Mensagem', example: 'Seu novo treino já está disponível no app.' },
    ],
  },
];

function normalizeBrazilianPhone(raw) {
  if (!raw) return { valid: false, phone: '', masked: '', reason: 'Telefone não informado' };
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  if (!digits.startsWith('55') || (digits.length !== 12 && digits.length !== 13)) {
    return {
      valid: false,
      phone: digits,
      masked: maskPhone(digits),
      reason: 'Formato inválido (esperado DDI 55 + DDD + 8 ou 9 dígitos)',
    };
  }
  const ddd = parseInt(digits.slice(2, 4), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { valid: false, phone: digits, masked: maskPhone(digits), reason: 'DDD brasileiro inválido' };
  }
  return { valid: true, phone: digits, masked: maskPhone(digits), reason: null };
}

function maskPhone(phoneStr) {
  const digits = String(phoneStr || '').replace(/\D/g, '');
  if (digits.length < 8) return digits || '—';
  if (digits.startsWith('55') && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const tail = digits.slice(-4);
    const hasNine = digits.length === 13;
    return `+55 (${ddd}) ${hasNine ? '9' : ''}****-${tail}`;
  }
  return `****-${digits.slice(-4)}`;
}

function formatDateBr(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatAmountBr(val) {
  const num = Number(val || 0);
  return num.toFixed(2).replace('.', ',');
}

function maskCredential(value) {
  if (!value || !String(value).trim()) return { configured: false, preview: 'Não configurado' };
  const s = String(value).trim();
  if (s.length <= 6) return { configured: true, preview: '******' };
  return { configured: true, preview: `${s.slice(0, 3)}••••••${s.slice(-3)}` };
}

class WhatsAppCloudService {
  constructor() {
    this.initializedDefaults = false;
  }

  getEnvCredentials() {
    const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const businessAccountId = (process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '').trim();
    const appSecret = (process.env.WHATSAPP_APP_SECRET || '').trim();
    const verifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || '').trim();
    const apiVersion = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();
    const envEnabled = String(process.env.WHATSAPP_ENABLED || 'false').toLowerCase() === 'true';

    return {
      accessToken,
      phoneNumberId,
      businessAccountId,
      appSecret,
      verifyToken,
      apiVersion,
      envEnabled,
    };
  }

  async ensureDefaults() {
    if (this.initializedDefaults) return;
    try {
      await WhatsAppConfig.findOneAndUpdate(
        { singletonKey: 'default' },
        { $setOnInsert: { singletonKey: 'default', enabled: false, status: 'pending_config', apiVersion: 'v21.0' } },
        { upsert: true, new: true }
      );

      for (const def of DEFAULT_AUTOMATIONS) {
        const existing = await Automation.findOne({ type: def.type });
        if (!existing) {
          await Automation.create(def);
        } else {
          let changed = false;
          if (!existing.name) { existing.name = def.name; changed = true; }
          if (!existing.description) { existing.description = def.description; changed = true; }
          if (!existing.templateName) { existing.templateName = def.templateName; changed = true; }
          if (!existing.whatsappMessage) { existing.whatsappMessage = def.whatsappMessage; changed = true; }
          if (!existing.appMessage && def.appMessage) { existing.appMessage = def.appMessage; changed = true; }
          if (changed) await existing.save();
        }
      }

      for (const tpl of DEFAULT_TEMPLATES) {
        const exists = await WhatsAppTemplate.findOne({ name: tpl.name });
        if (!exists) {
          await WhatsAppTemplate.create(tpl);
        }
      }

      this.initializedDefaults = true;
    } catch (err) {
      console.error('[WhatsAppCloud] Erro ao inicializar padrões:', err.message);
    }
  }

  async getOrCreateConfig() {
    await this.ensureDefaults();
    let cfg = await WhatsAppConfig.findOne({ singletonKey: 'default' });
    if (!cfg) {
      cfg = await WhatsAppConfig.create({ singletonKey: 'default', enabled: false, status: 'pending_config' });
    }
    return cfg;
  }

  async getSystemStatus(baseUrl = '') {
    const env = this.getEnvCredentials();
    const cfg = await this.getOrCreateConfig();

    const missingEnv = [];
    if (!env.accessToken) missingEnv.push('WHATSAPP_ACCESS_TOKEN');
    if (!env.phoneNumberId) missingEnv.push('WHATSAPP_PHONE_NUMBER_ID');
    if (!env.businessAccountId) missingEnv.push('WHATSAPP_BUSINESS_ACCOUNT_ID');
    if (!env.appSecret) missingEnv.push('WHATSAPP_APP_SECRET');
    if (!env.verifyToken) missingEnv.push('WHATSAPP_VERIFY_TOKEN');

    let integrationState = 'pending_config';
    if (missingEnv.length === 0) {
      if (cfg.status === 'configured' && cfg.lastValidatedAt) {
        integrationState = 'configured';
      } else if (cfg.status === 'error') {
        integrationState = 'error';
      } else {
        integrationState = 'pending_validation';
      }
    } else if (cfg.status === 'error') {
      integrationState = 'error';
    }

    const canDispatchLive =
      integrationState === 'configured' &&
      env.envEnabled === true &&
      cfg.enabled === true;

    const cleanBase = baseUrl || 'https://sistema.ctspartan.com';
    const webhookUrl = `${cleanBase.replace(/\/$/, '')}/api/integrations/whatsapp/webhook`;

    return {
      integrationState, // 'pending_config' | 'pending_validation' | 'configured' | 'error'
      canDispatchLive,
      masterSwitchEnabled: Boolean(cfg.enabled && env.envEnabled),
      dbEnabled: Boolean(cfg.enabled),
      envEnabled: Boolean(env.envEnabled),
      connectedPhoneNumber: integrationState === 'configured' ? cfg.connectedPhoneNumber : '',
      verifiedName: integrationState === 'configured' ? cfg.verifiedName : '',
      qualityRating: integrationState === 'configured' ? cfg.qualityRating : '',
      apiVersion: env.apiVersion || cfg.apiVersion || 'v21.0',
      lastValidatedAt: cfg.lastValidatedAt,
      lastWebhookAt: cfg.lastWebhookAt,
      lastDailyRunDate: cfg.lastDailyRunDate,
      lastError: cfg.lastError || '',
      dailyLimit: cfg.dailyLimit || 250,
      webhookUrl,
      missingEnv,
      credentialsSummary: {
        WHATSAPP_ACCESS_TOKEN: maskCredential(env.accessToken),
        WHATSAPP_PHONE_NUMBER_ID: maskCredential(env.phoneNumberId),
        WHATSAPP_BUSINESS_ACCOUNT_ID: maskCredential(env.businessAccountId),
        WHATSAPP_APP_SECRET: maskCredential(env.appSecret),
        WHATSAPP_VERIFY_TOKEN: maskCredential(env.verifyToken),
        WHATSAPP_API_VERSION: { configured: true, preview: env.apiVersion || 'v21.0' },
        WHATSAPP_ENABLED: { configured: true, preview: env.envEnabled ? 'true' : 'false' },
      },
    };
  }

  // Compatibilidade legada com rotas antigas
  getStatus() {
    const env = this.getEnvCredentials();
    const hasCreds = Boolean(env.accessToken && env.phoneNumberId);
    return {
      status: hasCreds && env.envEnabled ? 'CONFIGURED' : 'PENDING_CONFIG',
      provider: 'META_CLOUD_API_OFFICIAL',
      qr: null,
    };
  }

  async graphRequest(endpoint, { method = 'GET', body = null, timeoutMs = 15000, maxRetries = 2 } = {}) {
    const env = this.getEnvCredentials();
    if (!env.accessToken) {
      const err = new Error('WHATSAPP_ACCESS_TOKEN não configurado no servidor.');
      err.code = 'MISSING_CREDENTIALS';
      throw err;
    }

    const url = `https://graph.facebook.com/${env.apiVersion}/${endpoint.replace(/^\//, '')}`;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${env.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          return data;
        }

        const metaErr = data?.error || {};
        const status = res.status;

        // Se for erro 429 (Rate limit) ou 5xx temporário e ainda houver tentativas
        if ((status === 429 || status >= 500) && attempt <= maxRetries) {
          const delayMs = attempt * 1500;
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        const error = new Error(metaErr.message || `Erro HTTP ${status} na Graph API da Meta`);
        error.code = String(metaErr.code || status);
        error.subcode = metaErr.error_subcode;
        error.httpStatus = status;
        throw error;
      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          if (attempt <= maxRetries) continue;
          const timeoutError = new Error('Tempo limite excedido (timeout) ao comunicar com a API da Meta.');
          timeoutError.code = 'TIMEOUT';
          throw timeoutError;
        }
        if (attempt <= maxRetries && !err.httpStatus) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }
        throw err;
      }
    }
  }

  async testConnection() {
    const env = this.getEnvCredentials();
    const cfg = await this.getOrCreateConfig();

    if (!env.accessToken || !env.phoneNumberId) {
      cfg.status = 'pending_config';
      cfg.lastError = 'Credenciais WHATSAPP_ACCESS_TOKEN e/ou WHATSAPP_PHONE_NUMBER_ID ainda não configuradas no ambiente.';
      await cfg.save();
      return {
        ok: false,
        status: 'pending_config',
        message: 'Configuração pendente: adicione WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nas variáveis de ambiente.',
      };
    }

    try {
      const data = await this.graphRequest(
        `${env.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`,
        { method: 'GET', maxRetries: 1 }
      );

      cfg.status = 'configured';
      cfg.connectedPhoneNumber = data.display_phone_number || '';
      cfg.verifiedName = data.verified_name || '';
      cfg.qualityRating = data.quality_rating || '';
      cfg.lastValidatedAt = new Date();
      cfg.lastError = '';
      await cfg.save();

      return {
        ok: true,
        status: 'configured',
        connectedPhoneNumber: cfg.connectedPhoneNumber,
        verifiedName: cfg.verifiedName,
        qualityRating: cfg.qualityRating,
        lastValidatedAt: cfg.lastValidatedAt,
      };
    } catch (err) {
      cfg.status = 'error';
      cfg.lastError = `[${err.code || 'ERR'}] ${err.message}`;
      await cfg.save();
      return {
        ok: false,
        status: 'error',
        errorCode: err.code || 'GRAPH_ERR',
        message: err.message,
      };
    }
  }

  async syncTemplatesFromMeta() {
    const env = this.getEnvCredentials();
    if (!env.accessToken || !env.businessAccountId) {
      return {
        ok: false,
        message: 'Para sincronizar com a Meta, configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID.',
      };
    }

    const data = await this.graphRequest(
      `${env.businessAccountId}/message_templates?fields=name,status,category,language,components,id&limit=100`,
      { method: 'GET', maxRetries: 1 }
    );

    const list = Array.isArray(data?.data) ? data.data : [];
    let syncedCount = 0;

    for (const remote of list) {
      const bodyComp = (remote.components || []).find((c) => c.type === 'BODY');
      const bodyText = bodyComp?.text || '';
      const existing = await WhatsAppTemplate.findOne({ name: remote.name });

      if (existing) {
        existing.status = ['APPROVED', 'PENDING', 'REJECTED'].includes(remote.status) ? remote.status : 'PENDING';
        existing.category = ['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(remote.category) ? remote.category : existing.category;
        existing.language = remote.language || existing.language;
        existing.metaTemplateId = remote.id || existing.metaTemplateId;
        if (bodyText) existing.bodyText = bodyText;
        await existing.save();
      } else {
        await WhatsAppTemplate.create({
          name: remote.name,
          displayName: remote.name.replace(/_/g, ' ').toUpperCase(),
          category: ['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(remote.category) ? remote.category : 'UTILITY',
          language: remote.language || 'pt_BR',
          status: ['APPROVED', 'PENDING', 'REJECTED'].includes(remote.status) ? remote.status : 'PENDING',
          metaTemplateId: remote.id || '',
          bodyText: bodyText || `Template ${remote.name}`,
          variables: [],
        });
      }
      syncedCount++;
    }

    return { ok: true, syncedCount, totalRemote: list.length };
  }

  buildTemplateParameters(template, context = {}) {
    const vars = Array.isArray(template?.variables) ? [...template.variables].sort((a, b) => a.index - b.index) : [];
    const firstName = context.studentName ? String(context.studentName).trim().split(' ')[0] : 'Aluna';
    const mapValue = (key) => {
      switch (key) {
        case 'student_name':
          return firstName;
        case 'student_full_name':
          return context.studentName || firstName;
        case 'due_date':
          return formatDateBr(context.dueDate);
        case 'amount':
          return formatAmountBr(context.amount);
        case 'gym_name':
          return context.gymName || 'CT Spartan';
        case 'payment_link':
          return context.paymentLink || 'https://sistema.ctspartan.com/aluno/mensalidade';
        case 'custom_message':
          return context.customMessage || '';
        default:
          return context[key] || '';
      }
    };

    const params = vars.map((v) => String(mapValue(v.key) || v.example || '—'));
    let preview = template?.bodyText || '';
    params.forEach((val, idx) => {
      preview = preview.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val);
    });

    return { params, preview };
  }

  renderTextPreview(templateText, context = {}) {
    if (!templateText) return '';
    const firstName = context.studentName ? String(context.studentName).trim().split(' ')[0] : 'Aluna';
    return String(templateText)
      .replace(/\{\{?nome\}?\}/gi, firstName)
      .replace(/\{\{?data\}?\}/gi, formatDateBr(context.dueDate))
      .replace(/\{\{?valor\}?\}/gi, formatAmountBr(context.amount))
      .replace(/\{\{?academia\}?\}/gi, context.gymName || 'CT Spartan')
      .replace(/\{\{?mensagem\}?\}/gi, context.customMessage || '');
  }

  /**
   * Enfileira e (se habilitado e validado) dispara mensagem via Cloud API oficial da Meta.
   */
  async enqueueAndDispatch({
    student = null,
    rawPhone = '',
    automationType = 'manual',
    messageType = 'template',
    templateName = '',
    templateLanguage = 'pt_BR',
    customParameters = null,
    textBody = '',
    paymentId = null,
    dueDate = '',
    amount = 0,
    customMessage = '',
    idempotencyKey = null,
    bypassAutomationSwitch = false,
    allowTestSend = false,
  }) {
    await this.ensureDefaults();
    const env = this.getEnvCredentials();
    const cfg = await this.getOrCreateConfig();

    // 1. Checar idempotência
    if (idempotencyKey) {
      const existingLog = await WhatsAppMessageLog.findOne({
        idempotencyKey,
        status: { $in: ['queued', 'sent', 'delivered', 'read'] },
      });
      if (existingLog) {
        return { skipped: true, reason: 'Evento já processado anteriormente (idempotência)', log: existingLog.toJSON() };
      }
    }

    // 2. Validar consentimento LGPD da aluna (exceto envio de teste explícito para número autorizado)
    if (student && !allowTestSend) {
      if (student.whatsappConsent === false || student.whatsappOptOutAt) {
        return { skipped: true, reason: 'Aluna optou por não receber comunicações via WhatsApp (LGPD opt-out)' };
      }
    }

    // 3. Validar se cobrança já foi paga (regra obrigatória financeira)
    if (paymentId && (automationType === 'payment_due_soon' || automationType === 'payment_overdue')) {
      const freshPayment = await Payment.findById(paymentId);
      if (!freshPayment || freshPayment.status === 'pago') {
        return { skipped: true, reason: 'Mensalidade já consta como paga; envio de cobrança cancelado.' };
      }
    }

    // 4. Normalizar telefone no padrão brasileiro DDI 55
    const targetPhoneRaw = rawPhone || student?.phone || '';
    const phoneCheck = normalizeBrazilianPhone(targetPhoneRaw);
    if (!phoneCheck.valid) {
      const failedLog = await WhatsAppMessageLog.create({
        studentId: student?._id || null,
        studentName: student?.name || 'Destinatário',
        phone: phoneCheck.phone || String(targetPhoneRaw || 'N/A'),
        maskedPhone: phoneCheck.masked,
        direction: 'outbound',
        automationType,
        messageType,
        templateName,
        contentPreview: textBody || `Template: ${templateName}`,
        paymentId,
        idempotencyKey,
        status: 'failed',
        errorCode: 'INVALID_PHONE',
        errorMessage: phoneCheck.reason,
        failedAt: new Date(),
      });
      return { ok: false, reason: phoneCheck.reason, log: failedLog.toJSON() };
    }

    // 5. Validar template ou janela de 24h da Meta
    let templateDoc = null;
    let parameters = [];
    let contentPreview = textBody;
    let category = 'UTILITY';

    if (messageType === 'template') {
      templateDoc = await WhatsAppTemplate.findOne({ name: templateName });
      if (!templateDoc && templateName !== 'hello_world') {
        return { ok: false, reason: `Template '${templateName}' não encontrado no gerenciador.` };
      }
      if (templateDoc) {
        category = templateDoc.category || 'UTILITY';
        const built = this.buildTemplateParameters(templateDoc, {
          studentName: student?.name || 'Aluna',
          dueDate,
          amount,
          gymName: 'CT Spartan',
          customMessage,
        });
        parameters = Array.isArray(customParameters) ? customParameters : built.params;
        contentPreview = built.preview;
      } else {
        contentPreview = 'Template de teste oficial Meta: hello_world';
      }
    } else {
      // Mensagem livre: permitida somente dentro da janela de atendimento de 24h da Meta
      const lastInbound = student?.whatsappLastInboundAt ? new Date(student.whatsappLastInboundAt) : null;
      const within24h = lastInbound && (Date.now() - lastInbound.getTime()) <= 24 * 60 * 60 * 1000;
      if (!within24h && !allowTestSend) {
        return {
          ok: false,
          reason: 'Mensagens de texto livre só são permitidas pela Meta dentro da janela de 24h após mensagem recebida da aluna. Utilize um Template aprovado.',
        };
      }
      contentPreview = this.renderTextPreview(textBody, {
        studentName: student?.name || 'Aluna',
        dueDate,
        amount,
        gymName: 'CT Spartan',
        customMessage,
      });
    }

    // 6. Verificar limite diário de segurança
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sentToday = await WhatsAppMessageLog.countDocuments({
      direction: 'outbound',
      status: { $in: ['sent', 'delivered', 'read'] },
      createdAt: { $gte: todayStart },
    });
    if (sentToday >= (cfg.dailyLimit || 250)) {
      return { ok: false, reason: `Limite diário de segurança atingido (${cfg.dailyLimit} mensagens).` };
    }

    // 7. Criar registro na fila persistente
    const log = await WhatsAppMessageLog.create({
      studentId: student?._id || null,
      studentName: student?.name || (allowTestSend ? 'Teste Administrador' : 'Aluna'),
      phone: phoneCheck.phone,
      maskedPhone: phoneCheck.masked,
      direction: 'outbound',
      automationType,
      messageType,
      templateName: messageType === 'template' ? templateName : '',
      templateCategory: category,
      contentPreview,
      parameters,
      paymentId,
      idempotencyKey,
      status: 'queued',
      estimatedCostBrl: COST_ESTIMATE_BRL[category] ?? 0.04,
    });

    // 8. Verificar se o envio real pode ocorrer
    const isConfigured = Boolean(env.accessToken && env.phoneNumberId && cfg.status === 'configured');
    const masterEnabled = Boolean(env.envEnabled && cfg.enabled);

    if (!isConfigured || (!masterEnabled && !allowTestSend)) {
      log.status = 'cancelled';
      log.errorCode = !isConfigured ? 'PENDING_META_CONFIG' : 'DISPATCH_DISABLED';
      log.errorMessage = !isConfigured
        ? 'Integração em modo de configuração pendente (credenciais Meta ainda não validadas).'
        : 'Disparos reais estão desativados na chave geral de segurança.';
      await log.save();
      return {
        ok: false,
        queuedOnly: true,
        reason: log.errorMessage,
        log: log.toJSON(),
      };
    }

    // 9. Verificar se template está aprovado antes do disparo real (exceto hello_world)
    if (messageType === 'template' && templateName !== 'hello_world' && templateDoc?.status !== 'APPROVED') {
      log.status = 'cancelled';
      log.errorCode = 'TEMPLATE_NOT_APPROVED';
      log.errorMessage = `O template '${templateName}' está com status '${templateDoc?.status || 'DRAFT'}' e ainda não foi aprovado pela Meta.`;
      await log.save();
      return {
        ok: false,
        reason: log.errorMessage,
        log: log.toJSON(),
      };
    }

    // 10. Executar envio real na Graph API da Meta
    return this.executeGraphSend(log, { templateLanguage: templateDoc?.language || templateLanguage });
  }

  async executeGraphSend(logDoc, { templateLanguage = 'pt_BR' } = {}) {
    const env = this.getEnvCredentials();

    // Dupla checagem financeira no instante do envio
    if (logDoc.paymentId && (logDoc.automationType === 'payment_due_soon' || logDoc.automationType === 'payment_overdue')) {
      const p = await Payment.findById(logDoc.paymentId);
      if (!p || p.status === 'pago') {
        logDoc.status = 'cancelled';
        logDoc.errorCode = 'ALREADY_PAID';
        logDoc.errorMessage = 'Cancelado antes do disparo: pagamento já confirmado.';
        await logDoc.save();
        return { ok: false, reason: logDoc.errorMessage, log: logDoc.toJSON() };
      }
    }

    let payload;
    if (logDoc.messageType === 'template') {
      const components = [];
      if (Array.isArray(logDoc.parameters) && logDoc.parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: logDoc.parameters.map((text) => ({ type: 'text', text: String(text) })),
        });
      }
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: logDoc.phone,
        type: 'template',
        template: {
          name: logDoc.templateName,
          language: { code: templateLanguage },
          ...(components.length > 0 ? { components } : {}),
        },
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: logDoc.phone,
        type: 'text',
        text: { preview_url: false, body: logDoc.contentPreview },
      };
    }

    try {
      logDoc.attempts = (logDoc.attempts || 0) + 1;
      const response = await this.graphRequest(`${env.phoneNumberId}/messages`, {
        method: 'POST',
        body: payload,
        timeoutMs: 15000,
        maxRetries: 2,
      });

      const wamid = response?.messages?.[0]?.id || '';
      logDoc.wamid = wamid;
      logDoc.status = 'sent';
      logDoc.sentAt = new Date();
      logDoc.errorCode = '';
      logDoc.errorMessage = '';
      await logDoc.save();

      return { ok: true, wamid, log: logDoc.toJSON() };
    } catch (err) {
      logDoc.status = 'failed';
      logDoc.failedAt = new Date();
      logDoc.errorCode = String(err.code || 'SEND_ERROR');
      logDoc.errorMessage = err.message;
      await logDoc.save();

      return { ok: false, errorCode: logDoc.errorCode, reason: err.message, log: logDoc.toJSON() };
    }
  }

  /**
   * Gatilho automático: Confirmação de pagamento
   */
  async triggerPaymentConfirmed(paymentDoc) {
    try {
      await this.ensureDefaults();
      if (!paymentDoc || paymentDoc.type === 'saida' || paymentDoc.status !== 'pago' || !paymentDoc.studentId) return;

      const auto = await Automation.findOne({ type: 'payment_confirmed' });
      if (!auto || !auto.active || !auto.sendWhatsapp) return;

      const student = await User.findById(paymentDoc.studentId);
      if (!student || student.role !== 'aluno' || !student.active) return;

      const idempotencyKey = `payment_confirmed:${paymentDoc._id.toString()}`;
      await this.enqueueAndDispatch({
        student,
        automationType: 'payment_confirmed',
        messageType: 'template',
        templateName: auto.templateName || 'confirmacao_pagamento',
        templateLanguage: auto.templateLanguage || 'pt_BR',
        paymentId: paymentDoc._id,
        dueDate: paymentDoc.dueDate,
        amount: paymentDoc.amount,
        idempotencyKey,
      });
    } catch (err) {
      console.error('[WhatsAppCloud] Erro em triggerPaymentConfirmed:', err.message);
    }
  }

  /**
   * Gatilho automático: Boas-vindas para nova aluna
   */
  async triggerWelcomeStudent(studentDoc) {
    try {
      await this.ensureDefaults();
      if (!studentDoc || studentDoc.role !== 'aluno') return;

      const auto = await Automation.findOne({ type: 'welcome_student' });
      if (!auto || !auto.active) return;

      if (auto.sendApp && auto.appMessage) {
        const msg = this.renderTextPreview(auto.appMessage, { studentName: studentDoc.name, gymName: 'CT Spartan' });
        await Notice.create({
          title: 'Bem-vinda à CT Spartan! 💪',
          message: msg,
          targetRole: 'aluno',
          targetUser: studentDoc._id,
          active: true,
        });
      }

      if (auto.sendWhatsapp) {
        const idempotencyKey = `welcome_student:${studentDoc._id.toString()}`;
        await this.enqueueAndDispatch({
          student: studentDoc,
          automationType: 'welcome_student',
          messageType: 'template',
          templateName: auto.templateName || 'boas_vindas_aluna',
          templateLanguage: auto.templateLanguage || 'pt_BR',
          idempotencyKey,
        });
      }
    } catch (err) {
      console.error('[WhatsAppCloud] Erro em triggerWelcomeStudent:', err.message);
    }
  }

  /**
   * Rotina diária persistente (vencimentos próximos, vencidos e aniversários)
   */
  async runDailyAutomations({ dryRun = false, force = false } = {}) {
    await this.ensureDefaults();
    const cfg = await this.getOrCreateConfig();
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const todayDdMm = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = now.getFullYear();

    if (!dryRun && !force && cfg.lastDailyRunDate === todayIso) {
      return { skipped: true, reason: `Rotina diária já executada em ${todayIso}.` };
    }

    const summary = {
      date: todayIso,
      dryRun,
      dueSoonEligible: 0,
      dueSoonProcessed: 0,
      overdueEligible: 0,
      overdueProcessed: 0,
      birthdayEligible: 0,
      birthdayProcessed: 0,
      items: [],
    };

    // 1. Aviso de vencimento próximo (ex: faltando 3 dias)
    const dueSoonAuto = await Automation.findOne({ type: 'payment_due_soon' });
    const dueOffset = dueSoonAuto?.daysOffset ?? 3;
    const targetDueSoonDate = new Date(now.getTime() + dueOffset * 86400000).toISOString().slice(0, 10);

    const dueSoonPayments = await Payment.find({
      type: 'entrada',
      status: { $ne: 'pago' },
      dueDate: targetDueSoonDate,
    }).populate('studentId');

    for (const p of dueSoonPayments) {
      const student = p.studentId;
      if (!student || !student.active || student.role !== 'aluno') continue;
      summary.dueSoonEligible++;

      if (dryRun) {
        summary.items.push({
          type: 'payment_due_soon',
          studentName: student.name,
          phone: maskPhone(student.phone),
          dueDate: p.dueDate,
          amount: p.amount,
          automationActive: Boolean(dueSoonAuto?.active && dueSoonAuto?.sendWhatsapp),
        });
        continue;
      }

      if (dueSoonAuto?.active && dueSoonAuto?.sendWhatsapp) {
        const idempotencyKey = `payment_due_soon:${p._id.toString()}:${p.dueDate}`;
        await this.enqueueAndDispatch({
          student,
          automationType: 'payment_due_soon',
          messageType: 'template',
          templateName: dueSoonAuto.templateName || 'aviso_vencimento_mensalidade',
          templateLanguage: dueSoonAuto.templateLanguage || 'pt_BR',
          paymentId: p._id,
          dueDate: p.dueDate,
          amount: p.amount,
          idempotencyKey,
        });
        summary.dueSoonProcessed++;
      }
    }

    // 2. Aviso de mensalidade vencida (ex: X dias após vencimento)
    const overdueAuto = await Automation.findOne({ type: 'payment_overdue' });
    const overdueOffset = overdueAuto?.daysOffset ?? 2;
    const targetOverdueDate = new Date(now.getTime() - overdueOffset * 86400000).toISOString().slice(0, 10);

    const overduePayments = await Payment.find({
      type: 'entrada',
      status: { $ne: 'pago' },
      dueDate: targetOverdueDate,
    }).populate('studentId');

    for (const p of overduePayments) {
      const student = p.studentId;
      if (!student || !student.active || student.role !== 'aluno') continue;
      summary.overdueEligible++;

      if (dryRun) {
        summary.items.push({
          type: 'payment_overdue',
          studentName: student.name,
          phone: maskPhone(student.phone),
          dueDate: p.dueDate,
          amount: p.amount,
          automationActive: Boolean(overdueAuto?.active && overdueAuto?.sendWhatsapp),
        });
        continue;
      }

      if (overdueAuto?.active && overdueAuto?.sendWhatsapp) {
        const idempotencyKey = `payment_overdue:${p._id.toString()}:${p.dueDate}`;
        await this.enqueueAndDispatch({
          student,
          automationType: 'payment_overdue',
          messageType: 'template',
          templateName: overdueAuto.templateName || 'aviso_mensalidade_vencida',
          templateLanguage: overdueAuto.templateLanguage || 'pt_BR',
          paymentId: p._id,
          dueDate: p.dueDate,
          amount: p.amount,
          idempotencyKey,
        });
        summary.overdueProcessed++;
      }
    }

    // 3. Aniversariantes do dia
    const bdayAuto = await Automation.findOne({ type: 'birthday' });
    const activeStudents = await User.find({ role: 'aluno', active: true });
    const birthdayStudents = activeStudents.filter((u) => {
      if (!u.birthDate) return false;
      const parts = String(u.birthDate).split('-');
      if (parts.length !== 3) return false;
      return `${parts[2]}/${parts[1]}` === todayDdMm;
    });

    for (const student of birthdayStudents) {
      summary.birthdayEligible++;
      if (dryRun) {
        summary.items.push({
          type: 'birthday',
          studentName: student.name,
          phone: maskPhone(student.phone),
          automationActive: Boolean(bdayAuto?.active && bdayAuto?.sendWhatsapp),
        });
        continue;
      }

      if (bdayAuto?.active) {
        if (bdayAuto.sendApp && bdayAuto.appMessage) {
          const msg = this.renderTextPreview(bdayAuto.appMessage, { studentName: student.name, gymName: 'CT Spartan' });
          const existingNotice = await Notice.findOne({
            targetUser: student._id,
            title: 'Feliz Aniversário! 🎉',
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          });
          if (!existingNotice) {
            await Notice.create({
              title: 'Feliz Aniversário! 🎉',
              message: msg,
              targetRole: 'aluno',
              targetUser: student._id,
              active: true,
            });
          }
        }

        if (bdayAuto.sendWhatsapp) {
          const idempotencyKey = `birthday:${student._id.toString()}:${currentYear}`;
          await this.enqueueAndDispatch({
            student,
            automationType: 'birthday',
            messageType: 'template',
            templateName: bdayAuto.templateName || 'felicitacao_aniversario',
            templateLanguage: bdayAuto.templateLanguage || 'pt_BR',
            idempotencyKey,
          });
          summary.birthdayProcessed++;
        }
      }
    }

    if (!dryRun) {
      cfg.lastDailyRunDate = todayIso;
      await cfg.save();
    }

    return summary;
  }

  /**
   * Validação de assinatura HMAC-SHA256 da Meta (X-Hub-Signature-256)
   */
  verifyWebhookSignature(rawBodyBuffer, signatureHeader) {
    const env = this.getEnvCredentials();
    if (!env.appSecret || !signatureHeader || !rawBodyBuffer) return false;

    const [algo, receivedHash] = String(signatureHeader).split('=');
    if (algo !== 'sha256' || !receivedHash) return false;

    const expectedHash = crypto
      .createHmac('sha256', env.appSecret)
      .update(rawBodyBuffer)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(receivedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Busca aluna pelo número de telefone do WhatsApp (comparando sufixo de 8 dígitos + DDD)
   */
  async findStudentByPhone(waId) {
    const digits = String(waId || '').replace(/\D/g, '');
    if (digits.length < 8) return null;
    const last8 = digits.slice(-8);
    const candidates = await User.find({ role: 'aluno' });
    return (
      candidates.find((u) => {
        const uDigits = String(u.phone || '').replace(/\D/g, '');
        return uDigits.length >= 8 && uDigits.slice(-8) === last8;
      }) || null
    );
  }

  /**
   * Processa payload de Webhook oficial da Meta (status de entrega/leitura/falha e mensagens recebidas)
   */
  async processWebhookPayload(body) {
    await this.ensureDefaults();
    if (!body || body.object !== 'whatsapp_business_account') {
      return { processed: 0 };
    }

    const cfg = await this.getOrCreateConfig();
    cfg.lastWebhookAt = new Date();
    await cfg.save();

    let processed = 0;
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value || {};

        // 1. Atualizações de status (sent, delivered, read, failed)
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const st of statuses) {
          const wamid = st.id || '';
          const statusName = st.status || '';
          const timestamp = st.timestamp ? new Date(Number(st.timestamp) * 1000) : new Date();
          const recipientId = st.recipient_id || '';
          const eventKey = `status:${wamid}:${statusName}:${st.timestamp || ''}`;

          const alreadyExists = await WhatsAppWebhookEvent.findOne({ eventKey });
          if (alreadyExists) continue;

          const errInfo = Array.isArray(st.errors) && st.errors[0] ? st.errors[0] : null;
          await WhatsAppWebhookEvent.create({
            eventKey,
            eventType: 'status_update',
            wamid,
            phone: maskPhone(recipientId),
            status: statusName,
            summary: errInfo ? `[${errInfo.code}] ${errInfo.title || errInfo.message || ''}` : `Status atualizado para ${statusName}`,
          });

          if (wamid) {
            const log = await WhatsAppMessageLog.findOne({ wamid });
            if (log) {
              const rank = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4, cancelled: 4 };
              if (statusName === 'failed' || (rank[statusName] ?? 0) >= (rank[log.status] ?? 0)) {
                log.status = ['sent', 'delivered', 'read', 'failed'].includes(statusName) ? statusName : log.status;
              }
              if (statusName === 'sent' && !log.sentAt) log.sentAt = timestamp;
              if (statusName === 'delivered' && !log.deliveredAt) log.deliveredAt = timestamp;
              if (statusName === 'read' && !log.readAt) log.readAt = timestamp;
              if (statusName === 'failed') {
                log.failedAt = timestamp;
                if (errInfo) {
                  log.errorCode = String(errInfo.code || '');
                  log.errorMessage = errInfo.title || errInfo.message || 'Falha reportada pela Meta';
                }
              }
              await log.save();
            }
          }
          processed++;
        }

        // 2. Mensagens recebidas das alunas (Inbound)
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const msg of messages) {
          const wamid = msg.id || '';
          const fromPhone = msg.from || '';
          const eventKey = `inbound:${wamid}`;

          const alreadyExists = await WhatsAppWebhookEvent.findOne({ eventKey });
          if (alreadyExists) continue;

          const textBody = msg.text?.body || `[Mídia/Interação: ${msg.type || 'unknown'}]`;
          const student = await this.findStudentByPhone(fromPhone);

          if (student) {
            student.whatsappLastInboundAt = new Date();
            const upper = textBody.trim().toUpperCase();
            if (['PARAR', 'SAIR', 'STOP', 'CANCELAR RECEBIMENTO'].includes(upper)) {
              student.whatsappConsent = false;
              student.whatsappOptOutAt = new Date();
            } else if ([' INICIAR', 'INICIAR', 'VOLTAR', 'START'].includes(upper)) {
              student.whatsappConsent = true;
              student.whatsappOptOutAt = null;
            }
            await student.save();
          }

          await WhatsAppWebhookEvent.create({
            eventKey,
            eventType: 'inbound_message',
            wamid,
            phone: maskPhone(fromPhone),
            status: 'received',
            summary: `Mensagem recebida de ${student?.name || maskPhone(fromPhone)}`,
          });

          await WhatsAppMessageLog.create({
            studentId: student?._id || null,
            studentName: student?.name || 'Contato Recebido',
            phone: fromPhone,
            maskedPhone: maskPhone(fromPhone),
            direction: 'inbound',
            automationType: 'inbound_reply',
            messageType: 'text',
            contentPreview: textBody.slice(0, 300),
            wamid,
            status: 'delivered',
            deliveredAt: new Date(),
            estimatedCostBrl: 0,
          });
          processed++;
        }
      }
    }

    return { processed };
  }
}

module.exports = new WhatsAppCloudService();
module.exports.normalizeBrazilianPhone = normalizeBrazilianPhone;
module.exports.maskPhone = maskPhone;
