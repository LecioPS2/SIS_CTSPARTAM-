import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { StatCard, Card, PageHeader, Empty, Badge } from '../../components/ui';
import { Users, ClipboardList, CheckCircle2, CalendarDays } from 'lucide-react';

export default function PersonalDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats/personal').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <p className="text-muted">Carregando...</p>;

  return (
    <div data-testid="personal-dashboard-page">
      <PageHeader title="Visão Geral" subtitle="Seu dia como personal trainer" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Meus Alunos" value={stats.totalAlunos} icon={Users} testId="stat-meus-alunos" />
        <StatCard label="Treinos Ativos" value={stats.totalTreinos} icon={ClipboardList} testId="stat-treinos-ativos" />
        <StatCard label="Treinos Concluídos Hoje" value={stats.completedToday} icon={CheckCircle2} accent testId="stat-concluidos-hoje" />
      </div>
      <Card className="p-5 fade-up" data-testid="sessions-today-card">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={16} className="text-muted" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Sessões de hoje</p>
        </div>
        {stats.sessionsToday.length === 0 ? (
          <Empty text="Nenhuma sessão agendada para hoje" />
        ) : (
          <div className="space-y-3">
            {stats.sessionsToday.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.studentId?.name}</p>
                  <p className="text-xs text-muted">{s.notes || 'Sessão de treino'}</p>
                </div>
                <Badge tone="ok">{s.time} · {s.durationMin}min</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
