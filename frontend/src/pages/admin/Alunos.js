import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Textarea, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', email: '', password: '', phone: '', birthDate: '', personalId: '', planId: '', goal: '', healthConditions: '', medications: '', injuries: '', experienceLevel: '', trainingFrequency: '', anamnesisNotes: '' };

export default function Alunos() {
  const [alunas, setAlunas] = useState([]);
  const [personais, setPersonais] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState(1);

  const load = () => {
    api.get('/users?role=aluno').then((r) => setAlunas(r.data));
    api.get('/users?role=personal').then((r) => setPersonais(r.data));
    api.get('/plans').then((r) => setPlans(r.data));
  };
  useEffect(() => { load(); }, []);

  const open = (a) => {
    setEditing(a || null);
    setForm(a ? {
      name: a.name, email: a.email, password: '', phone: a.phone || '', birthDate: a.birthDate || '',
      personalId: a.personalId?.id || a.personalId || '', planId: a.planId?.id || a.planId || '',
      goal: a.goal || '', healthConditions: a.healthConditions || '', medications: a.medications || '',
      injuries: a.injuries || '', experienceLevel: a.experienceLevel || '', trainingFrequency: a.trainingFrequency || '',
      anamnesisNotes: a.anamnesisNotes || '',
    } : empty);
    setStep(1);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, role: 'aluno', personalId: form.personalId || null, planId: form.planId || null };
    if (!payload.password) delete payload.password;
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        toast.success('Aluna atualizada');
      } else {
        await api.post('/users', payload);
        toast.success('Aluna cadastrada');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir esta aluna?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Aluna excluída');
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div data-testid="admin-alunos-page">
      <PageHeader
        title="Alunas"
        subtitle="Gerencie o cadastro e planos das alunas"
        action={<Button onClick={() => open()} data-testid="new-aluno-button"><Plus size={16} className="inline mr-2" /> Nova Aluna</Button>}
      />
      <Card>
        {alunas.length === 0 ? (
          <Empty title="Nenhuma aluna encontrada" subtitle="Cadastre a primeira aluna para começar." />
        ) : (
          <table className="w-full text-left border-collapse" data-testid="alunos-table">
            <thead>
              <tr className="border-b border-line text-muted text-xs uppercase tracking-wider">
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Plano</Th>
                <Th>Personal</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {alunas.map((a) => (
                <tr key={a.id} className="hover:bg-surface/50 transition-colors" data-testid={`aluno-row-${a.id}`}>
                  <Td className="font-medium text-white">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.planId ? <Badge>{a.planId.name}</Badge> : <span className="text-muted text-xs">Sem plano</span>}</Td>
                  <Td>{a.personalId ? <span className="text-sm text-white/90">{a.personalId.name}</span> : <span className="text-muted text-xs">Sem personal</span>}</Td>
                  <Td className="text-right">
                    <button onClick={() => open(a)} className="p-2 text-muted hover:text-accent transition-colors" data-testid={`edit-aluno-${a.id}`}><Pencil size={16} /></button>
                    <button onClick={() => remove(a.id)} className="p-2 text-muted hover:text-accent transition-colors"><Trash2 size={16} /></button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => { setModal(false); setStep(1); }} title={editing ? 'Editar Aluna' : 'Nova Aluna'} wide>
        
        {/* Indicador de Passos */}
        <div className="flex justify-between items-center mb-8 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-line -z-10 -translate-y-1/2"></div>
          {[
            { id: 1, label: 'Dados Básicos' },
            { id: 2, label: 'Saúde & Restrições' },
            { id: 3, label: 'Metas & Treino' }
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-card px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface text-muted border border-line'}`}>
                {s.id}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${step >= s.id ? 'text-white' : 'text-muted'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) setStep(step + 1);
          else save(e);
        }} className="space-y-6" data-testid="aluno-form">
          
          {/* PASSO 1: DADOS BÁSICOS */}
          {step === 1 && (
            <div className="space-y-4 fade-up">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome"><Input value={form.name} onChange={set('name')} required autoFocus /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
                <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} /></Field>
                <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} /></Field>
                <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={set('birthDate')} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line mt-2">
                <Field label="Vincular Personal">
                  <Select value={form.personalId} onChange={set('personalId')}>
                    <option value="">Sem personal</option>
                    {personais.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <Field label="Vincular Plano">
                  <Select value={form.planId} onChange={set('planId')}>
                    <option value="">Sem plano</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {/* PASSO 2: SAÚDE E RESTRIÇÕES */}
          {step === 2 && (
            <div className="space-y-4 fade-up">
              <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Anamnese de Saúde</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Possui alguma doença? (Hipertensão, Diabetes, etc)">
                  <Input value={form.healthConditions} onChange={set('healthConditions')} placeholder="Detalhe se houver..." autoFocus />
                </Field>
                <Field label="Faz uso contínuo de medicamentos?">
                  <Input value={form.medications} onChange={set('medications')} placeholder="Quais medicamentos?" />
                </Field>
                <Field label="Lesões ou cirurgias recentes?">
                  <Input value={form.injuries} onChange={set('injuries')} placeholder="Joelho, coluna, ombro..." />
                </Field>
              </div>
            </div>
          )}

          {/* PASSO 3: METAS E TREINO */}
          {step === 3 && (
            <div className="space-y-4 fade-up">
              <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Plano de Ação</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Meta / Objetivo Principal">
                  <Input value={form.goal} onChange={set('goal')} placeholder="Ex: Hipertrofia, emagrecimento..." autoFocus />
                </Field>
                <Field label="Nível de experiência">
                  <Select value={form.experienceLevel} onChange={set('experienceLevel')}>
                    <option value="">Selecione</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediaria">Intermediária</option>
                    <option value="avancada">Avançada</option>
                  </Select>
                </Field>
                <Field label="Frequência semanal desejada">
                  <Select value={form.trainingFrequency} onChange={set('trainingFrequency')}>
                    <option value="">Selecione</option>
                    <option value="1-2x">1–2x por semana</option>
                    <option value="3-4x">3–4x por semana</option>
                    <option value="5-6x">5–6x por semana</option>
                    <option value="todos os dias">Todos os dias</option>
                  </Select>
                </Field>
              </div>
              <Field label="Observações gerais e restrições extras">
                <Textarea value={form.anamnesisNotes} onChange={set('anamnesisNotes')} placeholder="Outras informações relevantes para o Personal..." rows={3} />
              </Field>
            </div>
          )}

          {/* Botões de Navegação */}
          <div className="flex gap-4 pt-6 mt-4 border-t border-line">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">
                Voltar
              </Button>
            )}
            <Button type="submit" className="flex-1 shadow-lg shadow-accent/20">
              {step < 3 ? 'Próximo Passo' : 'Salvar Aluna'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
