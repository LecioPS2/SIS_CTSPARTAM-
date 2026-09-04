import React, { useState, useRef, useEffect } from 'react';
import { PageHeader, Card, Field, Input, Button } from '../../components/ui';
import { Settings, Save, Bell, Share2, Instagram, Facebook, Youtube, Globe, Phone, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function Configuracoes() {
  const { user } = useAuth();
  const [tab, setTab] = useState('perfil');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const [social, setSocial] = useState({
    site: 'https://ctspartan.com',
    instagram: 'https://instagram.com/ctspartan',
    whatsapp: '5511999999999',
    tiktok: 'https://tiktok.com/@ctspartan'
  });

  useEffect(() => {
    const saved = localStorage.getItem('gym_social_settings');
    if (saved) setSocial(JSON.parse(saved));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Configurações salvas com sucesso');
  };

  const handleSaveSocial = (e) => {
    e.preventDefault();
    localStorage.setItem('gym_social_settings', JSON.stringify(social));
    toast.success('Links de acesso rápido atualizados!');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Foto de perfil atualizada!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="admin-config-page">
      <PageHeader title="Configurações" subtitle="Gerencie as preferências do sistema e os dados da academia" />
      
      {/* Abas */}
      <div className="flex gap-6 mb-6 border-b border-line pb-px">
        <button 
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'perfil' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
          onClick={() => setTab('perfil')}
        >
          Meu Perfil
        </button>
        <button 
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'institucional' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
          onClick={() => setTab('institucional')}
        >
          Institucional & Redes Sociais
        </button>
        {user?.role === 'admin' && (
          <button 
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'acessos' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
            onClick={() => setTab('acessos')}
          >
            Gestão de Acessos
          </button>
        )}
      </div>

      {/* Aba: Meu Perfil */}
      {tab === 'perfil' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
          <div className="md:col-span-2">
            <Card className="p-6">
              <h3 className="font-display text-xl uppercase mb-6 tracking-wide border-b border-line pb-4">Dados da Conta</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <Field label="Nome Completo">
                  <Input defaultValue={user.name} />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="E-mail">
                    <Input defaultValue={user.email} disabled />
                  </Field>
                  <Field label="Telefone">
                    <Input defaultValue={user.phone || ''} placeholder="(00) 00000-0000" />
                  </Field>
                </div>
                <div className="pt-4 border-t border-line mt-4">
                  <Button type="submit"><Save size={16} className="inline mr-2" /> Salvar Perfil</Button>
                </div>
              </form>
            </Card>
          </div>
          
          <div>
            <Card className="p-6 text-center">
              <h3 className="font-display text-xl uppercase mb-6 tracking-wide border-b border-line pb-4 text-left">Foto de Perfil</h3>
              <div className="flex flex-col items-center gap-4">
                {user.avatarUrl ? (
                  <img src={`${backendUrl}${user.avatarUrl}`} alt="Perfil" className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-xl" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-surface border border-line flex items-center justify-center text-muted text-3xl font-display">
                    {user.name.charAt(0)}
                  </div>
                )}
                
                <Button variant="ghost" className="w-full text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Enviando...' : 'Trocar Foto'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="mt-8 text-left space-y-2">
                <Button variant="ghost" className="w-full justify-start text-muted hover:text-white text-sm">
                  Alterar Minha Senha
                </Button>
                <div className="pt-4 mt-4 border-t border-line">
                  <Button variant="danger" className="w-full justify-start text-sm">
                    Encerrar Sessões Ativas
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Aba: Institucional */}
      {tab === 'institucional' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-line pb-4">
                <Settings className="text-accent" size={20} />
                <h3 className="font-display text-xl uppercase tracking-wide">Dados da Academia</h3>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <Field label="Nome da Academia">
                  <Input defaultValue="CT Spartan" />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="E-mail de Contato">
                    <Input defaultValue="contato@ctspartan.com" type="email" />
                  </Field>
                  <Field label="Telefone">
                    <Input defaultValue="(11) 99999-9999" />
                  </Field>
                </div>
                <Field label="Endereço">
                  <Input defaultValue="Rua dos Espartanos, 300 - Centro" />
                </Field>
                <div className="pt-4 border-t border-line mt-4">
                  <Button type="submit"><Save size={16} className="inline mr-2" /> Salvar Dados</Button>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-line pb-4">
                <Share2 className="text-accent" size={20} />
                <h3 className="font-display text-xl uppercase tracking-wide">Acesso Rápido & Redes Sociais</h3>
              </div>
              <form onSubmit={handleSaveSocial} className="space-y-4">
                <Field label="Site Oficial (URL)">
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <Input value={social.site} onChange={(e) => setSocial({...social, site: e.target.value})} className="pl-9" placeholder="https://" />
                  </div>
                </Field>
                <Field label="Instagram (URL)">
                  <div className="relative">
                    <Instagram size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <Input value={social.instagram} onChange={(e) => setSocial({...social, instagram: e.target.value})} className="pl-9" placeholder="https://" />
                  </div>
                </Field>
                <Field label="WhatsApp (Apenas números com DDI, ex: 5511999999999)">
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <Input value={social.whatsapp} onChange={(e) => setSocial({...social, whatsapp: e.target.value})} className="pl-9" placeholder="5511999999999" />
                  </div>
                </Field>
                <Field label="TikTok (URL)">
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <Input value={social.tiktok} onChange={(e) => setSocial({...social, tiktok: e.target.value})} className="pl-9" placeholder="https://" />
                  </div>
                </Field>
                <div className="pt-4 border-t border-line mt-4">
                  <Button type="submit"><Save size={16} className="inline mr-2" /> Atualizar Links Rápidos</Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-line pb-4">
                <Bell className="text-accent" size={20} />
                <h3 className="font-display text-xl uppercase tracking-wide">Notificações Globais</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-accent w-4 h-4 bg-surface border-line rounded" />
                  <span className="text-sm">Alertas de Vencimento</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-accent w-4 h-4 bg-surface border-line rounded" />
                  <span className="text-sm">Novas Alunas Matriculadas</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-accent w-4 h-4 bg-surface border-line rounded" />
                  <span className="text-sm">Relatórios Semanais por E-mail</span>
                </label>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Aba: Acessos */}
      {tab === 'acessos' && user?.role === 'admin' && <GestaoAcessos />}
    </div>
  );
}

function GestaoAcessos() {
  const [assessores, setAssessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchAssessores();
  }, []);

  const fetchAssessores = async () => {
    try {
      const { data } = await api.get('/users?role=assessor');
      setAssessores(data);
    } catch (err) {
      toast.error('Erro ao carregar assessores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', { ...form, role: 'assessor' });
      toast.success('Assessor criado com sucesso!');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchAssessores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar assessor');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/users/${id}`, { active: !currentStatus });
      toast.success('Status atualizado!');
      fetchAssessores();
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="fade-up space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl uppercase tracking-wide">Assessores</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Novo Assessor'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome">
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </Field>
              <Field label="E-mail">
                <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </Field>
              <Field label="Senha">
                <Input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </Field>
              <Field label="Telefone">
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </Field>
            </div>
            <div className="pt-4 border-t border-line">
              <Button type="submit"><Save size={16} className="inline mr-2" /> Salvar Assessor</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">E-mail</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {assessores.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-muted">Nenhum assessor cadastrado</td>
                </tr>
              ) : (
                assessores.map(assessor => (
                  <tr key={assessor.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">{assessor.name}</td>
                    <td className="px-6 py-4">{assessor.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${assessor.active ? 'bg-ok/20 text-ok' : 'bg-danger/20 text-danger'}`}>
                        {assessor.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(assessor.id, assessor.active)}>
                        {assessor.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
