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

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="admin-alunos-page">
      <PageHeader
        title="Alunas"
        subtitle={`${alunas.length} aluna(s) cadastrada(s)`}
        action={<Button onClick={() => open(null)} data-testid="add-aluno-button"><Plus size={14} className="inline mr-1" />Nova Aluna</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {alunas.length === 0 ? (
          <div className="p-6"><Empty text="Nenhuma aluna cadastrada ainda" /></div>
        ) : (
          <table className="w-full" data-testid="alunos-table">
            <thead><tr><Th>Nome</Th><Th>Email</Th><Th>Personal</Th><Th>Plano</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {alunas.map((a) => (
                <tr key={a.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.personalId?.name || '—'}</Td>
                  <Td>{a.planId?.name || '—'}</Td>
                  <Td><Badge tone={a.active ? 'ok' : 'danger'}>{a.active ? 'Ativa' : 'Inativa'}</Badge></Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => open(a)} className="text-muted hover:text-white transition-colors" data-testid={`edit-aluno-${a.id}`} aria-label="Editar"><Pencil size={15} /></button>
                      <button onClick={() => remove(a.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-aluno-${a.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Aluna' : 'Nova Aluna'} wide>
        <form onSubmit={save} className="space-y-4" data-testid="aluno-form">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Dados da aluna</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="aluno-name-input" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required data-testid="aluno-email-input" /></Field>
            <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} data-testid="aluno-password-input" /></Field>
            <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} data-testid="aluno-phone-input" /></Field>
            <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={set('birthDate')} data-testid="aluno-nascimento-input" /></Field>
            <Field label="Personal">
              <Select value={form.personalId} onChange={set('personalId')} data-testid="aluno-personal-select">
                <option value="">Sem personal</option>
                {personais.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Plano">
              <Select value={form.planId} onChange={set('planId')} data-testid="aluno-plan-select">
                <option value="">Sem plano</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent pt-2 border-t border-line">Questionário (Anamnese)</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Meta / Objetivo"><Input value={form.goal} onChange={set('goal')} placeholder="Ex: hipertrofia, emagrecimento" data-testid="aluno-goal-input" /></Field>
            <Field label="Nível de experiência">
              <Select value={form.experienceLevel} onChange={set('experienceLevel')} data-testid="aluno-experiencia-select">
                <option value="">Selecione</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediaria">Intermediária</option>
                <option value="avancada">Avançada</option>
              </Select>
            </Field>
            <Field label="Possui alguma doença?"><Input value={form.healthConditions} onChange={set('healthConditions')} placeholder="Ex: hipertensão, diabetes, nenhuma" data-testid="aluno-doencas-input" /></Field>
            <Field label="Faz uso de medicamentos?"><Input value={form.medications} onChange={set('medications')} placeholder="Ex: quais medicamentos, ou nenhum" data-testid="aluno-medicamentos-input" /></Field>
            <Field label="Lesões ou cirurgias"><Input value={form.injuries} onChange={set('injuries')} placeholder="Ex: lesão no joelho, nenhuma" data-testid="aluno-lesoes-input" /></Field>
            <Field label="Frequência semanal desejada">
              <Select value={form.trainingFrequency} onChange={set('trainingFrequency')} data-testid="aluno-frequencia-select">
                <option value="">Selecione</option>
                <option value="1-2x">1–2x por semana</option>
                <option value="3-4x">3–4x por semana</option>
                <option value="5-6x">5–6x por semana</option>
                <option value="todos os dias">Todos os dias</option>
              </Select>
            </Field>
          </div>
          <Field label="Observações gerais"><Textarea value={form.anamnesisNotes} onChange={set('anamnesisNotes')} placeholder="Outras informações relevantes" data-testid="aluno-observacoes-input" /></Field>
          <Button type="submit" className="w-full" data-testid="aluno-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
