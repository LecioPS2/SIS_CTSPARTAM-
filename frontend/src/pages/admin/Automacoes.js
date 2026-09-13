import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge } from '../../components/ui';
import { Settings, Save, Smartphone, QrCode, PowerOff } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export default function Automacoes() {
  const [automations, setAutomations] = useState([]);
  const [waStatus, setWaStatus] = useState({ status: 'DISCONNECTED', qr: null });
  const [loadingWa, setLoadingWa] = useState(false);

  const [bdayActive, setBdayActive] = useState(false);
  const [bdayApp, setBdayApp] = useState(true);
  const [bdayWa, setBdayWa] = useState(false);
  const [bdayAppMsg, setBdayAppMsg] = useState('Feliz Aniversário {nome}!');
  const [bdayWaMsg, setBdayWaMsg] = useState('Parabéns {nome}! O CT Spartan te deseja muitas felicidades!');

  const loadAutomations = async () => {
    try {
      const res = await api.get('/automations');
      setAutomations(res.data);
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

  const loadWaStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setWaStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAutomations();
    loadWaStatus();
    const interval = setInterval(loadWaStatus, 5000); 
    return () => clearInterval(interval);
  }, []);

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

  const startWa = async () => {
    setLoadingWa(true);
    try {
      await api.post('/whatsapp/start');
      toast.success('Iniciando WhatsApp...');
      loadWaStatus();
    } catch (err) {
      toast.error('Erro ao iniciar.');
    }
    setLoadingWa(false);
  };

  const stopWa = async () => {
    setLoadingWa(true);
    try {
      await api.post('/whatsapp/logout');
      toast.success('WhatsApp desconectado.');
      loadWaStatus();
    } catch (err) {
      toast.error('Erro ao desconectar.');
    }
    setLoadingWa(false);
  };

  return (
    <div className="fade-up">
      <PageHeader 
        title="Automações & WhatsApp" 
        subtitle="Configure mensagens automáticas de aniversário, alertas e conecte seu WhatsApp." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card>
          <div className="flex items-center gap-3 mb-4 border-b border-line pb-4">
            <Smartphone className="text-accent" />
            <h2 className="text-lg font-bold text-white">Conexão WhatsApp</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-surface p-4 rounded-lg">
              <span className="text-muted">Status do Sistema:</span>
              {waStatus.status === 'CONNECTED' ? (
                <Badge className="bg-ok text-white">Conectado</Badge>
              ) : waStatus.status === 'QR_READY' ? (
                <Badge className="bg-warn text-white">Aguardando Leitura</Badge>
              ) : waStatus.status === 'INITIALIZING' ? (
                <Badge className="bg-blue-500 text-white">Iniciando...</Badge>
              ) : (
                <Badge className="bg-danger text-white">Desconectado</Badge>
              )}
            </div>

            {waStatus.status === 'DISCONNECTED' && (
              <Button onClick={startWa} disabled={loadingWa} className="w-full bg-ok hover:bg-ok/90">
                <QrCode size={18} className="mr-2 inline" />
                Gerar QR Code de Conexão
              </Button>
            )}

            {waStatus.status === 'QR_READY' && waStatus.qr && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                <p className="text-black font-semibold mt-2">Abra o WhatsApp e escaneie o código</p>
              </div>
            )}

            {waStatus.status === 'CONNECTED' && (
              <Button onClick={stopWa} disabled={loadingWa} className="w-full bg-danger hover:bg-danger/90">
                <PowerOff size={18} className="mr-2 inline" />
                Desconectar WhatsApp
              </Button>
            )}
            
            <p className="text-xs text-muted mt-2">
              Nota: Para que o robô envie mensagens no WhatsApp das alunas, seu celular precisa estar conectado aqui.
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4 border-b border-line pb-4">
            <Settings className="text-ok" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Mensagem de Aniversário</h2>
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
                <span className="font-semibold text-white">Notificar pelo App (Avisos Privados)</span>
              </label>
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

      </div>
    </div>
  );
}
