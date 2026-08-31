import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2, ImagePlus, Video } from 'lucide-react';

const GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Cardio', 'Corpo inteiro'];
const empty = { name: '', muscleGroup: 'Peito', sets: 3, reps: 12, load: 0, timeSeconds: 0, notes: '' };

export default function Exercicios() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoRef = useRef(null);

  const [uploading, setUploading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const load = () => api.get('/exercises').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const open = (ex) => {
    setEditing(ex || null);
    setForm(ex ? { name: ex.name, muscleGroup: ex.muscleGroup, sets: ex.sets, reps: ex.reps, load: ex.load, timeSeconds: ex.timeSeconds, notes: ex.notes || '' } : empty);
    setImageFile(null);
    setImagePreview(ex?.imageUrl ? `${backendUrl}${ex.imageUrl}` : null);
    setVideoFile(null);
    setVideoPreview(ex?.videoUrl ? `${backendUrl}${ex.videoUrl}` : null);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, sets: Number(form.sets), reps: Number(form.reps), load: Number(form.load), timeSeconds: Number(form.timeSeconds) };
    try {
      setUploading(true);
      let savedId;
      if (editing) {
        await api.put(`/exercises/${editing.id}`, payload);
        savedId = editing.id;
      } else {
        const res = await api.post('/exercises', payload);
        savedId = res.data.id;
      }

      // Uploads em paralelo
      const uploads = [];
      if (imageFile && savedId) {
        const fdImg = new FormData();
        fdImg.append('file', imageFile);
        uploads.push(api.post(`/uploads/exercise/${savedId}`, fdImg, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }
      if (videoFile && savedId) {
        const fdVid = new FormData();
        fdVid.append('file', videoFile);
        uploads.push(api.post(`/uploads/exercise/${savedId}/video`, fdVid, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }

      if (uploads.length > 0) {
        toast.info('Enviando arquivos...');
        await Promise.all(uploads);
      }

      toast.success(editing ? 'Exercício atualizado!' : 'Exercício cadastrado!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este exercício?')) return;
    await api.delete(`/exercises/${id}`);
    toast.success('Exercício excluído');
    load();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      return toast.error('O vídeo deve ter no máximo 15MB');
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  
  const seedExercises = async () => {
    const defaultExercises = [
      { name: 'Supino reto', muscleGroup: 'Peito' }, { name: 'Supino inclinado', muscleGroup: 'Peito' }, { name: 'Crucifixo', muscleGroup: 'Peito' }, { name: 'Crossover', muscleGroup: 'Peito' },
      { name: 'Puxada alta', muscleGroup: 'Costas' }, { name: 'Remada curvada', muscleGroup: 'Costas' }, { name: 'Remada baixa', muscleGroup: 'Costas' }, { name: 'Barra fixa', muscleGroup: 'Costas' },
      { name: 'Rosca direta', muscleGroup: 'Bíceps' }, { name: 'Rosca alternada', muscleGroup: 'Bíceps' }, { name: 'Rosca martelo', muscleGroup: 'Bíceps' }, { name: 'Rosca na polia', muscleGroup: 'Bíceps' },
      { name: 'Tríceps testa', muscleGroup: 'Tríceps' }, { name: 'Tríceps pulley', muscleGroup: 'Tríceps' }, { name: 'Tríceps corda', muscleGroup: 'Tríceps' }, { name: 'Mergulho', muscleGroup: 'Tríceps' },
      { name: 'Desenvolvimento', muscleGroup: 'Ombros' }, { name: 'Elevação lateral', muscleGroup: 'Ombros' }, { name: 'Elevação frontal', muscleGroup: 'Ombros' }, { name: 'Crucifixo invertido', muscleGroup: 'Ombros' },
      { name: 'Abdominal supra', muscleGroup: 'Abdômen' }, { name: 'Abdominal infra', muscleGroup: 'Abdômen' }, { name: 'Abdominal oblíquo', muscleGroup: 'Abdômen' }, { name: 'Abdominal na polia', muscleGroup: 'Abdômen' }, { name: 'Prancha abdominal', muscleGroup: 'Abdômen' },
      { name: 'Agachamento', muscleGroup: 'Pernas' }, { name: 'Búlgaro', muscleGroup: 'Pernas' }, { name: 'Sumô', muscleGroup: 'Pernas' }, { name: 'Afundo', muscleGroup: 'Pernas' }, { name: 'Passada', muscleGroup: 'Pernas' },
      { name: 'Agachamento livre', muscleGroup: 'Pernas' }, { name: 'Agachamento no Smith', muscleGroup: 'Pernas' }, { name: 'Polia', muscleGroup: 'Pernas' }, { name: 'Panturrilha', muscleGroup: 'Pernas' },
      { name: 'Elevação', muscleGroup: 'Pernas' }, { name: 'Mesa flexora', muscleGroup: 'Pernas' }, { name: 'Flexora em pé', muscleGroup: 'Pernas' }, { name: 'Abdução', muscleGroup: 'Pernas' }, { name: 'Adução', muscleGroup: 'Pernas' }, { name: 'Cadeira extensora', muscleGroup: 'Pernas' }
    ];
    setUploading(true);
    toast.info('Cadastrando exercícios...', { id: 'seed' });
    try {
      let count = 0;
      for (const ex of defaultExercises) {
        if (!list.find(l => l.name.toLowerCase() === ex.name.toLowerCase())) {
          await api.post('/exercises', { ...empty, ...ex });
          count++;
        }
      }
      if (count > 0) { toast.success(count + ' exercícios padrão cadastrados!', { id: 'seed' }); load(); }
      else { toast.success('Todos os exercícios padrão já estavam cadastrados!', { id: 'seed' }); }
    } catch (err) {
      toast.error('Erro ao cadastrar', { id: 'seed' });
    } finally {
      setUploading(false);
    }
  };

  const filtered = filter ? list.filter((e) => e.muscleGroup === filter) : list;

  return (
    <div data-testid="exercicios-page">
      <PageHeader
        title="Exercícios"
        subtitle="Catálogo de exercícios com carga, séries, repetições, imagem e vídeo"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={seedExercises} disabled={uploading} data-testid="seed-exercises-button">
              <Pencil size={14} className="inline mr-1" /> Carregar Padrões
            </Button>
            <Button onClick={() => open(null)} data-testid="add-exercicio-button">
              <Plus size={14} className="inline mr-1" /> Novo Exercício
            </Button>
          </div>
        }
      />
      <div className="mb-4 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="exercicio-filter-select">
          <option value="">Todos os grupos musculares</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
      </div>
      <Card className="overflow-x-auto fade-up">
        {filtered.length === 0 ? (
          <div className="p-6"><Empty text="Nenhum exercício cadastrado ainda" /></div>
        ) : (
          <table className="w-full" data-testid="exercicios-table">
            <thead><tr><Th></Th><Th>Exercício</Th><Th>Grupo</Th><Th>Séries</Th><Th>Repetições</Th><Th>Carga (kg)</Th><Th>Tempo</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id} className="hover:bg-surface transition-colors">
                  <Td>
                    {ex.imageUrl ? (
                      <img src={`${backendUrl}${ex.imageUrl}`} alt="" className="w-10 h-10 rounded object-cover border border-line" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-surface border border-line flex items-center justify-center text-muted">
                        <ImagePlus size={14} />
                      </div>
                    )}
                  </Td>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2">
                      {ex.name}
                      {ex.videoUrl && <Video size={16} className="text-accent drop-shadow-lg" title="Possui vídeo explicativo" />}
                    </div>
                  </Td>
                  <Td><Badge>{ex.muscleGroup}</Badge></Td>
                  <Td>{ex.sets}</Td>
                  <Td>{ex.reps}</Td>
                  <Td>{ex.load || '—'}</Td>
                  <Td>{ex.timeSeconds ? `${ex.timeSeconds}s` : '—'}</Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => open(ex)} className="text-muted hover:text-white transition-colors" data-testid={`edit-exercicio-${ex.id}`} aria-label="Editar"><Pencil size={15} /></button>
                      <button onClick={() => remove(ex.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-exercicio-${ex.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Exercício' : 'Novo Exercício'}>
        <form onSubmit={save} className="space-y-5" data-testid="exercicio-form">
          <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="exercicio-name-input" /></Field>
          <Field label="Grupo Muscular">
            <Select value={form.muscleGroup} onChange={set('muscleGroup')} data-testid="exercicio-grupo-select">
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Campo Imagem */}
            <Field label="Foto de Capa">
              <div className="flex flex-col items-start gap-2">
                {imagePreview ? (
                  <img src={imagePreview} alt="Capa" className="w-full h-24 rounded-lg object-cover border border-line" />
                ) : (
                  <div className="w-full h-24 rounded-lg bg-surface border border-dashed border-line flex flex-col items-center justify-center text-muted gap-1">
                    <ImagePlus size={20} />
                    <span className="text-[10px] uppercase">Sem imagem</span>
                  </div>
                )}
                <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()} className="text-xs w-full justify-center">
                  <ImagePlus size={14} className="inline mr-2" />{imagePreview ? 'Trocar foto' : 'Adicionar'}
                </Button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
              </div>
            </Field>

            {/* Campo Vídeo */}
            <Field label="Vídeo Explicativo">
              <div className="flex flex-col items-start gap-2">
                {videoPreview ? (
                  <video src={videoPreview} className="w-full h-24 rounded-lg object-cover bg-black border border-line" controls muted />
                ) : (
                  <div className="w-full h-24 rounded-lg bg-surface border border-dashed border-line flex flex-col items-center justify-center text-muted gap-1">
                    <Video size={20} />
                    <span className="text-[10px] uppercase">Sem vídeo</span>
                  </div>
                )}
                <Button type="button" variant="ghost" onClick={() => videoRef.current?.click()} className="text-xs w-full justify-center">
                  <Video size={14} className="inline mr-2" />{videoPreview ? 'Trocar vídeo' : 'Adicionar'}
                </Button>
                <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoSelect} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Séries"><Input type="number" min="0" value={form.sets} onChange={set('sets')} /></Field>
            <Field label="Repetições"><Input type="number" min="0" value={form.reps} onChange={set('reps')} /></Field>
            <Field label="Carga (kg)"><Input type="number" step="0.5" min="0" value={form.load} onChange={set('load')} /></Field>
            <Field label="Tempo (segundos)"><Input type="number" min="0" value={form.timeSeconds} onChange={set('timeSeconds')} /></Field>
          </div>
          <Field label="Dica ou Observação"><Input value={form.notes} onChange={set('notes')} placeholder="Ex: Mantenha a coluna reta" /></Field>
          
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Salvando e enviando...' : 'Salvar Exercício'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
