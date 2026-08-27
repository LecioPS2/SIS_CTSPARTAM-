import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Field, Card, Modal, PageHeader, Empty } from '../../components/ui';
import { Plus } from 'lucide-react';
import EvolutionCompare from '../../components/EvolutionCompare';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const empty = { weight: '', height: '', chest: '', waist: '', hip: '', arm: '', thigh: '' };

export default function Evolucao() {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => api.get('/student/measurements').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = Number(v); });
    try {
      await api.post('/student/measurements', payload);
      toast.success('Medidas registradas');
      setModal(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const chartData = list.filter((m) => m.weight).map((m) => ({ date: fmtDate(m.date).slice(0, 5), peso: m.weight }));
  const latest = list[list.length - 1];

  return (
    <div data-testid="student-evolucao-page">
      <PageHeader
        title="Evolução"
        subtitle="Acompanhe seu progresso"
        action={<Button onClick={() => setModal(true)} data-testid="add-medida-button"><Plus size={14} className="inline mr-1" />Registrar</Button>}
      />
      {latest && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 fade-up" data-testid="peso-atual-card">
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Peso atual</p>
            <p className="font-display text-4xl text-accent leading-none">{latest.weight || '—'}<span className="text-lg text-muted"> kg</span></p>
          </Card>
          <Card className="p-4 fade-up">
            <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Última medição</p>
            <p className="font-display text-4xl leading-none">{fmtDate(latest.date).slice(0, 5)}</p>
          </Card>
        </div>
      )}
      {chartData.length > 1 && (
        <Card className="p-4 mb-6 fade-up" data-testid="peso-chart-card">
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Evolução do peso</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a45" vertical={false} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ background: '#0a1428', border: '1px solid #1c2a45', borderRadius: 6 }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="peso" stroke="#FF3B30" strokeWidth={2} dot={{ fill: '#FF3B30', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {list.length > 1 && <div className="mb-6"><EvolutionCompare history={list} /></div>}
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Histórico de medidas</p>
      {list.length === 0 ? (
        <Empty text="Nenhuma medida registrada. Comece agora!" />
      ) : (
        <div className="space-y-2">
          {[...list].reverse().map((m) => (
            <Card key={m.id} className="p-4" data-testid={`medida-item-${m.id}`}>
              <p className="text-xs text-muted mb-2">{fmtDate(m.date)}</p>
              <div className="grid grid-cols-4 gap-2 text-sm">
                {m.weight != null && <div><span className="text-muted text-xs block">Peso</span>{m.weight}kg</div>}
                {m.chest != null && <div><span className="text-muted text-xs block">Peito</span>{m.chest}cm</div>}
                {m.waist != null && <div><span className="text-muted text-xs block">Cintura</span>{m.waist}cm</div>}
                {m.hip != null && <div><span className="text-muted text-xs block">Quadril</span>{m.hip}cm</div>}
                {m.arm != null && <div><span className="text-muted text-xs block">Braço</span>{m.arm}cm</div>}
                {m.thigh != null && <div><span className="text-muted text-xs block">Coxa</span>{m.thigh}cm</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Medidas">
        <form onSubmit={save} className="space-y-4" data-testid="medida-form">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Peso (kg)"><Input type="number" step="0.1" min="0" value={form.weight} onChange={set('weight')} data-testid="medida-peso-input" /></Field>
            <Field label="Altura (cm)"><Input type="number" step="0.5" min="0" value={form.height} onChange={set('height')} data-testid="medida-altura-input" /></Field>
            <Field label="Peito (cm)"><Input type="number" step="0.5" min="0" value={form.chest} onChange={set('chest')} /></Field>
            <Field label="Cintura (cm)"><Input type="number" step="0.5" min="0" value={form.waist} onChange={set('waist')} /></Field>
            <Field label="Quadril (cm)"><Input type="number" step="0.5" min="0" value={form.hip} onChange={set('hip')} /></Field>
            <Field label="Braço (cm)"><Input type="number" step="0.5" min="0" value={form.arm} onChange={set('arm')} /></Field>
            <Field label="Coxa (cm)"><Input type="number" step="0.5" min="0" value={form.thigh} onChange={set('thigh')} /></Field>
          </div>
          <Button type="submit" className="w-full" data-testid="medida-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
