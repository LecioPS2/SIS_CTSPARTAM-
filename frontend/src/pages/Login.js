import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const BG = '/login-hero.webp';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'assessor') navigate('/admin');
      else if (user.role === 'personal') navigate('/personal');
      else navigate('/aluno');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg flex">
      {/* Background Image & Gradients */}
      <img src={BG} alt="Atleta treinando" className="absolute inset-0 w-full h-full object-cover object-[25%_12%] scale-105" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/70 to-bg/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/95 via-transparent to-transparent" />



      {/* Container Principal que ocupa o restante da tela */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        
        {/* Header / Logo fixado no topo esquerdo */}
        <header className="absolute top-0 left-0 w-full p-8 lg:p-12 z-50 flex items-center justify-between fade-up">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CT Spartan" className="w-12 h-12 lg:w-16 lg:h-16 drop-shadow-2xl" />
            <span className="font-display text-3xl lg:text-4xl uppercase tracking-widest text-white drop-shadow-lg">CT Spartan</span>
          </div>
          <div className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase drop-shadow-md">
            Versão 1.0
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 grid grid-cols-1 md:grid-cols-2 items-center gap-12 pt-16">
          
          {/* Left Side: Slogan */}
          <div className="hidden md:flex flex-col justify-center fade-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="font-display text-[4rem] lg:text-[5.5rem] xl:text-[7.5rem] uppercase leading-[0.85] tracking-tight mb-8 text-white drop-shadow-2xl">
              Treine.<br />
              <span className="text-accent">Evolua.</span><br />
              Domine.
            </h1>
            <p className="text-white/70 text-sm xl:text-base max-w-[550px] leading-relaxed border-l-[3px] border-accent pl-5 drop-shadow-md font-light">
              Espaço exclusivo para mulheres. Treinos personalizados,<br />
              acompanhamento de evolução e gestão completa em um só lugar.
            </p>
          </div>

          {/* Right Side: Formulário de Login */}
          <div className="flex justify-center md:justify-end fade-up w-full" style={{ animationDelay: '0.2s' }}>
            <form
              onSubmit={submit}
              data-testid="login-form"
              className="w-full max-w-md bg-white/[0.04] backdrop-blur-3xl rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/60"
            >
              {/* Logo Mobile */}
              <div className="flex items-center gap-3 mb-8 md:hidden">
                <img src="/logo.png" alt="CT Spartan" className="w-10 h-10" />
                <span className="font-display text-3xl uppercase tracking-tight">CT Spartan</span>
              </div>
              
              <h2 className="font-display text-4xl uppercase tracking-tight mb-1 text-white">Acesse sua conta</h2>
              <p className="text-muted text-sm mb-8">Painel de gestão da academia</p>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted block mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    data-testid="login-email-input"
                    className="w-full bg-surface/80 border border-line rounded-lg px-4 py-3 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted block mb-2">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      data-testid="login-password-input"
                      className="w-full bg-surface/80 border border-line rounded-lg px-4 py-3 pr-12 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-accent text-sm font-medium" data-testid="login-error-message">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-button"
                  className="w-full bg-accent hover:bg-accenth text-white font-medium uppercase tracking-widest text-sm py-4 rounded-lg transition-all duration-300 disabled:opacity-50 mt-2 shadow-lg shadow-accent/20"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                
                <p className="text-center text-xs text-muted/80 pt-4">
                  Esqueceu a senha? Fale com a recepção da academia.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
