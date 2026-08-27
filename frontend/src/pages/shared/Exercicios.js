import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Cardio', 'Corpo inteiro'];
const empty = { name: '', muscleGroup: 'Peito', sets: 3, reps: 12, load: 0, timeSeconds: 0, notes: '' };

export default function Exercicios() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => api.get('/exercises').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const open = (ex) => {
    setEditing(ex || null);
    setForm(ex ? { name: ex.name, muscleGroup: ex.muscleGroup, sets: ex.sets, reps: ex.reps, load: ex.load, timeSeconds: ex.timeSeconds, notes: ex.notes || '' } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, sets: Number(form.sets), reps: Number(form.reps), load: Number(form.load), timeSeconds: Number(form.timeSeconds) };
    try {
      if (editing) { await api.put(`/exercises/${editing.id}`, payload); toast.success('Exercício atualizado'); }
      else { await api.post('/exercises', payload); toast.success('Exercício cadastrado'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este exercício?')) return;
    await api.delete(`/exercises/${id}`);
    toast.success('Exercício excluído');
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const filtered = filter ? list.filter((e) => e.muscleGroup === filter) : list;

  return (
    <div data-testid="exercicios-page">
      <PageHeader
        title="Exercícios"
        subtitle="Catálogo de exercícios com carga, séries, repetições e tempo"
        action={<Button onClick={() => open(null)} data-testid="add-exercicio-button"><Plus size={14} className="inline mr-1" />Novo Exercício</Button>}
      />
      <div className="mb-4 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="exercicio-filter-select">
          <option value="">Todos os grupos musculares</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
      </div>
      <Card className="overflow-x-auto fade-up">
        {filtered.length === 0 ? (
          <div className="p-6"><Empty text="Nenhum exercício cadastrado ainda" /></div>
        ) : (
          <table className="w-full" data-testid="exercicios-table">
            <thead><tr><Th>Exercício</Th><Th>Grupo</Th><Th>Séries</Th><Th>Repetições</Th><Th>Carga (kg)</Th><Th>Tempo</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{ex.name}</Td>
                  <Td><Badge>{ex.muscleGroup}</Badge></Td>
                  <Td>{ex.sets}</Td>
                  <Td>{ex.reps}</Td>
                  <Td>{ex.load || '—'}</Td>
                  <Td>{ex.timeSeconds ? `${ex.timeSeconds}s` : '—'}</Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => open(ex)} className="text-muted hover:text-white transition-colors" data-testid={`edit-exercicio-${ex.id}`} aria-label="Editar"><Pencil size={15} /></button>
                      <button onClick={() => remove(ex.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-exercicio-${ex.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Exercício' : 'Novo Exercício'}>
        <form onSubmit={save} className="space-y-4" data-testid="exercicio-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="exercicio-name-input" /></Field>
          <Field label="Grupo Muscular">
            <Select value={form.muscleGroup} onChange={set('muscleGroup')} data-testid="exercicio-grupo-select">
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Séries"><Input type="number" min="0" value={form.sets} onChange={set('sets')} data-testid="exercicio-series-input" /></Field>
            <Field label="Repetições"><Input type="number" min="0" value={form.reps} onChange={set('reps')} data-testid="exercicio-reps-input" /></Field>
            <Field label="Carga (kg)"><Input type="number" step="0.5" min="0" value={form.load} onChange={set('load')} data-testid="exercicio-carga-input" /></Field>
            <Field label="Tempo (segundos)"><Input type="number" min="0" value={form.timeSeconds} onChange={set('timeSeconds')} data-testid="exercicio-tempo-input" /></Field>
          </div>
          <Field label="Observações"><Input value={form.notes} onChange={set('notes')} data-testid="exercicio-notas-input" /></Field>
          <Button type="submit" className="w-full" data-testid="exercicio-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
