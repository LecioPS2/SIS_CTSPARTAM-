import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', email: '', password: '', phone: '', personalId: '', planId: '', goal: '' };

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [personais, setPersonais] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.get('/users?role=aluno').then((r) => setAlunos(r.data));
    api.get('/users?role=personal').then((r) => setPersonais(r.data));
    api.get('/plans').then((r) => setPlans(r.data));
  };
  useEffect(() => { load(); }, []);

  const open = (aluno) => {
    setEditing(aluno || null);
    setForm(aluno ? { name: aluno.name, email: aluno.email, password: '', phone: aluno.phone || '', personalId: aluno.personalId?.id || aluno.personalId || '', planId: aluno.planId?.id || aluno.planId || '', goal: aluno.goal || '' } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, role: 'aluno', personalId: form.personalId || null, planId: form.planId || null };
    if (!payload.password) delete payload.password;
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        toast.success('Aluno atualizado');
      } else {
        await api.post('/users', payload);
        toast.success('Aluno cadastrado');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este aluno?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Aluno excluído');
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="admin-alunos-page">
      <PageHeader
        title="Alunos"
        subtitle={`${alunos.length} aluno(s) cadastrado(s)`}
        action={<Button onClick={() => open(null)} data-testid="add-aluno-button"><Plus size={14} className="inline mr-1" />Novo Aluno</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {alunos.length === 0 ? (
          <div className="p-6"><Empty text="Nenhum aluno cadastrado ainda" /></div>
        ) : (
          <table className="w-full" data-testid="alunos-table">
            <thead><tr><Th>Nome</Th><Th>Email</Th><Th>Personal</Th><Th>Plano</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.personalId?.name || '—'}</Td>
                  <Td>{a.planId?.name || '—'}</Td>
                  <Td><Badge tone={a.active ? 'ok' : 'danger'}>{a.active ? 'Ativo' : 'Inativo'}</Badge></Td>
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
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Aluno' : 'Novo Aluno'}>
        <form onSubmit={save} className="space-y-4" data-testid="aluno-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="aluno-name-input" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required data-testid="aluno-email-input" /></Field>
          <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} data-testid="aluno-password-input" /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} data-testid="aluno-phone-input" /></Field>
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
          <Field label="Objetivo"><Input value={form.goal} onChange={set('goal')} placeholder="Ex: hipertrofia, emagrecimento" data-testid="aluno-goal-input" /></Field>
          <Button type="submit" className="w-full" data-testid="aluno-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
