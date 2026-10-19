import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  StatCard,
  PageHeader,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Modal,
  Th,
  Td,
} from '../../components/ui';
import {
  MessageSquare,
  Settings,
  Bot,
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  RefreshCw,
  Copy,
  ShieldCheck,
  Clock,
  FileText,
  Plus,
  Play,
  Lock,
  Smartphone,
  DollarSign,
  Eye,
  Save,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const AUTOMATION_LABELS = {
  payment_due_soon: 'Aviso de Vencimento',
  payment_overdue: 'Mensalidade Vencida',
  payment_confirmed: 'Confirmação de Pagamento',
  welcome_student: 'Boas-vindas Aluna',
  birthday: 'Felicitação de Aniversário',
  direct_message: 'Comunicação Individual',
  test_message: 'Envio de Teste',
  inbound_reply: 'Resposta Recebida',
  manual: 'Disparo Manual',
};

const STATUS_BADGE = {
  queued: { color: 'warn', label: 'Na Fila' },
  sent: { color: 'accent', label: 'Enviada' },
  delivered: { color: 'ok', label: 'Entregue' },
  read: { color: 'ok', label: 'Lida' },
  failed: { color: 'danger', label: 'Falha' },
  cancelled: { color: 'muted', label: 'Bloqueada / Pendente' },
};

const TEMPLATE_STATUS_BADGE = {
  APPROVED: { color: 'ok', label: 'Aprovado na Meta' },
  PENDING: { color: 'warn', label: 'Em Análise' },
  REJECTED: { color: 'danger', label: 'Rejeitado' },
  DRAFT: { color: 'muted', label: 'Rascunho Local' },
};

const VARIABLE_OPTIONS = [
  { key: 'student_name', label: 'Primeiro Nome da Aluna' },
  { key: 'student_full_name', label: 'Nome Completo da Aluna' },
  { key: 'due_date', label: 'Data de Vencimento' },
  { key: 'amount', label: 'Valor da Mensalidade (R$)' },
  { key: 'gym_name', label: 'Nome da Academia (CT Spartan)' },
  { key: 'payment_link', label: 'Link de Pagamento' },
  { key: 'custom_message', label: 'Mensagem Personalizada' },
];

function formatDateTimeBr(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CentralWhatsApp({ initialTab = 'dashboard' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);

  // Logs filter state
  const [logsData, setLogsData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [logFilters, setLogFilters] = useState({
    search: '',
    studentId: '',
    status: '',
    automationType: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  // Modals & action states
  const [testingConn, setTestingConn] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [testSendModal, setTestSendModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testTemplate, setTestTemplate] = useState('hello_world');
  const [sendingTest, setSendingTest] = useState(false);

  // Individual message state
  const [indivModal, setIndivModal] = useState(false);
  const [indivForm, setIndivForm] = useState({
    studentId: '',
    messageType: 'template',
    templateName: 'comunicado_individual_aluna',
    customMessage: '',
  });
  const [sendingIndiv, setSendingIndiv] = useState(false);

  // Template Manager modal
  const [tplModal, setTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [tplForm, setTplForm] = useState({
    name: '',
    displayName: '',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'DRAFT',
    automationType: '',
    bodyText: 'Olá, {{1}}! Sua mensalidade na {{2}} vence em {{3}}. Valor: R$ {{4}}.',
    variables: [
      { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
      { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
      { index: 3, key: 'due_date', label: 'Data de Vencimento', example: '25/10/2026' },
      { index: 4, key: 'amount', label: 'Valor', example: '200,00' },
    ],
  });

  // Dry-run simulation modal
  const [dryRunResult, setDryRunResult] = useState(null);
  const [runningCron, setRunningCron] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, autoRes, tplRes, stuRes] = await Promise.all([
        api.get('/integrations/whatsapp/dashboard'),
        api.get('/integrations/whatsapp/automations'),
        api.get('/integrations/whatsapp/templates'),
        api.get('/users?role=aluno'),
      ]);
      setDashboard(dashRes.data);
      setAutomations(autoRes.data || []);
      setTemplates(tplRes.data || []);
      setStudents(stuRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao carregar Central WhatsApp.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (filtersToUse) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          params.set(k, v);
        }
      });
      const res = await api.get(`/integrations/whatsapp/logs?${params.toString()}`);
      setLogsData(res.data);
    } catch (err) {
      toast.error('Erro ao carregar histórico de mensagens.');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab === 'historico') {
      loadLogs(logFilters);
    }
  }, [activeTab, logFilters, loadLogs]);

  const sys = dashboard?.systemStatus || {};
  const metrics = dashboard?.metrics || {};

  const renderIntegrationBadge = () => {
    if (sys.integrationState === 'configured') {
      return <Badge color="ok">Configurada e Validada</Badge>;
    }
    if (sys.integrationState === 'error') {
      return <Badge color="danger">Com Erro de Conexão</Badge>;
    }
    if (sys.integrationState === 'pending_validation') {
      return <Badge color="warn">Aguardando Teste de Conexão</Badge>;
    }
    return <Badge color="warn">Configuração Pendente</Badge>;
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    try {
      const res = await api.post('/integrations/whatsapp/test-connection');
      if (res.data.ok) {
        toast.success(`Conexão validada! Número oficial: ${res.data.connectedPhoneNumber || 'Conectado'}`);
      } else {
        toast.warning(res.data.message || 'Credenciais ainda pendentes ou inválidas.');
      }
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao testar conexão com a API da Meta.');
    } finally {
      setTestingConn(false);
    }
  };

  const handleToggleMasterSwitch = async (nextVal) => {
    try {
      await api.put('/integrations/whatsapp/config', { enabled: nextVal });
      toast.success(nextVal ? 'Envios automáticos habilitados no painel.' : 'Envios automáticos desativados.');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível alterar o status de envio.');
    }
  };

  const handleUpdateDailyLimit = async (limitVal) => {
    try {
      await api.put('/integrations/whatsapp/config', { dailyLimit: Number(limitVal) });
      toast.success('Limite diário atualizado.');
      await loadAll();
    } catch (err) {
      toast.error('Erro ao salvar limite diário.');
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return toast.error('Informe o telefone autorizado.');
    setSendingTest(true);
    try {
      const res = await api.post('/integrations/whatsapp/test-send', {
        phone: testPhone,
        templateName: testTemplate,
      });
      if (res.data.ok) {
        toast.success(`Mensagem de teste enviada! WAMID: ${res.data.wamid}`);
        setTestSendModal(false);
      } else {
        toast.warning(res.data.reason || 'Envio registrado como bloqueado (integração pendente).');
      }
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar envio de teste.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveAutomation = async (auto) => {
    try {
      await api.put(`/integrations/whatsapp/automations/${auto.type}`, {
        active: auto.active,
        sendApp: auto.sendApp,
        sendWhatsapp: auto.sendWhatsapp,
        appMessage: auto.appMessage,
        whatsappMessage: auto.whatsappMessage,
        templateName: auto.templateName,
        templateLanguage: auto.templateLanguage,
        daysOffset: auto.daysOffset,
        sendHour: auto.sendHour,
      });
      toast.success(`Automação "${auto.name}" salva com sucesso!`);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar automação.');
    }
  };

  const updateLocalAuto = (type, patch) => {
    setAutomations((prev) => prev.map((a) => (a.type === type ? { ...a, ...patch } : a)));
  };

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const res = await api.post('/integrations/whatsapp/templates/sync');
      if (res.data.ok) {
        toast.success(`${res.data.syncedCount} modelo(s) sincronizados com a conta da Meta!`);
        await loadAll();
      } else {
        toast.warning(res.data.message || 'Configure as credenciais da Meta para sincronizar.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao sincronizar templates.');
    } finally {
      setSyncingTemplates(false);
    }
  };

  const openNewTemplateModal = () => {
    setEditingTpl(null);
    setTplForm({
      name: '',
      displayName: '',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'DRAFT',
      automationType: '',
      bodyText: 'Olá, {{1}}! Sua mensalidade da {{2}} vence em {{3}}. Valor: R$ {{4}}.',
      variables: [
        { index: 1, key: 'student_name', label: 'Nome da Aluna', example: 'Maria' },
        { index: 2, key: 'gym_name', label: 'Nome da Academia', example: 'CT Spartan' },
        { index: 3, key: 'due_date', label: 'Data de Vencimento', example: '25/10/2026' },
        { index: 4, key: 'amount', label: 'Valor', example: '200,00' },
      ],
    });
    setTplModal(true);
  };

  const openEditTemplateModal = (tpl) => {
    setEditingTpl(tpl);
    setTplForm({
      name: tpl.name,
      displayName: tpl.displayName,
      category: tpl.category || 'UTILITY',
      language: tpl.language || 'pt_BR',
      status: tpl.status || 'DRAFT',
      automationType: tpl.automationType || '',
      bodyText: tpl.bodyText || '',
      variables: Array.isArray(tpl.variables) ? tpl.variables : [],
    });
    setTplModal(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTpl) {
        await api.put(`/integrations/whatsapp/templates/${editingTpl.id}`, tplForm);
        toast.success('Modelo atualizado!');
      } else {
        await api.post('/integrations/whatsapp/templates', tplForm);
        toast.success('Novo modelo cadastrado!');
      }
      setTplModal(false);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar modelo.');
    }
  };

  const handleSendIndividual = async (e) => {
    e.preventDefault();
    if (!indivForm.studentId) return toast.error('Selecione uma aluna.');
    setSendingIndiv(true);
    try {
      const res = await api.post('/integrations/whatsapp/send-individual', indivForm);
      if (res.data.ok) {
        toast.success('Mensagem enviada com sucesso pela Cloud API!');
        setIndivModal(false);
      } else {
        toast.warning(res.data.reason || 'Registro criado, porém envio real está desativado.');
        setIndivModal(false);
      }
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Falha ao enviar comunicação individual.');
    } finally {
      setSendingIndiv(false);
    }
  };

  const handleRunDailyCheck = async (dryRun = true) => {
    setRunningCron(true);
    try {
      const res = await api.post('/integrations/whatsapp/cron/run', { dryRun, force: true });
      setDryRunResult(res.data);
      if (dryRun) {
        toast.success('Simulação de elegibilidade concluída!');
      } else {
        toast.success('Verificação diária executada!');
        await loadAll();
      }
    } catch (err) {
      toast.error('Erro ao executar rotina de verificação.');
    } finally {
      setRunningCron(false);
    }
  };

  const copyToClipboard = (text, label = 'Copiado!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="fade-up space-y-6">
      <PageHeader
        title="Central WhatsApp"
        subtitle="Integração Oficial Meta WhatsApp Business Cloud API • Comunicação transacional e financeira"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {renderIntegrationBadge()}
            <Button variant="secondary" onClick={() => setIndivModal(true)} data-testid="btn-individual-wa">
              <Send size={14} className="inline mr-2" />
              Comunicação Individual
            </Button>
            <Button onClick={() => setTestSendModal(true)} data-testid="btn-test-send-wa">
              <Smartphone size={14} className="inline mr-2" />
              Mensagem de Teste
            </Button>
          </div>
        }
      />

      {/* Aviso de Modo de Configuração Pendente */}
      {sys.integrationState !== 'configured' && (
        <div className="bg-warn/10 border border-warn/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warn shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Modo de Configuração Pendente — Nenhum envio real será disparado sem validação
              </p>
              <p className="text-xs text-muted mt-1">
                A estrutura oficial da Meta Cloud API está pronta. Assim que você cadastrar as variáveis de ambiente (
                <code className="text-warn">WHATSAPP_ACCESS_TOKEN</code>,{' '}
                <code className="text-warn">WHATSAPP_PHONE_NUMBER_ID</code>,{' '}
                <code className="text-warn">WHATSAPP_BUSINESS_ACCOUNT_ID</code> e{' '}
                <code className="text-warn">WHATSAPP_APP_SECRET</code>) na Hostinger, clique em{' '}
                <strong className="text-white">Testar Conexão</strong> na aba Configurações.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setActiveTab('configuracoes')} className="shrink-0">
            Ver Passo a Passo
          </Button>
        </div>
      )}

      {/* Navegação de Abas */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: MessageSquare },
          { id: 'configuracoes', label: 'Configurações & Webhook', icon: Settings },
          { id: 'automacoes', label: 'Automações & Modelos', icon: Bot },
          { id: 'historico', label: 'Histórico de Envios', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`wa-tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                active
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-card text-muted hover:text-white border border-line'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && !dashboard ? (
        <Card className="p-8 text-center text-muted">Carregando dados da Central WhatsApp...</Card>
      ) : null}

      {/* =====================================================================
          ABA 1: DASHBOARD
      ===================================================================== */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Cards de Status Superior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Situação da Integração</p>
                <div className="mt-2">{renderIntegrationBadge()}</div>
                <p className="text-xs text-muted mt-2">
                  Chave Geral:{' '}
                  <strong className={sys.canDispatchLive ? 'text-ok' : 'text-warn'}>
                    {sys.canDispatchLive ? 'Envios Ativos' : 'Envios Pausados (Seguro)'}
                  </strong>
                </p>
              </div>
              <ShieldCheck size={34} className={sys.integrationState === 'configured' ? 'text-ok' : 'text-warn'} />
            </Card>

            <Card className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Número Oficial Conectado</p>
                <p className="font-display text-2xl mt-1 text-white">
                  {sys.connectedPhoneNumber || 'Não conectado'}
                </p>
                <p className="text-xs text-muted mt-1">
                  {sys.verifiedName
                    ? `${sys.verifiedName} • Qualidade: ${sys.qualityRating || 'N/A'}`
                    : 'Aguardando validação do Phone Number ID'}
                </p>
              </div>
              <Smartphone size={34} className="text-accent" />
            </Card>

            <Card className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Estimativa de Gastos (Meta)</p>
                <p className="font-display text-2xl mt-1 text-white">
                  R$ {Number(metrics.estimatedCostBrl || 0).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted mt-1">
                  Alunas c/ Consentimento LGPD: <strong className="text-ok">{metrics.optInStudents || 0}</strong> de{' '}
                  {metrics.totalStudents || 0}
                </p>
              </div>
              <DollarSign size={34} className="text-ok" />
            </Card>
          </div>

          {/* Contadores de Mensagens */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Mensagens Enviadas"
              value={metrics.sent || 0}
              subtext="Disparadas via Cloud API"
              icon={Send}
              accent
            />
            <StatCard
              label="Mensagens Entregues"
              value={metrics.delivered || 0}
              subtext="Confirmadas pelo Webhook"
              icon={CheckCircle2}
            />
            <StatCard
              label="Mensagens Lidas"
              value={metrics.read || 0}
              subtext="Visualizadas pelas alunas"
              icon={Eye}
            />
            <StatCard
              label="Mensagens com Falha"
              value={metrics.failed || 0}
              subtext={`${metrics.cancelled || 0} retidas por segurança`}
              icon={XCircle}
            />
          </div>

          {/* Últimos Envios e Eventos de Webhook */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl uppercase">Histórico dos Últimos Envios</h3>
                  <p className="text-xs text-muted">Acompanhe os disparos recentes e respostas recebidas</p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab('historico')}>
                  Ver Tudo
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <Th>Aluna</Th>
                      <Th>Telefone</Th>
                      <Th>Tipo</Th>
                      <Th>Data/Hora</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard.recentLogs || []).length === 0 ? (
                      <tr>
                        <Td colSpan={5} className="text-center text-muted py-8">
                          Nenhum disparo registrado até o momento.
                        </Td>
                      </tr>
                    ) : (
                      dashboard.recentLogs.map((log) => {
                        const st = STATUS_BADGE[log.status] || { color: 'muted', label: log.status };
                        return (
                          <tr key={log.id} className="border-b border-line/60 hover:bg-surface/40">
                            <Td className="font-medium text-white">{log.studentName || '—'}</Td>
                            <Td className="text-muted font-mono text-xs">{log.maskedPhone || '—'}</Td>
                            <Td className="text-xs">{AUTOMATION_LABELS[log.automationType] || log.automationType}</Td>
                            <Td className="text-xs text-muted">{formatDateTimeBr(log.createdAt)}</Td>
                            <Td>
                              <Badge color={st.color}>{st.label}</Badge>
                            </Td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl uppercase">Agendador Diário</h3>
                  <p className="text-xs text-muted">Rotina automática de vencimentos e aniversários</p>
                </div>
                <Clock size={20} className="text-accent" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-surface p-3 rounded-lg border border-line flex justify-between">
                  <span className="text-muted">Última verificação diária:</span>
                  <strong className="text-white">{sys.lastDailyRunDate || 'Ainda não executada hoje'}</strong>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-line flex justify-between">
                  <span className="text-muted">Último evento Webhook:</span>
                  <strong className="text-white">{formatDateTimeBr(sys.lastWebhookAt)}</strong>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={runningCron}
                    onClick={() => handleRunDailyCheck(true)}
                  >
                    <Play size={14} className="inline mr-2" />
                    {runningCron ? 'Consultando...' : 'Simular Elegíveis de Hoje (Dry-Run)'}
                  </Button>
                </div>

                {dryRunResult && (
                  <div className="bg-surface/80 border border-line rounded-lg p-3 mt-3 space-y-1.5">
                    <p className="font-bold text-white uppercase text-[11px]">
                      Resultado da Simulação ({dryRunResult.date}):
                    </p>
                    <p className="text-muted">
                      • Vencendo em breve: <strong className="text-white">{dryRunResult.dueSoonEligible}</strong> aluna(s)
                    </p>
                    <p className="text-muted">
                      • Mensalidades vencidas: <strong className="text-white">{dryRunResult.overdueEligible}</strong> aluna(s)
                    </p>
                    <p className="text-muted">
                      • Aniversariantes hoje: <strong className="text-white">{dryRunResult.birthdayEligible}</strong> aluna(s)
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: CONFIGURAÇÕES & WEBHOOK
      ===================================================================== */}
      {activeTab === 'configuracoes' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Credenciais e Teste de Conexão */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-display text-xl uppercase">Status e Credenciais do Servidor</h3>
                <p className="text-xs text-muted">
                  Credenciais armazenadas exclusivamente no backend (.env) por segurança
                </p>
              </div>
              <Lock size={20} className="text-accent" />
            </div>

            <div className="space-y-2.5">
              {Object.entries(sys.credentialsSummary || {}).map(([envKey, info]) => (
                <div
                  key={envKey}
                  className="flex items-center justify-between bg-surface px-3.5 py-2.5 rounded-lg border border-line"
                >
                  <div>
                    <p className="font-mono text-xs text-white font-semibold">{envKey}</p>
                    <p className="text-[11px] text-muted">Valor: {info.preview}</p>
                  </div>
                  {info.configured ? (
                    <Badge color="ok">Definido</Badge>
                  ) : (
                    <Badge color="warn">Pendente</Badge>
                  )}
                </div>
              ))}
            </div>

            {sys.lastError && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-xs text-danger">
                <strong>Último alerta reportado:</strong> {sys.lastError}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleTestConnection} disabled={testingConn} data-testid="btn-test-meta-connection">
                <RefreshCw size={14} className={`inline mr-2 ${testingConn ? 'animate-spin' : ''}`} />
                {testingConn ? 'Validando na Meta...' : 'Testar Conexão com a API'}
              </Button>
              <Button variant="secondary" onClick={() => setTestSendModal(true)}>
                <Send size={14} className="inline mr-2" />
                Enviar Mensagem de Teste
              </Button>
            </div>
          </Card>

          {/* Coluna Direita: Webhook Oficial e Controle Geral */}
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl uppercase">Webhook Oficial da Meta</h3>
                  <p className="text-xs text-muted">
                    Configure esta URL no painel Meta for Developers → WhatsApp → Configuração
                  </p>
                </div>
                <Badge color={sys.lastWebhookAt ? 'ok' : 'muted'}>
                  {sys.lastWebhookAt ? 'Recebendo Eventos' : 'Aguardando Meta'}
                </Badge>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted block mb-1.5">
                  URL Pública de Callback (HTTPS)
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="https://sistema.ctspartan.com/api/integrations/whatsapp/webhook"
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        'https://sistema.ctspartan.com/api/integrations/whatsapp/webhook',
                        'URL do Webhook copiada!'
                      )
                    }
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>

              <div className="bg-surface p-3.5 rounded-lg border border-line text-xs space-y-1.5">
                <p className="font-semibold text-white">Campos obrigatórios para assinar no Webhook da Meta:</p>
                <p className="text-muted">
                  • <code className="text-ok">messages</code> (Recebe confirmações de enviado, entregue, lido, falhas e respostas das alunas)
                </p>
                <p className="text-muted">
                  • Validação de Segurança: <strong className="text-white">HMAC-SHA256 (X-Hub-Signature-256)</strong> ativo com corpo bruto da requisição.
                </p>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl uppercase">Controle Geral de Disparos</h3>
                  <p className="text-xs text-muted">
                    Proteção contra envios acidentais antes da aprovação final do administrador
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-line">
                <div>
                  <p className="text-sm font-semibold text-white">Ativar Envios Automáticos no Painel</p>
                  <p className="text-xs text-muted">
                    Requer também <code className="text-warn">WHATSAPP_ENABLED=true</code> no servidor e conexão validada
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(sys.dbEnabled)}
                  onChange={(e) => handleToggleMasterSwitch(e.target.checked)}
                  className="w-5 h-5 accent-red-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-line">
                <div>
                  <p className="text-sm font-semibold text-white">Limite Diário de Segurança</p>
                  <p className="text-xs text-muted">Evita disparos acidentais em massa (Academia: ~190 alunas)</p>
                </div>
                <div className="flex items-center gap-2 w-36">
                  <Input
                    type="number"
                    min="10"
                    max="5000"
                    defaultValue={sys.dailyLimit || 250}
                    onBlur={(e) => handleUpdateDailyLimit(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 3: AUTOMAÇÕES & MODELOS (TEMPLATES)
      ===================================================================== */}
      {activeTab === 'automacoes' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-line">
            <div>
              <h3 className="font-display text-xl uppercase">Regras de Automação e Templates da Meta</h3>
              <p className="text-xs text-muted">
                Configure cada gatilho individualmente. Mensagens iniciadas pela academia utilizam obrigatoriamente Templates aprovados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleSyncTemplates} disabled={syncingTemplates}>
                <RefreshCw size={14} className={`inline mr-2 ${syncingTemplates ? 'animate-spin' : ''}`} />
                Sincronizar Status na Meta
              </Button>
              <Button onClick={openNewTemplateModal}>
                <Plus size={14} className="inline mr-2" />
                Novo Modelo (Template)
              </Button>
            </div>
          </div>

          {/* Grid de Automações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {automations.map((auto) => (
              <Card key={auto.type} className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-lg uppercase text-white">{auto.name}</h4>
                        <Badge color={auto.active && auto.sendWhatsapp ? 'ok' : 'muted'}>
                          {auto.active && auto.sendWhatsapp ? 'WhatsApp Ativo' : 'WhatsApp Inativo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{auto.description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(auto.active)}
                        onChange={(e) => updateLocalAuto(auto.type, { active: e.target.checked })}
                        className="w-4 h-4 accent-red-600"
                      />
                      Regra Ativa
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <label className="flex items-center gap-2 bg-surface p-2.5 rounded-lg border border-line text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(auto.sendWhatsapp)}
                        onChange={(e) => updateLocalAuto(auto.type, { sendWhatsapp: e.target.checked })}
                        className="w-4 h-4 accent-red-600"
                      />
                      <span className="text-white font-medium">Disparar no WhatsApp Oficial</span>
                    </label>

                    <label className="flex items-center gap-2 bg-surface p-2.5 rounded-lg border border-line text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(auto.sendApp)}
                        onChange={(e) => updateLocalAuto(auto.type, { sendApp: e.target.checked })}
                        className="w-4 h-4 accent-red-600"
                      />
                      <span className="text-white font-medium">Notificar no App da Aluna</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="sm:col-span-2">
                      <Field label="Modelo (Template Meta Associado)">
                        <Select
                          value={auto.templateName || ''}
                          onChange={(e) => updateLocalAuto(auto.type, { templateName: e.target.value })}
                        >
                          {templates.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.displayName} ({t.name}) - [{t.status}]
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    {(auto.type === 'payment_due_soon' || auto.type === 'payment_overdue') && (
                      <Field
                        label={
                          auto.type === 'payment_due_soon' ? 'Dias antes do venc.' : 'Dias após vencimento'
                        }
                      >
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={auto.daysOffset ?? 3}
                          onChange={(e) => updateLocalAuto(auto.type, { daysOffset: Number(e.target.value) })}
                        />
                      </Field>
                    )}

                    {auto.type !== 'payment_due_soon' && auto.type !== 'payment_overdue' && (
                      <Field label="Horário Preferencial">
                        <Input
                          type="time"
                          value={auto.sendHour || '09:00'}
                          onChange={(e) => updateLocalAuto(auto.type, { sendHour: e.target.value })}
                        />
                      </Field>
                    )}
                  </div>

                  {/* Prévia da Mensagem */}
                  <div className="mt-3 bg-surface/90 border border-line rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                        Prévia da Mensagem no WhatsApp
                      </span>
                      <span className="text-[10px] text-muted">Total enviados: {auto.totalSent || 0}</span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed">{auto.samplePreview || auto.whatsappMessage}</p>
                  </div>

                  {/* Histórico resumido da automação */}
                  {Array.isArray(auto.recentLogs) && auto.recentLogs.length > 0 && (
                    <div className="mt-3 border-t border-line/60 pt-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Últimos Disparos desta Regra:</p>
                      <div className="space-y-1">
                        {auto.recentLogs.slice(0, 2).map((l) => (
                          <div key={l.id} className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              {l.studentName} ({l.maskedPhone})
                            </span>
                            <span>
                              {formatDateTimeBr(l.createdAt)} • <strong>{l.status}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-line flex justify-end">
                  <Button onClick={() => handleSaveAutomation(auto)}>
                    <Save size={14} className="inline mr-2" />
                    Salvar {auto.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Tabela do Gerenciador de Modelos (Templates Meta) */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl uppercase">Gerenciador de Modelos de Mensagem (Meta Templates)</h3>
                <p className="text-xs text-muted">
                  Mapeamento de variáveis exigidas por cada template aprovado na conta WhatsApp Business (WABA)
                </p>
              </div>
              <FileText size={20} className="text-accent" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <Th>Nome Técnico (Meta)</Th>
                    <Th>Descrição</Th>
                    <Th>Categoria</Th>
                    <Th>Idioma</Th>
                    <Th>Variáveis Mapeadas</Th>
                    <Th>Status Real</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => {
                    const badge = TEMPLATE_STATUS_BADGE[tpl.status] || { color: 'muted', label: tpl.status };
                    return (
                      <tr key={tpl.id} className="border-b border-line/60 hover:bg-surface/40">
                        <Td className="font-mono text-xs text-white">{tpl.name}</Td>
                        <Td className="font-medium">{tpl.displayName}</Td>
                        <Td>
                          <Badge color={tpl.category === 'UTILITY' ? 'accent' : 'warn'}>{tpl.category}</Badge>
                        </Td>
                        <Td className="text-xs text-muted">{tpl.language}</Td>
                        <Td className="text-xs text-muted">
                          {(tpl.variables || []).length === 0
                            ? 'Sem variáveis'
                            : tpl.variables.map((v) => `{{${v.index}}} ${v.label}`).join(' • ')}
                        </Td>
                        <Td>
                          <Badge color={badge.color}>{badge.label}</Badge>
                        </Td>
                        <Td>
                          <Button variant="ghost" onClick={() => openEditTemplateModal(tpl)}>
                            Configurar
                          </Button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================================
          ABA 4: HISTÓRICO DE MENSAGENS
      ===================================================================== */}
      {activeTab === 'historico' && (
        <Card className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-display text-xl uppercase">Histórico Completo de Mensagens e Auditoria</h3>
              <p className="text-xs text-muted">
                Números mascarados em conformidade com a LGPD • Rastreamento por identificador oficial WAMID da Meta
              </p>
            </div>
            <Button variant="secondary" onClick={() => loadLogs(logFilters)}>
              <RefreshCw size={14} className="inline mr-2" />
              Atualizar Lista
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Buscar aluna, telefone ou WAMID..."
              value={logFilters.search}
              onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value, page: 1 })}
            />
            <Select
              value={logFilters.studentId}
              onChange={(e) => setLogFilters({ ...logFilters, studentId: e.target.value, page: 1 })}
            >
              <option value="">Todas as Alunas</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select
              value={logFilters.status}
              onChange={(e) => setLogFilters({ ...logFilters, status: e.target.value, page: 1 })}
            >
              <option value="">Todos os Status</option>
              <option value="sent">Enviada</option>
              <option value="delivered">Entregue</option>
              <option value="read">Lida</option>
              <option value="failed">Com Falha</option>
              <option value="cancelled">Retida / Pendente</option>
            </Select>
            <Select
              value={logFilters.automationType}
              onChange={(e) => setLogFilters({ ...logFilters, automationType: e.target.value, page: 1 })}
            >
              <option value="">Todos os Tipos</option>
              {Object.entries(AUTOMATION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={logFilters.startDate}
                onChange={(e) => setLogFilters({ ...logFilters, startDate: e.target.value, page: 1 })}
                title="Data inicial"
              />
              <Input
                type="date"
                value={logFilters.endDate}
                onChange={(e) => setLogFilters({ ...logFilters, endDate: e.target.value, page: 1 })}
                title="Data final"
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <Th>Nome da Aluna</Th>
                  <Th>Número (LGPD)</Th>
                  <Th>Tipo de Mensagem</Th>
                  <Th>Data e Horário</Th>
                  <Th>Status</Th>
                  <Th>ID da Mensagem (Meta)</Th>
                  <Th>Detalhes / Erro</Th>
                </tr>
              </thead>
              <tbody>
                {(logsData.items || []).length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-muted py-10">
                      Nenhum registro encontrado para os filtros selecionados.
                    </Td>
                  </tr>
                ) : (
                  logsData.items.map((item) => {
                    const st = STATUS_BADGE[item.status] || { color: 'muted', label: item.status };
                    return (
                      <tr key={item.id} className="border-b border-line/60 hover:bg-surface/40">
                        <Td className="font-medium text-white">{item.studentName || '—'}</Td>
                        <Td className="font-mono text-xs text-muted">{item.maskedPhone || '—'}</Td>
                        <Td className="text-xs">
                          <span className="block text-white">
                            {AUTOMATION_LABELS[item.automationType] || item.automationType}
                          </span>
                          {item.templateName && (
                            <span className="text-[10px] text-muted font-mono">Template: {item.templateName}</span>
                          )}
                        </Td>
                        <Td className="text-xs text-muted">{formatDateTimeBr(item.createdAt)}</Td>
                        <Td>
                          <Badge color={st.color}>{st.label}</Badge>
                        </Td>
                        <Td className="font-mono text-[11px] text-muted">
                          {item.wamid ? `${item.wamid.slice(0, 18)}...` : '—'}
                        </Td>
                        <Td className="text-xs max-w-xs">
                          {item.errorMessage ? (
                            <span className="text-danger">
                              [{item.errorCode || 'INFO'}] {item.errorMessage}
                            </span>
                          ) : (
                            <span className="text-muted truncate block" title={item.contentPreview}>
                              {item.contentPreview || '—'}
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =====================================================================
          MODAL: ENVIAR MENSAGEM DE TESTE
      ===================================================================== */}
      <Modal
        open={testSendModal}
        onClose={() => setTestSendModal(false)}
        title="Enviar Mensagem de Teste (Meta Cloud API)"
      >
        <form onSubmit={handleSendTest} className="space-y-4">
          <p className="text-xs text-muted">
            Envie um disparo de verificação para um número autorizado na sua conta Meta for Developers (padrão brasileiro com DDD).
          </p>
          <Field label="Número de Destino (ex: 5511999999999)">
            <Input
              placeholder="11999999999"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              required
            />
          </Field>
          <Field label="Modelo de Teste">
            <Select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)}>
              <option value="hello_world">hello_world (Padrão Oficial de Teste da Meta)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.displayName} ({t.name})
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTestSendModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sendingTest}>
              {sendingTest ? 'Processando...' : 'Disparar Teste'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          MODAL: COMUNICAÇÃO INDIVIDUAL COM ALUNA
      ===================================================================== */}
      <Modal
        open={indivModal}
        onClose={() => setIndivModal(false)}
        title="Comunicação Individual com Aluna"
      >
        <form onSubmit={handleSendIndividual} className="space-y-4">
          <Field label="Selecione a Aluna">
            <Select
              value={indivForm.studentId}
              onChange={(e) => setIndivForm({ ...indivForm, studentId: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone || 'Sem telefone'})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo de Envio">
            <Select
              value={indivForm.messageType}
              onChange={(e) => setIndivForm({ ...indivForm, messageType: e.target.value })}
            >
              <option value="template">Modelo Aprovado pela Meta (Recomendado - Qualquer horário)</option>
              <option value="text">Texto Livre (Permitido apenas dentro da janela de 24h após resposta da aluna)</option>
            </Select>
          </Field>

          {indivForm.messageType === 'template' && (
            <Field label="Modelo (Template)">
              <Select
                value={indivForm.templateName}
                onChange={(e) => setIndivForm({ ...indivForm, templateName: e.target.value })}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.displayName} [{t.status}]
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Mensagem / Conteúdo da Variável">
            <Textarea
              rows={3}
              placeholder="Digite o comunicado para a aluna..."
              value={indivForm.customMessage}
              onChange={(e) => setIndivForm({ ...indivForm, customMessage: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIndivModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sendingIndiv}>
              {sendingIndiv ? 'Enviando...' : 'Registrar / Enviar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          MODAL: GERENCIADOR DE TEMPLATE META
      ===================================================================== */}
      <Modal
        open={tplModal}
        onClose={() => setTplModal(false)}
        title={editingTpl ? `Editar Modelo: ${editingTpl.name}` : 'Vincular Novo Modelo da Meta'}
        wide
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome Técnico na Meta (ex: aviso_vencimento_mensalidade)">
              <Input
                value={tplForm.name}
                disabled={Boolean(editingTpl)}
                onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Nome de Exibição no Painel">
              <Input
                value={tplForm.displayName}
                onChange={(e) => setTplForm({ ...tplForm, displayName: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Categoria Oficial">
              <Select
                value={tplForm.category}
                onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })}
              >
                <option value="UTILITY">UTILITY (Utilidade / Financeiro)</option>
                <option value="MARKETING">MARKETING (Promocional)</option>
                <option value="AUTHENTICATION">AUTHENTICATION (Autenticação)</option>
              </Select>
            </Field>
            <Field label="Idioma">
              <Input
                value={tplForm.language}
                onChange={(e) => setTplForm({ ...tplForm, language: e.target.value })}
              />
            </Field>
            <Field label="Status na Conta Meta">
              <Select
                value={tplForm.status}
                onChange={(e) => setTplForm({ ...tplForm, status: e.target.value })}
              >
                <option value="DRAFT">Rascunho (Não Aprovado)</option>
                <option value="PENDING">Em Análise na Meta</option>
                <option value="APPROVED">Aprovado na Meta</option>
                <option value="REJECTED">Rejeitado</option>
              </Select>
            </Field>
          </div>

          <Field label="Corpo do Modelo (Use {{1}}, {{2}}, {{3}} na ordem exigida pela Meta)">
            <Textarea
              rows={3}
              value={tplForm.bodyText}
              onChange={(e) => setTplForm({ ...tplForm, bodyText: e.target.value })}
              required
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted">Mapeamento de Variáveis</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setTplForm({
                    ...tplForm,
                    variables: [
                      ...tplForm.variables,
                      {
                        index: tplForm.variables.length + 1,
                        key: 'student_name',
                        label: `Parâmetro ${tplForm.variables.length + 1}`,
                        example: 'Exemplo',
                      },
                    ],
                  })
                }
              >
                + Adicionar Variável
              </Button>
            </div>
            {tplForm.variables.map((v, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface p-2 rounded border border-line">
                <div className="col-span-2 font-mono text-xs text-accent font-bold text-center">{`{{${v.index}}}`}</div>
                <div className="col-span-5">
                  <Select
                    value={v.key}
                    onChange={(e) => {
                      const opt = VARIABLE_OPTIONS.find((o) => o.key === e.target.value);
                      const next = [...tplForm.variables];
                      next[idx] = { ...v, key: e.target.value, label: opt?.label || v.label };
                      setTplForm({ ...tplForm, variables: next });
                    }}
                  >
                    {VARIABLE_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4">
                  <Input
                    placeholder="Exemplo"
                    value={v.example || ''}
                    onChange={(e) => {
                      const next = [...tplForm.variables];
                      next[idx] = { ...v, example: e.target.value };
                      setTplForm({ ...tplForm, variables: next });
                    }}
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = tplForm.variables
                        .filter((_, i) => i !== idx)
                        .map((item, i) => ({ ...item, index: i + 1 }));
                      setTplForm({ ...tplForm, variables: filtered });
                    }}
                    className="text-danger text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setTplModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Modelo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
