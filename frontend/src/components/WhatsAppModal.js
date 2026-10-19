import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Select, Textarea, Field, Badge } from './ui';
import api from '../lib/api';
import { toast } from 'sonner';
import { Search, Send, CheckSquare, Square, Users, Settings, ShieldAlert } from 'lucide-react';

export default function WhatsAppModal({ open, onClose }) {
  const navigate = useNavigate();
  const [alunas, setAlunas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [templateName, setTemplateName] = useState('comunicado_individual_aluna');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/users?role=aluno').then((r) => setAlunas(r.data || [])).catch(() => {});
      api.get('/integrations/whatsapp/templates').then((r) => setTemplates(r.data || [])).catch(() => {});
      api.get('/integrations/whatsapp/config').then((r) => setSysStatus(r.data)).catch(() => {});
      setSelected(new Set());
      setMessage('');
      setSearch('');
    }
  }, [open]);

  const filtered = alunas.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 15) {
        toast.warning('Por segurança contra disparos acidentais em massa, selecione no máximo 15 alunas por vez.');
        return;
      }
      next.add(id);
    }
    setSelected(next);
  };

  const handleSend = async () => {
    if (selected.size === 0) return toast.error('Selecione pelo menos uma aluna.');
    if (!message.trim()) return toast.error('Digite o comunicado para preencher o template.');

    setSending(true);
    let successCount = 0;
    let blockedCount = 0;

    for (const studentId of Array.from(selected)) {
      try {
        const res = await api.post('/integrations/whatsapp/send-individual', {
          studentId,
          messageType: 'template',
          templateName,
          customMessage: message,
        });
        if (res.data.ok) successCount++;
        else blockedCount++;
      } catch {
        blockedCount++;
      }
    }

    setSending(false);
    if (successCount > 0) {
      toast.success(`${successCount} mensagem(ns) enviada(s) via Meta Cloud API!`);
    } else if (blockedCount > 0) {
      toast.warning(
        'Solicitação registrada no histórico, mas o envio real está retido (Modo de Configuração Pendente / Chave Geral Desativada).'
      );
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Comunicação Rápida (WhatsApp Cloud API Oficial)" wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-surface p-3 rounded-lg border border-line">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert size={16} className={sysStatus?.canDispatchLive ? 'text-ok' : 'text-warn'} />
            <span className="text-muted">Status Cloud API:</span>
            <Badge color={sysStatus?.canDispatchLive ? 'ok' : 'warn'}>
              {sysStatus?.canDispatchLive ? 'Ativa e Validada' : 'Modo Pendente (Envios Reais Pausados)'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              navigate('/admin/whatsapp');
            }}
          >
            <Settings size={14} className="inline mr-1" />
            Abrir Central WhatsApp
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Esquerda: Lista de Alunas */}
          <div className="flex flex-col h-[420px]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <Users size={15} /> Destinatárias (Máx. 15 por lote)
              </span>
              <span>{selected.size} selecionada(s)</span>
            </h3>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Buscar aluna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-ok outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-line rounded-lg bg-surface/30 p-2 space-y-1">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-md text-sm transition-colors text-left ${
                    selected.has(a.id)
                      ? 'bg-ok/10 border border-ok/30'
                      : 'hover:bg-surface border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <p className={`font-medium truncate ${selected.has(a.id) ? 'text-ok' : 'text-white'}`}>{a.name}</p>
                    <p className="text-xs text-muted truncate">{a.phone || 'Sem telefone'}</p>
                  </div>
                  {selected.has(a.id) ? (
                    <CheckSquare size={16} className="text-ok shrink-0" />
                  ) : (
                    <Square size={16} className="text-muted shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direita: Template e Mensagem */}
          <div className="flex flex-col h-[420px] justify-between">
            <div className="space-y-4">
              <Field label="Modelo Aprovado (Meta Template)">
                <Select value={templateName} onChange={(e) => setTemplateName(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.displayName} [{t.status}]
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Conteúdo da Variável / Comunicado">
                <Textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Informamos que neste sábado teremos aulão especial às 09h!"
                />
              </Field>

              <div className="bg-surface p-3 rounded-lg border border-line text-xs text-muted">
                As mensagens iniciadas pela academia utilizam a API Oficial da Meta e respeitam automaticamente o consentimento LGPD de cada aluna.
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || selected.size === 0 || !message.trim()}
              className="w-full py-3"
            >
              <Send size={15} className="inline mr-2" />
              {sending ? 'Processando...' : `Enviar para ${selected.size} Aluna(s)`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
