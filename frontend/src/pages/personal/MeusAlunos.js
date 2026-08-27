import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil } from 'lucide-react';

const empty = { name: '', email: '', password: '', phone: '', goal: '' };

export default function MeusAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => api.get('/users').then((r) => setAlunos(r.data));
  useEffect(() => { load(); }, []);

  const open = (a) => {
    setEditing(a || null);
    setForm(a ? { name: a.name, email: a.email, password: '', phone: a.phone || '', goal: a.goal || '' } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    try {
      if (editing) { await api.put(`/users/${editing.id}`, payload); toast.success('Aluno atualizado'); }
      else { await api.post('/users', payload); toast.success('Aluno cadastrado e vinculado a você'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="personal-alunos-page">
      <PageHeader
        title="Meus Alunos"
        subtitle={`${alunos.length} aluno(s) sob sua orientação`}
        action={<Button onClick={() => open(null)} data-testid="add-meu-aluno-button"><Plus size={14} className="inline mr-1" />Novo Aluno</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {alunos.length === 0 ? (
          <div className="p-6"><Empty text="Você ainda não tem alunos vinculados" /></div>
        ) : (
          <table className="w-full" data-testid="meus-alunos-table">
            <thead><tr><Th>Nome</Th><Th>Email</Th><Th>Telefone</Th><Th>Objetivo</Th><Th>Plano</Th><Th></Th></tr></thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.phone || '—'}</Td>
                  <Td>{a.goal || '—'}</Td>
                  <Td>{a.planId?.name ? <Badge tone="ok">{a.planId.name}</Badge> : <Badge>Sem plano</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button onClick={() => open(a)} className="text-muted hover:text-white transition-colors" data-testid={`edit-meu-aluno-${a.id}`} aria-label="Editar"><Pencil size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Aluno' : 'Novo Aluno'}>
        <form onSubmit={save} className="space-y-4" data-testid="meu-aluno-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="meu-aluno-name-input" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required data-testid="meu-aluno-email-input" /></Field>
          <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} data-testid="meu-aluno-password-input" /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} data-testid="meu-aluno-phone-input" /></Field>
          <Field label="Objetivo"><Input value={form.goal} onChange={set('goal')} placeholder="Ex: hipertrofia" data-testid="meu-aluno-goal-input" /></Field>
          <Button type="submit" className="w-full" data-testid="meu-aluno-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
