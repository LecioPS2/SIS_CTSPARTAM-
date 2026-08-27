import React, { useEffect, useState } from 'react';
import api, { DAYS } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const emptyForm = { name: '', studentId: '', days: [], exercises: [] };

export default function Treinos() {
  const [workouts, setWorkouts] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pickExercise, setPickExercise] = useState('');

  const load = () => {
    api.get('/workouts').then((r) => setWorkouts(r.data));
    api.get('/users').then((r) => setAlunos(r.data));
    api.get('/exercises').then((r) => setCatalog(r.data));
  };
  useEffect(() => { load(); }, []);

  const open = (w) => {
    setEditing(w || null);
    setForm(w ? { name: w.name, studentId: w.studentId?.id || w.studentId, days: w.days || [], exercises: w.exercises || [] } : emptyForm);
    setModal(true);
  };

  const toggleDay = (d) => {
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));
  };

  const addExercise = () => {
    const ex = catalog.find((e) => e.id === pickExercise);
    if (!ex) return;
    setForm((f) => ({
      ...f,
      exercises: [...f.exercises, { exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, sets: ex.sets, reps: ex.reps, load: ex.load, timeSeconds: ex.timeSeconds, notes: '' }],
    }));
    setPickExercise('');
  };

  const updateEx = (i, k, v) => {
    setForm((f) => {
      const exercises = [...f.exercises];
      exercises[i] = { ...exercises[i], [k]: v };
      return { ...f, exercises };
    });
  };

  const removeEx = (i) => setForm((f) => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));

  const save = async (e) => {
    e.preventDefault();
    if (form.exercises.length === 0) { toast.error('Adicione pelo menos um exercício'); return; }
    const payload = {
      ...form,
      exercises: form.exercises.map((ex) => ({ ...ex, sets: Number(ex.sets), reps: Number(ex.reps), load: Number(ex.load), timeSeconds: Number(ex.timeSeconds) })),
    };
    try {
      if (editing) { await api.put(`/workouts/${editing.id}`, payload); toast.success('Treino atualizado'); }
      else { await api.post('/workouts', payload); toast.success('Treino criado'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este treino?')) return;
    await api.delete(`/workouts/${id}`);
    toast.success('Treino excluído');
    load();
  };

  return (
    <div data-testid="personal-treinos-page">
      <PageHeader
        title="Treinos"
        subtitle="Fichas de treino dos seus alunos"
        action={<Button onClick={() => open(null)} data-testid="add-treino-button"><Plus size={14} className="inline mr-1" />Novo Treino</Button>}
      />
      {workouts.length === 0 ? (
        <Empty text="Nenhum treino criado ainda" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workouts.map((w) => (
            <Card key={w.id} className="p-5 fade-up" data-testid={`treino-card-${w.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-tight">{w.name}</h3>
                  <p className="text-sm text-muted">{w.studentId?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => open(w)} className="text-muted hover:text-white transition-colors" data-testid={`edit-treino-${w.id}`} aria-label="Editar"><Pencil size={15} /></button>
                  <button onClick={() => remove(w.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-treino-${w.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {w.days.sort().map((d) => <Badge key={d} tone="danger">{DAYS[d]}</Badge>)}
              </div>
              <div className="space-y-1.5">
                {w.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-line pb-1.5 last:border-0">
                    <span>{ex.name}</span>
                    <span className="text-muted">
                      {ex.sets}x{ex.reps}{ex.load ? ` · ${ex.load}kg` : ''}{ex.timeSeconds ? ` · ${ex.timeSeconds}s` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Treino' : 'Novo Treino'} wide>
        <form onSubmit={save} className="space-y-4" data-testid="treino-form">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome do Treino"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Treino A — Peito e Tríceps" data-testid="treino-name-input" /></Field>
            <Field label="Aluna">
              <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required data-testid="treino-aluno-select">
                <option value="">Selecione a aluna</option>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Dias da semana">
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  data-testid={`treino-day-${i}`}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border transition-colors ${
                    form.days.includes(i) ? 'bg-accent border-accent text-white' : 'border-line text-muted hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Adicionar exercício do catálogo">
            <div className="flex gap-2">
              <Select value={pickExercise} onChange={(e) => setPickExercise(e.target.value)} data-testid="treino-exercise-picker">
                <option value="">Selecione um exercício</option>
                {catalog.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscleGroup})</option>)}
              </Select>
              <Button type="button" variant="ghost" onClick={addExercise} data-testid="treino-add-exercise-button">Adicionar</Button>
            </div>
          </Field>
          {form.exercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Exercícios do treino</p>
              {form.exercises.map((ex, i) => (
                <div key={i} className="bg-surface border border-line rounded p-3" data-testid={`treino-exercise-row-${i}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{ex.name}</span>
                    <button type="button" onClick={() => removeEx(i)} className="text-muted hover:text-accent transition-colors" aria-label="Remover"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div><label className="text-[10px] uppercase text-muted">Séries</label><Input type="number" min="0" value={ex.sets} onChange={(e) => updateEx(i, 'sets', e.target.value)} /></div>
                    <div><label className="text-[10px] uppercase text-muted">Reps</label><Input type="number" min="0" value={ex.reps} onChange={(e) => updateEx(i, 'reps', e.target.value)} /></div>
                    <div><label className="text-[10px] uppercase text-muted">Carga kg</label><Input type="number" step="0.5" min="0" value={ex.load} onChange={(e) => updateEx(i, 'load', e.target.value)} /></div>
                    <div><label className="text-[10px] uppercase text-muted">Tempo s</label><Input type="number" min="0" value={ex.timeSeconds} onChange={(e) => updateEx(i, 'timeSeconds', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button type="submit" className="w-full" data-testid="treino-save-button">Salvar Treino</Button>
        </form>
      </Modal>
    </div>
  );
}
