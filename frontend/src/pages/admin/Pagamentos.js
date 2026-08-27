import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';

const empty = { studentId: '', planId: '', amount: '', dueDate: '', status: 'pendente', method: '' };

export default function Pagamentos() {
  const [payments, setPayments] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.get('/payments').then((r) => setPayments(r.data));
    api.get('/users?role=aluno').then((r) => setAlunos(r.data));
    api.get('/plans').then((r) => setPlans(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount), planId: form.planId || null });
      toast.success('Pagamento registrado');
      setModal(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const markPaid = async (id) => {
    await api.put(`/payments/${id}`, { status: 'pago' });
    toast.success('Pagamento confirmado');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este pagamento?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Pagamento excluído');
    load();
  };

  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'planId') {
      const plan = plans.find((p) => p.id === v);
      setForm({ ...form, planId: v, amount: plan ? plan.price : form.amount });
    } else setForm({ ...form, [k]: v });
  };

  const statusTone = { pago: 'ok', pendente: 'warn', atrasado: 'danger' };

  return (
    <div data-testid="admin-pagamentos-page">
      <PageHeader
        title="Pagamentos"
        subtitle="Controle de mensalidades e cobranças"
        action={<Button onClick={() => { setForm(empty); setModal(true); }} data-testid="add-pagamento-button"><Plus size={14} className="inline mr-1" />Novo Pagamento</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {payments.length === 0 ? (
          <div className="p-6"><Empty text="Nenhum pagamento registrado ainda" /></div>
        ) : (
          <table className="w-full" data-testid="pagamentos-table">
            <thead><tr><Th>Aluna</Th><Th>Plano</Th><Th>Valor</Th><Th>Vencimento</Th><Th>Pago em</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{p.studentId?.name || '—'}</Td>
                  <Td>{p.planId?.name || '—'}</Td>
                  <Td>{brl(p.amount)}</Td>
                  <Td>{fmtDate(p.dueDate)}</Td>
                  <Td>{fmtDate(p.paidAt)}</Td>
                  <Td><Badge tone={statusTone[p.status]}>{p.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      {p.status !== 'pago' && (
                        <button onClick={() => markPaid(p.id)} className="text-muted hover:text-ok transition-colors" data-testid={`mark-paid-${p.id}`} aria-label="Marcar como pago" title="Marcar como pago"><CheckCircle2 size={15} /></button>
                      )}
                      <button onClick={() => remove(p.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-pagamento-${p.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Pagamento">
        <form onSubmit={save} className="space-y-4" data-testid="pagamento-form">
          <Field label="Aluna">
            <Select value={form.studentId} onChange={set('studentId')} required data-testid="pagamento-aluno-select">
              <option value="">Selecione a aluna</option>
              {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Plano">
            <Select value={form.planId} onChange={set('planId')} data-testid="pagamento-plano-select">
              <option value="">Sem plano</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {brl(p.price)}</option>)}
            </Select>
          </Field>
          <Field label="Valor (R$)"><Input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} required data-testid="pagamento-valor-input" /></Field>
          <Field label="Vencimento"><Input type="date" value={form.dueDate} onChange={set('dueDate')} required data-testid="pagamento-vencimento-input" /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')} data-testid="pagamento-status-select">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </Select>
          </Field>
          <Field label="Forma de pagamento"><Input value={form.method} onChange={set('method')} placeholder="Pix, cartão, dinheiro..." data-testid="pagamento-metodo-input" /></Field>
          <Button type="submit" className="w-full" data-testid="pagamento-save-button">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
