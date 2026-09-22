import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge } from '../../components/ui';
import { Settings, Save, Smartphone, AlertTriangle, Bell, PartyPopper } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function Automacoes() {
  const [bdayActive, setBdayActive] = useState(false);
  const [bdayApp, setBdayApp] = useState(true);
  const [bdayWa, setBdayWa] = useState(false);
  const [bdayAppMsg, setBdayAppMsg] = useState('Feliz Aniversário {nome}!');
  const [bdayWaMsg, setBdayWaMsg] = useState('Parabéns {nome}! O CT Spartan te deseja muitas felicidades!');

  const loadAutomations = async () => {
    try {
      const res = await api.get('/automations');
      const bday = res.data.find(a => a.type === 'birthday');
      if (bday) {
        setBdayActive(bday.active);
        setBdayApp(bday.sendApp);
        setBdayWa(bday.sendWhatsapp);
        setBdayAppMsg(bday.appMessage || bdayAppMsg);
        setBdayWaMsg(bday.whatsappMessage || bdayWaMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadAutomations(); }, []);

  const saveBday = async () => {
    try {
      await api.put('/automations/birthday', {
        active: bdayActive,
        sendApp: bdayApp,
        sendWhatsapp: bdayWa,
        appMessage: bdayAppMsg,
        whatsappMessage: bdayWaMsg
      });
      toast.success('Configurações salvas!');
    } catch (err) {
      toast.error('Erro ao salvar.');
    }
  };

  return (
    <div className="fade-up">
      <PageHeader 
        title="Automações" 
        subtitle="Configure mensagens automáticas de aniversário e alertas para suas alunas." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel Aniversários */}
        <Card>
          <div className="flex items-center gap-3 mb-4 border-b border-line pb-4">
            <PartyPopper className="text-ok" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Mensagem de Aniversário</h2>
              <p className="text-xs text-muted">Envia um aviso personalizado no dia do aniversário da aluna</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={bdayActive} onChange={(e) => setBdayActive(e.target.checked)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${bdayActive ? 'bg-ok' : 'bg-surface border border-line'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${bdayActive ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          <div className={`space-y-4 ${!bdayActive ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-surface p-4 rounded-lg space-y-3">
              <label className="flex items-center cursor-pointer gap-2 mb-2">
                <input type="checkbox" checked={bdayApp} onChange={(e) => setBdayApp(e.target.checked)} className="rounded border-line bg-card text-accent focus:ring-accent" />
                <Bell size={16} className="text-ok" />
                <span className="font-semibold text-white">Notificar pelo App (Avisos Privados)</span>
              </label>
              <p className="text-xs text-muted ml-6">A aluna verá o aviso de aniversário quando abrir o app.</p>
              {bdayApp && (
                <div>
                  <label className="text-xs text-muted block mb-1">Mensagem (Use {'{nome}'} para o nome da aluna)</label>
                  <textarea 
                    value={bdayAppMsg} 
                    onChange={e => setBdayAppMsg(e.target.value)}
                    className="w-full bg-card border border-line rounded p-2 text-white text-sm"
                    rows="2"
                  />
                </div>
              )}
            </div>

            <div className="bg-surface p-4 rounded-lg space-y-3">
              <label className="flex items-center cursor-pointer gap-2 mb-2">
                <input type="checkbox" checked={bdayWa} onChange={(e) => setBdayWa(e.target.checked)} className="rounded border-line bg-card text-accent focus:ring-accent" />
                <Smartphone size={16} className="text-green-400" />
                <span className="font-semibold text-white">Enviar mensagem no WhatsApp</span>
              </label>
              {bdayWa && (
                <div>
                  <label className="text-xs text-muted block mb-1">Mensagem (Use {'{nome}'} para o nome da aluna)</label>
                  <textarea 
                    value={bdayWaMsg} 
                    onChange={e => setBdayWaMsg(e.target.value)}
                    className="w-full bg-card border border-line rounded p-2 text-white text-sm"
                    rows="3"
                  />
                </div>
              )}
            </div>

            <Button onClick={saveBday} className="w-full">
              <Save size={16} className="inline mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </Card>

        {/* Painel Info WhatsApp */}
        <Card>
          <div className="flex items-center gap-3 mb-4 border-b border-line pb-4">
            <Smartphone className="text-green-400" />
            <h2 className="text-lg font-bold text-white">Status do WhatsApp</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-surface p-4 rounded-lg">
              <span className="text-muted">Conexão:</span>
              <Badge className="bg-yellow-600 text-white">Requer VPS</Badge>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-200 font-semibold text-sm mb-2">Por que o WhatsApp não conecta?</p>
                  <p className="text-yellow-100/70 text-xs leading-relaxed">
                    A hospedagem compartilhada da Hostinger <strong>não suporta</strong> conexões permanentes que o WhatsApp precisa. 
                    Para ativar o envio automático via WhatsApp, é necessário migrar o backend para um <strong>VPS</strong> (servidor dedicado), 
                    ou contratar uma API externa de WhatsApp (como Z-API ou Evolution API).
                  </p>
                  <p className="text-yellow-100/70 text-xs leading-relaxed mt-2">
                    <strong>Enquanto isso, os avisos pelo App funcionam normalmente!</strong> Basta ativar a automação ao lado e a aluna receberá 
                    a mensagem de aniversário no app dela.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-lg">
              <p className="text-sm font-semibold text-white mb-2">📋 Resumo do que funciona:</p>
              <ul className="text-xs text-muted space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-ok rounded-full"></span>
                  <span><strong className="text-ok">Aviso no App:</strong> Funcionando! A aluna recebe a mensagem de aniversário ao abrir o sistema.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span><strong className="text-yellow-400">WhatsApp:</strong> Preparado, mas requer VPS para funcionar.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
