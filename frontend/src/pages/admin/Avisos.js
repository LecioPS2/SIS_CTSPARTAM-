import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, PageHeader, Badge, Empty, Th, Td } from '../../components/ui';
import { Megaphone, Plus, Trash2, Users } from 'lucide-react';

export default function Avisos() {
  const [notices, setNotices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'todos', active: true });

  const load = () => {
    api.get('/notices').then(r => setNotices(r.data)).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', form);
      toast.success('Aviso criado com sucesso!');
      setModal(false);
      setForm({ title: '', message: '', targetRole: 'todos', active: true });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar aviso');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este aviso?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Aviso removido');
      load();
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  const getRoleLabel = (r) => {
    if (r === 'todos') return 'Todos';
    if (r === 'aluno') return 'Alunas';
    if (r === 'personal') return 'Personais';
    return r;
  };

  return (
    <div className="space-y-6 fade-up">
      <PageHeader 
        title="Mural de Avisos" 
        subtitle="Crie comunicados globais que aparecerão nas notificações dos usuários."
        action={<Button onClick={() => setModal(true)}><Plus size={16} className="mr-2 inline" /> Novo Aviso</Button>}
      />

      <Card className="overflow-hidden">
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          {notices.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Empty title="Nenhum aviso" subtitle="Os comunicados criados aparecerão aqui." />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line/50 text-muted bg-surface/10">
                  <Th>Comunicado</Th>
                  <Th>Público Alvo</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {notices.map(n => (
                  <tr key={n.id} className="hover:bg-surface/30 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <Megaphone size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-white/90">{n.title}</p>
                          <p className="text-xs text-muted mt-1 max-w-sm truncate">{n.message}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={n.targetRole === 'todos' ? 'ok' : 'muted'} className="flex items-center gap-1 w-fit">
                        <Users size={12} /> {getRoleLabel(n.targetRole)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={n.active ? 'ok' : 'muted'}>{n.active ? 'Ativo' : 'Inativo'}</Badge>
                    </Td>
                    <Td>
                      <button onClick={() => remove(n.id)} className="p-2 text-muted hover:text-accent transition-colors bg-surface rounded-lg hover:bg-accent/10">
                        <Trash2 size={16} />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Comunicado">
        <form onSubmit={save} className="space-y-4">
          <Field label="Público Alvo">
            <Select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
              <option value="todos">Todos (Alunas e Personais)</option>
              <option value="aluno">Apenas Alunas</option>
              <option value="personal">Apenas Personais</option>
            </Select>
          </Field>
          <Field label="Título (Obrigatório)">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Feriado nesta Sexta-feira" />
          </Field>
          <Field label="Mensagem Completa (Obrigatório)">
            <textarea 
              required
              rows={4}
              value={form.message} 
              onChange={(e) => setForm({ ...form, message: e.target.value })} 
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-sm placeholder-muted focus:outline-none focus:border-accent text-white resize-none"
              placeholder="Digite o recado completo..."
            />
          </Field>
          <Button type="submit" className="w-full">Publicar Aviso</Button>
        </form>
      </Modal>
    </div>
  );
}
