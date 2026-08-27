import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { StatCard, Card, PageHeader, Badge, Empty } from '../../components/ui';
import { Users, UserCog, Wallet, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats/admin').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-muted">Carregando...</p>;

  const statusTone = { pago: 'ok', pendente: 'warn', atrasado: 'danger' };

  return (
    <div data-testid="admin-dashboard-page">
      <PageHeader title="Visão Geral" subtitle="Panorama financeiro e operacional da academia" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Alunas Ativas" value={stats.totalAlunos} icon={Users} testId="stat-total-alunos" />
        <StatCard label="Personais" value={stats.totalPersonais} icon={UserCog} testId="stat-total-personais" />
        <StatCard label="Receita do Mês" value={brl(stats.monthRevenue)} icon={Wallet} accent testId="stat-receita-mes" />
        <StatCard label="Pendências" value={`${stats.pendingCount} · ${brl(stats.pendingAmount)}`} icon={AlertCircle} testId="stat-pendencias" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 fade-up" data-testid="revenue-chart-card">
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-4">Receita — últimos 6 meses</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a45" vertical={false} />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0a1428', border: '1px solid #1c2a45', borderRadius: 6 }} labelStyle={{ color: '#fff' }} formatter={(v) => [brl(v), 'Receita']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="receita" fill="#FF3B30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5 fade-up" data-testid="recent-payments-card">
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-4">Pagamentos Recentes</p>
          {stats.recentPayments.length === 0 ? (
            <Empty text="Nenhum pagamento registrado" />
          ) : (
            <div className="space-y-3">
              {stats.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.studentId?.name || '—'}</p>
                    <p className="text-xs text-muted">{fmtDate(p.dueDate)} · {brl(p.amount)}</p>
                  </div>
                  <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
