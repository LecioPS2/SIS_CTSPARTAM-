import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PlanosAlimentares() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentId: '', title: '', goal: '', notes: '', meals: [] });

  const load = async () => {
    try {
      const [rDiets, rUsers] = await Promise.all([
        api.get('/diets'),
        api.get('/users')
      ]);
      setList(rDiets.data);
      // Admin ve todos alunos, Personal so os dele
      setAlunos(rUsers.data.filter(u => u.role === 'aluno' && (user.role === 'admin' || u.personalId === user.id)));
    } catch (e) {
      toast.error('Erro ao carregar dados');
    }
  };
  useEffect(() => { load(); }, []);

  const open = (diet) => {
    setEditing(diet || null);
    setForm(diet ? {
      studentId: diet.studentId?.id || diet.studentId,
      title: diet.title,
      goal: diet.goal || '',
      notes: diet.notes || '',
      meals: diet.meals || []
    } : { studentId: '', title: '', goal: '', notes: '', meals: [] });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.studentId) return toast.error('Selecione uma aluna');
    if (form.meals.length === 0) return toast.error('Adicione pelo menos uma refeição');
    
    try {
      if (editing) {
        await api.put('/diets/' + editing.id, form);
      } else {
        await api.post('/diets', form);
      }
      toast.success(editing ? 'Plano atualizado!' : 'Plano criado!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este plano alimentar?')) return;
    await api.delete('/diets/' + id);
    toast.success('Plano excluído');
    load();
  };

  const addMeal = () => {
    setForm({ ...form, meals: [...form.meals, { name: '', time: '', items: [] }] });
  };
  
  const removeMeal = (index) => {
    const m = [...form.meals];
    m.splice(index, 1);
    setForm({ ...form, meals: m });
  };

  const updateMeal = (index, field, value) => {
    const m = [...form.meals];
    m[index][field] = value;
    setForm({ ...form, meals: m });
  };

  const addItem = (mealIndex) => {
    const m = [...form.meals];
    m[mealIndex].items.push({ food: '', quantity: '' });
    setForm({ ...form, meals: m });
  };

  const updateItem = (mealIndex, itemIndex, field, value) => {
    const m = [...form.meals];
    m[mealIndex].items[itemIndex][field] = value;
    setForm({ ...form, meals: m });
  };

  const removeItem = (mealIndex, itemIndex) => {
    const m = [...form.meals];
    m[mealIndex].items.splice(itemIndex, 1);
    setForm({ ...form, meals: m });
  };

  return (
    <div data-testid="planos-alimentares-page">
      <PageHeader
        title="Planos Alimentares"
        subtitle="Gerencie as dietas e recomendações alimentares das alunas"
        action={<Button onClick={() => open(null)}><Plus size={14} className="inline mr-1" />Novo Plano</Button>}
      />

      <Card className="overflow-x-auto">
        {list.length === 0 ? (
          <div className="p-8"><Empty text="Nenhum plano alimentar cadastrado ainda" /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <Th>Aluna</Th>
                <Th>Título</Th>
                <Th>Objetivo</Th>
                <Th>Data</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id} className="border-b border-line/50 hover:bg-surface/50">
                  <Td>{d.studentId?.name || 'Aluna Removida'}</Td>
                  <Td className="font-medium text-white">{d.title}</Td>
                  <Td>{d.goal || '-'}</Td>
                  <Td>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => open(d)} className="text-muted hover:text-white"><Pencil size={15} /></button>
                      <button onClick={() => remove(d.id)} className="text-muted hover:text-accent"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Plano' : 'Novo Plano Alimentar'}>
        <form onSubmit={save} className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
          
          <Field label="Aluna">
            <Select value={form.studentId} onChange={(e) => setForm({...form, studentId: e.target.value})} required>
              <option value="">Selecione uma aluna...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título do Plano"><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Hipertrofia Fase 1" required /></Field>
            <Field label="Objetivo"><Input value={form.goal} onChange={e => setForm({...form, goal: e.target.value})} placeholder="Ex: Ganho de Massa" /></Field>
          </div>
          
          <Field label="Observações Gerais (Água, Suplementos)">
            <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Ex: Beber 3L de água por dia." />
          </Field>

          <div className="mt-6 pt-4 border-t border-line">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display uppercase tracking-tight text-white">Refeições</h3>
              <Button type="button" variant="ghost" onClick={addMeal}><Plus size={14} className="inline mr-1" /> Add Refeição</Button>
            </div>

            <div className="space-y-6">
              {form.meals.map((meal, mIdx) => (
                <div key={mIdx} className="p-4 bg-surface/30 border border-line rounded-lg">
                  <div className="flex gap-4 items-end mb-4">
                    <Field label="Nome da Refeição" className="flex-1">
                      <Input value={meal.name} onChange={e => updateMeal(mIdx, 'name', e.target.value)} placeholder="Ex: Café da Manhã" required />
                    </Field>
                    <Field label="Horário">
                      <Input type="time" value={meal.time} onChange={e => updateMeal(mIdx, 'time', e.target.value)} />
                    </Field>
                    <button type="button" onClick={() => removeMeal(mIdx)} className="text-accent hover:text-red-400 pb-3" title="Remover Refeição">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="pl-4 border-l-2 border-line/50 space-y-3">
                    {meal.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex gap-3 items-center">
                        <Input className="flex-2" value={item.food} onChange={e => updateItem(mIdx, iIdx, 'food', e.target.value)} placeholder="Alimento (Ex: Pão Integral)" required />
                        <Input className="flex-1" value={item.quantity} onChange={e => updateItem(mIdx, iIdx, 'quantity', e.target.value)} placeholder="Qtd (Ex: 2 fatias)" required />
                        <button type="button" onClick={() => removeItem(mIdx, iIdx)} className="text-muted hover:text-accent p-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" className="text-xs" onClick={() => addItem(mIdx)}>
                      <Plus size={12} className="inline mr-1" /> Adicionar Alimento
                    </Button>
                  </div>
                </div>
              ))}
              {form.meals.length === 0 && <p className="text-xs text-muted text-center py-4">Nenhuma refeição adicionada.</p>}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-line">
            <Button type="submit" className="w-full">Salvar Plano Alimentar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
