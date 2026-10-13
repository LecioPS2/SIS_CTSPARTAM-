import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  ArrowLeft, Pencil, Mail, Phone, Cake, Clock, CreditCard, UserCog, Dumbbell, TrendingUp,
  Wallet, CalendarCheck, User, CheckCircle2, AlertTriangle, Utensils,
} from 'lucide-react';
import api, { fmtDate, brl, DAYS } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, Empty, Th, Td } from '../../components/ui';
import EvolutionCompare from '../../components/EvolutionCompare';

const TABS = [
  { key: 'dados', label: 'Dados Cadastrais', icon: User },
  { key: 'treinos', label: 'Treinos', icon: Dumbbell },
  { key: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { key: 'financeiro', label: 'Financeiro', icon: Wallet },
  { key: 'frequencia', label: 'Frequência', icon: CalendarCheck },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const backendUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002');
const getImageUrl = (url) => {
  if (!url) return null;
  return url.startsWith('/uploads') ? `${backendUrl}/api/files${url.replace('/uploads', '')}` : `${backendUrl}${url}`;
};

const calcAge = (birth) => {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

const payStatus = (p) => {
  if (p.status === 'pago') return { label: 'Pago', tone: 'ok' };
  if (p.status === 'atrasado' || (p.dueDate && p.dueDate < todayStr())) return { label: 'Atrasado', tone: 'danger' };
  return { label: 'Pendente', tone: 'warn' };
};

function InfoRow({ label, value }) {
  return (
    <div className="py-2.5 border-b border-line last:border-0 flex justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-muted shrink-0">{label}</span>
      <span className="text-sm text-white text-right break-words">{value || <span className="text-muted">—</span>}</span>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, tone = 'text-white' }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-1">{label}</p>
        <p className={`font-display text-3xl leading-none ${tone}`}>{value}</p>
      </div>
      {Icon && <Icon size={26} className="text-muted/40" />}
    </Card>
  );
}

export default function AlunoPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('dados');

  const load = () => {
    api.get(`/users/${id}/overview`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar perfil'));
  };
  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => {
    if (!data) return {};
    const today = todayStr();
    const monthPrefix = today.slice(0, 7);
    const pays = data.payments.filter((p) => p.type !== 'saida');
    const overdue = pays.filter((p) => p.status !== 'pago' && p.dueDate < today);
    const paid = pays.filter((p) => p.status === 'pago');
    const next = pays.filter((p) => p.status !== 'pago' && p.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const checkinsMonth = data.checkins.filter((c) => c.date.startsWith(monthPrefix)).length;
    const lastM = data.measurements[data.measurements.length - 1];
    const firstM = data.measurements[0];
    return {
      overdue, paid, next, checkinsMonth,
      totalPaid: paid.reduce((s, p) => s + (p.amount || 0), 0),
      totalOverdue: overdue.reduce((s, p) => s + (p.amount || 0), 0),
      lastCheckin: data.checkins[0],
      activeWorkouts: data.workouts.filter((w) => w.active !== false).length,
      lastWeight: lastM?.weight,
      weightDiff: lastM?.weight != null && firstM?.weight != null && data.measurements.length > 1 ? (lastM.weight - firstM.weight) : null,
    };
  }, [data]);

  const markPaid = async (p) => {
    if (!window.confirm(`Confirmar pagamento de ${brl(p.amount)} (venc. ${fmtDate(p.dueDate)})?`)) return;
    try {
      await api.put(`/payments/${p.id}`, { status: 'pago' });
      toast.success('Pagamento confirmado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar pagamento');
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/alunos')}><ArrowLeft size={14} className="inline mr-2" />Voltar</Button>
        <Empty text={error} />
      </div>
    );
  }
  if (!data) return <div className="text-muted text-sm py-12 text-center">Carregando perfil...</div>;

  const s = data.student;
  const age = calcAge(s.birthDate);
  const chartData = data.measurements.map((m) => ({ date: fmtDate(m.date).slice(0, 5), peso: m.weight, cintura: m.waist, quadril: m.hip }));
  const hasWeightChart = chartData.filter((d) => d.peso != null).length > 1;
  const hasMeasuresChart = chartData.filter((d) => d.cintura != null || d.quadril != null).length > 1;
  const isAdmin = user?.role === 'admin';
  const dueLabel = s.paymentDueDate ? (s.paymentDueDate.length <= 2 ? `Dia ${s.paymentDueDate.padStart(2, '0')}` : fmtDate(s.paymentDueDate)) : null;

  return (
    <div data-testid="aluno-perfil-page" className="pb-16">
      {/* Topo */}
      <div className="flex items-center justify-between mb-5 fade-up">
        <button onClick={() => navigate('/admin/alunos')} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
          <ArrowLeft size={16} /> Voltar para Alunas
        </button>
        <Button onClick={() => navigate('/admin/alunos', { state: { editId: s.id } })}>
          <Pencil size={14} className="inline mr-2" />Editar Cadastro
        </Button>
      </div>

      {/* Cabeçalho do perfil */}
      <Card className="p-6 mb-6 fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {s.avatarUrl ? (
            <img src={getImageUrl(s.avatarUrl)} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-xl shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center font-display text-4xl shrink-0">
              {s.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-display text-4xl uppercase tracking-tight leading-none">{s.name}</h1>
              <Badge tone={s.active !== false ? 'ok' : 'danger'}>{s.active !== false ? 'Ativa' : 'Inativa'}</Badge>
              {stats.overdue.length > 0 && <Badge tone="danger">{stats.overdue.length} em atraso</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Mail size={14} />{s.email}</span>
              {s.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{s.phone}</span>}
              {s.timeSlot && <span className="flex items-center gap-1.5"><Clock size={14} />Turma {s.timeSlot}</span>}
              {s.planId && <span className="flex items-center gap-1.5"><CreditCard size={14} />{s.planId.name}{s.planDuration ? ` · ${s.planDuration} ${s.planDuration === '1' ? 'mês' : 'meses'}` : ''}</span>}
              {s.personalId && <span className="flex items-center gap-1.5"><UserCog size={14} />{s.personalId.name}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-up">
        <MiniStat label="Check-ins no mês" value={stats.checkinsMonth} icon={CalendarCheck} />
        <MiniStat label="Treinos ativos" value={stats.activeWorkouts} icon={Dumbbell} />
        <MiniStat label="Peso atual" value={stats.lastWeight != null ? `${stats.lastWeight}kg` : '—'} icon={TrendingUp} />
        <MiniStat
          label={stats.overdue.length > 0 ? 'Em atraso' : 'Próx. vencimento'}
          value={stats.overdue.length > 0 ? brl(stats.totalOverdue) : (stats.next ? fmtDate(stats.next.dueDate).slice(0, 5) : '—')}
          icon={stats.overdue.length > 0 ? AlertTriangle : Wallet}
          tone={stats.overdue.length > 0 ? 'text-accent' : 'text-white'}
        />
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 fade-up">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${tab === t.key ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-line'}`}
          >
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* ===== DADOS CADASTRAIS ===== */}
      {tab === 'dados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up">
          <Card className="p-6">
            <h3 className="font-display text-xl uppercase mb-4 tracking-wide border-b border-line pb-3">Informações Pessoais</h3>
            <InfoRow label="Nome" value={s.name} />
            <InfoRow label="E-mail" value={s.email} />
            <InfoRow label="Telefone" value={s.phone} />
            <InfoRow label="Nascimento" value={s.birthDate ? `${fmtDate(s.birthDate)}${age != null ? ` (${age} anos)` : ''}` : null} />
            <InfoRow label="Cadastrada em" value={s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-BR') : null} />
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-xl uppercase mb-4 tracking-wide border-b border-line pb-3">Plano & Turma</h3>
            <InfoRow label="Plano" value={s.planId ? `${s.planId.name} — ${brl(s.planId.price)}` : null} />
            <InfoRow label="Período" value={s.planDuration ? `${s.planDuration} ${s.planDuration === '1' ? 'mês' : 'meses'}` : null} />
            <InfoRow label="Vencimento" value={dueLabel} />
            <InfoRow label="Turma" value={s.timeSlot} />
            <InfoRow label="Personal" value={s.personalId?.name} />
            <InfoRow label="Status" value={s.active !== false ? 'Ativa' : 'Inativa'} />
          </Card>
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-display text-xl uppercase mb-4 tracking-wide border-b border-line pb-3">Anamnese</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Objetivo" value={s.goal} />
              <InfoRow label="Nível" value={s.experienceLevel} />
              <InfoRow label="Frequência" value={s.trainingFrequency} />
              <InfoRow label="Condições de saúde" value={s.healthConditions} />
              <InfoRow label="Medicamentos" value={s.medications} />
              <InfoRow label="Lesões" value={s.injuries} />
            </div>
            {s.anamnesisNotes && (
              <div className="mt-4 p-4 bg-surface rounded border border-line">
                <p className="text-xs uppercase tracking-wider text-muted mb-1">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{s.anamnesisNotes}</p>
              </div>
            )}
          </Card>
          {data.diets.length > 0 && (
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-display text-xl uppercase mb-4 tracking-wide border-b border-line pb-3 flex items-center gap-2"><Utensils size={18} />Plano Alimentar</h3>
              {data.diets.map((d) => (
                <div key={d.id} className="mb-3 last:mb-0">
                  <p className="font-medium">{d.title} {d.goal && <span className="text-muted text-sm">· {d.goal}</span>}</p>
                  <p className="text-xs text-muted">{(d.meals || []).length} refeições</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ===== TREINOS ===== */}
      {tab === 'treinos' && (
        <div className="space-y-6 fade-up">
          <div className="flex justify-end">
            {isAdmin && <Button onClick={() => navigate('/admin/montar-treino')}><Dumbbell size={14} className="inline mr-2" />Montar Treino</Button>}
          </div>
          {data.workouts.length === 0 ? (
            <Empty text="Nenhum treino cadastrado para esta aluna." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.workouts.map((w) => {
                const byDay = {};
                (w.exercises || []).forEach((ex) => {
                  const k = ex.day != null ? ex.day : 'all';
                  (byDay[k] = byDay[k] || []).push(ex);
                });
                return (
                  <Card key={w.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-display text-2xl uppercase leading-none">{w.name}</h4>
                        <p className="text-xs text-muted mt-1">
                          {(w.days || []).length > 0 ? (w.days || []).slice().sort().map((d) => DAYS[d]).join(' · ') : 'Sem dias definidos'}
                          {w.personalId?.name ? ` — por ${w.personalId.name}` : ''}
                        </p>
                      </div>
                      <Badge tone={w.active !== false ? 'ok' : 'muted'}>{w.active !== false ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                    {Object.keys(byDay).length === 0 ? (
                      <p className="text-sm text-muted">Sem exercícios.</p>
                    ) : (
                      Object.entries(byDay).map(([day, list]) => (
                        <div key={day} className="mb-3 last:mb-0">
                          {day !== 'all' && <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-1">{DAYS[day]}</p>}
                          <ul className="divide-y divide-line">
                            {list.map((ex, i) => (
                              <li key={i} className="py-1.5 flex justify-between text-sm gap-3">
                                <span className="truncate">{ex.name} <span className="text-muted text-xs">({ex.muscleGroup})</span></span>
                                <span className="text-muted text-xs whitespace-nowrap">
                                  {ex.timeSeconds ? `${ex.timeSeconds}s` : `${ex.sets || '-'}x${ex.reps || '-'}`}{ex.load ? ` · ${ex.load}kg` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="p-5">
            <h3 className="font-display text-xl uppercase mb-3 tracking-wide">Treinos Concluídos</h3>
            {data.logs.length === 0 ? (
              <p className="text-sm text-muted">Nenhum treino concluído ainda.</p>
            ) : (
              <div className="divide-y divide-line">
                {data.logs.slice(0, 20).map((l) => (
                  <div key={l.id} className="py-2 flex justify-between text-sm">
                    <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-ok" />{l.workoutId?.name || 'Treino removido'}</span>
                    <span className="text-muted">{fmtDate(l.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===== EVOLUÇÃO ===== */}
      {tab === 'evolucao' && (
        <div className="space-y-6 fade-up">
          {data.measurements.length === 0 ? (
            <Empty text="Nenhuma avaliação física registrada. Use o botão de Avaliação Física na lista de alunas." />
          ) : (
            <>
              {stats.weightDiff != null && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <MiniStat label="Peso inicial" value={`${data.measurements[0].weight}kg`} />
                  <MiniStat label="Peso atual" value={`${stats.lastWeight}kg`} />
                  <MiniStat label="Variação" value={`${stats.weightDiff > 0 ? '+' : ''}${stats.weightDiff.toFixed(1)}kg`} tone={stats.weightDiff <= 0 ? 'text-ok' : 'text-accent'} />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasWeightChart && (
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Peso (kg)</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2a45" vertical={false} />
                          <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip contentStyle={{ background: '#0a1428', border: '1px solid #1c2a45', borderRadius: 6 }} labelStyle={{ color: '#fff' }} />
                          <Line type="monotone" dataKey="peso" name="Peso" stroke="#FF3B30" strokeWidth={2} dot={{ fill: '#FF3B30', r: 4 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
                {hasMeasuresChart && (
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Cintura & Quadril (cm)</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2a45" vertical={false} />
                          <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
                          <Tooltip contentStyle={{ background: '#0a1428', border: '1px solid #1c2a45', borderRadius: 6 }} labelStyle={{ color: '#fff' }} />
                          <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#FF3B30" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                          <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#34C759" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
              <EvolutionCompare history={data.measurements} />
              <Card className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr><Th>Data</Th><Th>Peso</Th><Th>Altura</Th><Th>Peito</Th><Th>Cintura</Th><Th>Quadril</Th><Th>Braço</Th><Th>Coxa</Th></tr>
                  </thead>
                  <tbody>
                    {[...data.measurements].reverse().map((m) => (
                      <tr key={m.id}>
                        <Td>{fmtDate(m.date)}</Td>
                        <Td>{m.weight != null ? `${m.weight}kg` : '—'}</Td>
                        <Td>{m.height != null ? `${m.height}cm` : '—'}</Td>
                        <Td>{m.chest != null ? `${m.chest}cm` : '—'}</Td>
                        <Td>{m.waist != null ? `${m.waist}cm` : '—'}</Td>
                        <Td>{m.hip != null ? `${m.hip}cm` : '—'}</Td>
                        <Td>{m.arm != null ? `${m.arm}cm` : '—'}</Td>
                        <Td>{m.thigh != null ? `${m.thigh}cm` : '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ===== FINANCEIRO ===== */}
      {tab === 'financeiro' && (
        <div className="space-y-6 fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="Total pago" value={brl(stats.totalPaid)} tone="text-ok" />
            <MiniStat label="Em atraso" value={brl(stats.totalOverdue)} tone={stats.totalOverdue > 0 ? 'text-accent' : 'text-white'} />
            <MiniStat label="Próximo vencimento" value={stats.next ? `${fmtDate(stats.next.dueDate)}` : '—'} />
          </div>
          {data.payments.length === 0 ? (
            <Empty text="Nenhuma cobrança registrada para esta aluna." />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><Th>Vencimento</Th><Th>Descrição</Th><Th>Valor</Th><Th>Forma</Th><Th>Status</Th><Th>Pago em</Th>{isAdmin && <Th></Th>}</tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => {
                    const st = payStatus(p);
                    return (
                      <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                        <Td>{fmtDate(p.dueDate)}</Td>
                        <Td className="text-muted">{p.description || p.planId?.name || 'Mensalidade'}</Td>
                        <Td className="font-medium">{brl(p.amount)}</Td>
                        <Td className="text-muted uppercase text-xs">{p.method || '—'}</Td>
                        <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
                        <Td className="text-muted">{p.paidAt ? fmtDate(p.paidAt) : '—'}</Td>
                        {isAdmin && (
                          <Td className="text-right">
                            {p.status !== 'pago' && (
                              <button onClick={() => markPaid(p)} className="text-xs uppercase tracking-wider text-ok border border-ok/30 rounded px-2 py-1 hover:bg-ok/10 transition-colors">
                                Marcar pago
                              </button>
                            )}
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ===== FREQUÊNCIA ===== */}
      {tab === 'frequencia' && (
        <div className="space-y-6 fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat label="Check-ins no mês" value={stats.checkinsMonth} />
            <MiniStat label="Últimos registros" value={data.checkins.length} />
            <MiniStat label="Último check-in" value={stats.lastCheckin ? fmtDate(stats.lastCheckin.date).slice(0, 5) : '—'} />
          </div>
          {data.checkins.length === 0 ? (
            <Empty text="Nenhum check-in registrado." />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><Th>Data</Th><Th>Dia</Th><Th>Hora</Th><Th>Método</Th></tr></thead>
                <tbody>
                  {data.checkins.map((c) => (
                    <tr key={c.id}>
                      <Td>{fmtDate(c.date)}</Td>
                      <Td className="text-muted">{DAYS[new Date(`${c.date}T12:00:00`).getDay()]}</Td>
                      <Td>{c.time}</Td>
                      <Td><Badge>{c.method === 'manual' ? 'Manual' : 'QR Code'}</Badge></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
