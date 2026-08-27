import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BG = '/login-hero.webp';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'personal') navigate('/personal');
      else navigate('/aluno');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src={BG} alt="Atleta treinando" className="absolute inset-0 w-full h-full object-cover object-[25%_12%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/40 via-bg/70 to-bg/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen max-w-6xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
        <div className="hidden lg:block fade-up">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="CT Spartan" className="w-14 h-14" />
            <span className="font-display text-4xl uppercase tracking-tight">CT Spartan</span>
          </div>
          <p className="font-display text-6xl uppercase leading-none tracking-tight mb-4">
            Treine.<br /><span className="text-accent">Evolua.</span><br />Domine.
          </p>
          <p className="text-muted text-sm max-w-sm leading-relaxed">
            Espaço exclusivo para mulheres. Treinos personalizados, acompanhamento de evolução e gestão completa em um só lugar.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <form
            onSubmit={submit}
            data-testid="login-form"
            className="w-full max-w-md bg-white/[0.06] backdrop-blur-2xl rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40 fade-up"
          >
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <img src="/logo.png" alt="CT Spartan" className="w-10 h-10" />
              <span className="font-display text-3xl uppercase tracking-tight">CT Spartan</span>
            </div>
            <h1 className="font-display text-4xl uppercase tracking-tight mb-1">Acesse sua conta</h1>
            <p className="text-muted text-sm mb-8">Painel de gestão da academia</p>
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted block mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  data-testid="login-email-input"
                  className="w-full bg-surface/80 border border-line rounded-lg px-4 py-3 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted block mb-2">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  data-testid="login-password-input"
                  className="w-full bg-surface/80 border border-line rounded-lg px-4 py-3 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
              {error && <p className="text-accent text-sm" data-testid="login-error-message">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit-button"
                className="w-full bg-accent hover:bg-accenth text-white font-medium py-3.5 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <p className="text-center text-xs text-muted pt-2">
                Esqueceu a senha? Fale com a recepção da academia.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
