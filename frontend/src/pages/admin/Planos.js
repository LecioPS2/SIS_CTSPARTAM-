import React, { useEffect, useState } from 'react';
import api, { brl } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, PageHeader, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', price: '', durationDays: 30, daysPerWeek: 7, description: '' };

export default function Planos() {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => api.get('/plans').then((r) => setPlans(r.data));
  useEffect(() => { load(); }, []);

  const open = (p) => {
    setEditing(p || null);
    setForm(p ? { name: p.name, price: p.price, durationDays: p.durationDays, daysPerWeek: p.daysPerWeek || 7, description: p.description || '' } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), durationDays: Number(form.durationDays), daysPerWeek: Number(form.daysPerWeek) };
    try {
      if (editing) { await api.put(`/plans/${editing.id}`, payload); toast.success('Plano atualizado'); }
      else { await api.post('/plans', payload); toast.success('Plano criado'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este plano?')) return;
    await api.delete(`/plans/${id}`);
    toast.success('Plano excluído');
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="admin-planos-page">
      <PageHeader
        title="Planos"
        subtitle="Planos e mensalidades da academia"
        action={<Button onClick={() => open(null)} data-testid="add-plano-button"><Plus size={14} className="inline mr-1" />Novo Plano</Button>}
      />
      {plans.length === 0 ? (
        <Empty text="Nenhum plano cadastrado ainda" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.id} className="p-5 fade-up hover:-translate-y-1 transition-transform duration-200" data-testid={`plano-card-${p.id}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-2xl uppercase tracking-tight">{p.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => open(p)} className="text-muted hover:text-white transition-colors" data-testid={`edit-plano-${p.id}`} aria-label="Editar"><Pencil size={15} /></button>
                  <button onClick={() => remove(p.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-plano-${p.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="font-display text-4xl text-accent leading-none mb-1">{brl(p.price)}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
                {p.durationDays === 30 ? 'Cobrança mensal' : `a cada ${p.durationDays} dias`}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-ok mb-3">
                {p.daysPerWeek >= 7 ? 'Treinos livres na semana' : `${p.daysPerWeek} dia(s) por semana`}
              </p>
              <p className="text-sm text-muted">{p.description || 'Sem descrição'}</p>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Plano' : 'Novo Plano'}>
        <form onSubmit={save} className="space-y-4" data-testid="plano-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="plano-name-input" /></Field>
          <Field label="Preço mensal (R$)"><Input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required data-testid="plano-price-input" /></Field>
          <Field label="Dias de treino por semana">
            <Select value={form.daysPerWeek} onChange={set('daysPerWeek')} data-testid="plano-dias-semana-select">
              <option value={1}>1 dia na semana</option>
              <option value={2}>2 dias na semana</option>
              <option value={3}>3 dias na semana</option>
              <option value={4}>4 dias na semana</option>
              <option value={5}>5 dias na semana</option>
              <option value={6}>6 dias na semana</option>
              <option value={7}>Livre (todos os dias)</option>
            </Select>
          </Field>
          <Field label="Ciclo de cobrança (dias)"><Input type="number" min="1" value={form.durationDays} onChange={set('durationDays')} required data-testid="plano-duration-input" /></Field>
          <Field label="Descrição"><Input value={form.description} onChange={set('description')} data-testid="plano-description-input" /></Field>
          <Button type="submit" className="w-full" data-testid="plano-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
