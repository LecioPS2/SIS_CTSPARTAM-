import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { Card, PageHeader, Badge, Empty, Button, Modal, Input } from '../../components/ui';
import { QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Mensalidade() {
  const [data, setData] = useState(null);
  const [pixModal, setPixModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/student/membership').then((r) => setData(r.data)).catch(() => setData({ plan: null, payments: [] }));
  }, []);

  if (!data) return <p className="text-muted">Carregando...</p>;

  const statusTone = { pago: 'ok', pendente: 'warn', atrasado: 'danger' };
  const current = data.payments[0];

  const handleCopy = () => {
    navigator.clipboard.writeText('00020101021126580014br.gov.bcb.pix0136pix-em-breve-integra-mercado-pago5204000053039865802BR5909CT SPARTAN6009SAO PAULO62070503***63041A2B');
    setCopied(true);
    toast.success('Chave Pix copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="student-mensalidade-page" className="pb-20">
      <PageHeader title="Mensalidade" subtitle="Seu plano e histórico de pagamentos" />
      
      <Card className="p-5 mb-6 fade-up" data-testid="plano-atual-card">
        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">Meu plano</p>
        {data.plan ? (
          <>
            <h2 className="font-display text-4xl uppercase tracking-tight leading-none mb-1">{data.plan.name}</h2>
            <p className="text-accent font-display text-3xl leading-none mb-2">{brl(data.plan.price)}</p>
            <p className="text-xs text-muted">
              {data.plan.durationDays === 30 ? 'Cobrança mensal' : `Renovação a cada ${data.plan.durationDays} dias`}
              {data.plan.daysPerWeek ? ` • ${data.plan.daysPerWeek >= 7 ? 'treinos livres' : `${data.plan.daysPerWeek} dia(s)/semana`}` : ''}
            </p>
          </>
        ) : (
          <p className="text-muted text-sm">Nenhum plano vinculado. Fale com a recepção.</p>
        )}
        {data.personal && <p className="text-xs text-muted mt-3 pt-3 border-t border-line">Personal: <span className="text-white">{data.personal.name}</span></p>}
      </Card>

      {current && (
        <Card className={`p-5 mb-6 fade-up border ${current.status === 'pago' ? 'border-ok/40' : 'border-accent/40'}`} data-testid="status-atual-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Situação atual</p>
              <div className="flex items-center gap-3 mb-1">
                <p className="font-display text-2xl uppercase leading-none">{current.status === 'pago' ? 'Em dia' : 'Pagamento pendente'}</p>
                <Badge tone={statusTone[current.status]}>{current.status}</Badge>
              </div>
              <p className="text-xs text-muted">Vencimento: {fmtDate(current.dueDate)} • <span className="text-white font-medium">{brl(current.amount)}</span></p>
            </div>
            
            {current.status !== 'pago' && (
              <Button onClick={() => setPixModal(true)} variant="accent" className="w-full md:w-auto">
                <QrCode size={16} className="inline mr-2" />
                Pagar com Pix
              </Button>
            )}
          </div>
        </Card>
      )}

      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Histórico</p>
      {data.payments.length === 0 ? (
        <Empty text="Nenhum pagamento registrado" />
      ) : (
        <div className="space-y-2">
          {data.payments.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between" data-testid={`pagamento-item-${p.id}`}>
              <div>
                <p className="text-sm font-medium">{brl(p.amount)}</p>
                <p className="text-xs text-muted">Venc. {fmtDate(p.dueDate)}{p.paidAt ? ` • Pago em ${fmtDate(p.paidAt)}` : ''}</p>
              </div>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      <Modal open={pixModal} onClose={() => setPixModal(false)} title="Pagamento via Pix">
        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-xl mb-6">
            {/* Placeholder for QR Code */}
            <div className="w-48 h-48 bg-gray-200 border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500">
              <QrCode size={48} className="mb-2 opacity-50" />
              <span className="text-xs text-center px-4 font-bold uppercase">QR Code será gerado aqui</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-1">{brl(current?.amount)}</h3>
          <p className="text-sm text-muted mb-6 text-center">
            Abra o app do seu banco, escolha a opção Pix e escaneie o QR Code acima ou use a opção Copia e Cola.
          </p>
          
          <div className="w-full">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Pix Copia e Cola</p>
            <div className="flex gap-2">
              <Input 
                value="00020101021126580014br.gov.bcb.pix..."
                readOnly
                className="font-mono text-xs opacity-70"
              />
              <Button onClick={handleCopy} variant={copied ? 'primary' : 'outline'} className="shrink-0 px-3">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          
          <div className="mt-6 w-full p-3 bg-surface border border-line rounded flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse"></div>
            <p className="text-xs text-muted leading-relaxed">
              Em breve! A integração automática com o Mercado Pago está sendo preparada.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
}
