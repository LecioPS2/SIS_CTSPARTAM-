import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Field } from './ui';
import api from '../lib/api';
import { toast } from 'sonner';
import { Search, Send, CheckSquare, Square, Users } from 'lucide-react';

export default function WhatsAppModal({ open, onClose }) {
  const [alunas, setAlunas] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/users?role=aluno').then((r) => setAlunas(r.data));
      setSelected(new Set());
      setMessage('');
      setSearch('');
    }
  }, [open]);

  const filtered = alunas.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSend = async () => {
    if (selected.size === 0) return toast.error('Selecione pelo menos uma aluna.');
    if (!message.trim()) return toast.error('Digite a mensagem que deseja enviar.');

    setSending(true);
    // Simula disparo de mensagens (na vida real isso chamaria uma API do WhatsApp tipo Baileys/W-API)
    setTimeout(() => {
      setSending(false);
      toast.success(`Mensagem disparada com sucesso para ${selected.size} aluna(s)!`);
      onClose();
    }, 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Disparo de Mensagens (WhatsApp)" wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Esquerda: Lista de Alunas */}
        <div className="flex flex-col h-[500px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2 mb-4">
            <Users size={16} /> Selecione os Destinatários
          </h3>
          
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar aluna..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-ok focus:ring-1 focus:ring-ok outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={toggleAll} className="text-xs text-ok hover:text-ok/80 flex items-center gap-2 transition-colors">
              {selected.size > 0 && selected.size === filtered.length ? <CheckSquare size={14} /> : <Square size={14} />}
              Selecionar Todas
            </button>
            <span className="text-xs text-muted">{selected.size} selecionada(s)</span>
          </div>

          <div className="flex-1 overflow-y-auto border border-line rounded-lg bg-surface/30 p-2 space-y-1">
            {filtered.length === 0 && (
              <p className="text-xs text-center text-muted p-4">Nenhuma aluna encontrada.</p>
            )}
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`w-full flex items-center justify-between p-3 rounded-md text-sm transition-colors text-left ${selected.has(a.id) ? 'bg-ok/10 border border-ok/30' : 'hover:bg-surface border border-transparent'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${selected.has(a.id) ? 'bg-ok text-white' : 'bg-line text-muted'}`}>
                    {a.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className={`font-medium truncate ${selected.has(a.id) ? 'text-ok' : 'text-white'}`}>{a.name}</p>
                    <p className="text-xs text-muted truncate">{a.phone || 'Sem número'}</p>
                  </div>
                </div>
                {selected.has(a.id) && <CheckSquare size={16} className="text-ok shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Direita: Editor de Mensagem */}
        <div className="flex flex-col h-[500px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2 mb-4">
            <Send size={16} /> Compor Mensagem
          </h3>
          
          <div className="bg-ok/10 border border-ok/20 rounded-lg p-4 mb-4">
            <p className="text-xs text-ok/90 font-medium">Dica de Personalização:</p>
            <p className="text-xs text-white/70 mt-1">
              Use a variável <strong className="text-ok">{"{nome}"}</strong> para substituir automaticamente pelo primeiro nome de cada aluna na hora do envio.
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            <Field label="Mensagem">
              <Textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ex: Olá {nome}, não esqueça do seu treino amanhã!" 
                className="flex-1 resize-none bg-surface/50 border-line text-sm min-h-[250px]" 
              />
            </Field>
          </div>

          <div className="pt-4 border-t border-line mt-auto">
            <Button 
              onClick={handleSend} 
              disabled={sending || selected.size === 0 || !message.trim()}
              className="w-full bg-ok hover:bg-ok/80 text-white shadow-lg shadow-ok/20 flex items-center justify-center gap-2 py-3"
            >
              {sending ? 'Enviando Mensagens...' : (
                <>
                  <Send size={18} />
                  Disparar para {selected.size} Aluna(s)
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
