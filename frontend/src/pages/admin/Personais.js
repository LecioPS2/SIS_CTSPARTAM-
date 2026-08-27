import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', email: '', password: '', phone: '' };

export default function Personais() {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => api.get('/users?role=personal').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const open = (p) => {
    setEditing(p || null);
    setForm(p ? { name: p.name, email: p.email, password: '', phone: p.phone || '' } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, role: 'personal' };
    if (!payload.password) delete payload.password;
    try {
      if (editing) { await api.put(`/users/${editing.id}`, payload); toast.success('Personal atualizado'); }
      else { await api.post('/users', payload); toast.success('Personal cadastrado'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este personal?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Personal excluído');
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="admin-personais-page">
      <PageHeader
        title="Personais"
        subtitle={`${list.length} personal(is) cadastrado(s)`}
        action={<Button onClick={() => open(null)} data-testid="add-personal-button"><Plus size={14} className="inline mr-1" />Novo Personal</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {list.length === 0 ? (
          <div className="p-6"><Empty text="Nenhum personal cadastrado ainda" /></div>
        ) : (
          <table className="w-full" data-testid="personais-table">
            <thead><tr><Th>Nome</Th><Th>Email</Th><Th>Telefone</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="text-muted">{p.email}</Td>
                  <Td>{p.phone || '—'}</Td>
                  <Td><Badge tone={p.active ? 'ok' : 'danger'}>{p.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => open(p)} className="text-muted hover:text-white transition-colors" data-testid={`edit-personal-${p.id}`} aria-label="Editar"><Pencil size={15} /></button>
                      <button onClick={() => remove(p.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-personal-${p.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Personal' : 'Novo Personal'}>
        <form onSubmit={save} className="space-y-4" data-testid="personal-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="personal-name-input" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required data-testid="personal-email-input" /></Field>
          <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} data-testid="personal-password-input" /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} data-testid="personal-phone-input" /></Field>
          <Button type="submit" className="w-full" data-testid="personal-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
