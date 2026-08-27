import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { Card, PageHeader, Badge, Empty } from '../../components/ui';

export default function Mensalidade() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/membership').then((r) => setData(r.data)).catch(() => setData({ plan: null, payments: [] }));
  }, []);

  if (!data) return <p className="text-muted">Carregando...</p>;

  const statusTone = { pago: 'ok', pendente: 'warn', atrasado: 'danger' };
  const current = data.payments[0];

  return (
    <div data-testid="student-mensalidade-page">
      <PageHeader title="Mensalidade" subtitle="Seu plano e histórico de pagamentos" />
      <Card className="p-5 mb-6 fade-up" data-testid="plano-atual-card">
        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">Meu plano</p>
        {data.plan ? (
          <>
            <h2 className="font-display text-4xl uppercase tracking-tight leading-none mb-1">{data.plan.name}</h2>
            <p className="text-accent font-display text-3xl leading-none mb-2">{brl(data.plan.price)}</p>
            <p className="text-xs text-muted">
              {data.plan.durationDays === 30 ? 'Cobrança mensal' : `Renovação a cada ${data.plan.durationDays} dias`}
              {data.plan.daysPerWeek ? ` · ${data.plan.daysPerWeek >= 7 ? 'treinos livres' : `${data.plan.daysPerWeek} dia(s)/semana`}` : ''}
            </p>
          </>
        ) : (
          <p className="text-muted text-sm">Nenhum plano vinculado. Fale com a recepção.</p>
        )}
        {data.personal && <p className="text-xs text-muted mt-3 pt-3 border-t border-line">Personal: <span className="text-white">{data.personal.name}</span></p>}
      </Card>
      {current && (
        <Card className={`p-5 mb-6 fade-up border ${current.status === 'pago' ? 'border-ok/40' : 'border-accent/40'}`} data-testid="status-atual-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Situação atual</p>
              <p className="font-display text-2xl uppercase leading-none">{current.status === 'pago' ? 'Em dia' : 'Pagamento pendente'}</p>
              <p className="text-xs text-muted mt-1">Vencimento: {fmtDate(current.dueDate)} · {brl(current.amount)}</p>
            </div>
            <Badge tone={statusTone[current.status]}>{current.status}</Badge>
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
                <p className="text-xs text-muted">Venc. {fmtDate(p.dueDate)}{p.paidAt ? ` · Pago em ${fmtDate(p.paidAt)}` : ''}</p>
              </div>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
