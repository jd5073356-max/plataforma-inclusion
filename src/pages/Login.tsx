import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, GraduationCap, Lock, AlertCircle, Sparkles, Compass } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [esEstudiante, setEsEstudiante] = useState(true);
  const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esEstudiante) {
        if (!nombre.trim() || !curso.trim()) {
          throw new Error('Por favor, ingresa tu nombre y curso.');
        }
        await login(nombre, password || '123456', curso);
        navigate('/estudiante');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Por favor, ingresa tu correo y contraseña.');
        }
        await login(email, password);
        
        const { db } = await import('../lib/db');
        const userData = await db.getCurrentUser();
        if (userData?.profile?.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/profesor');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-xl border border-[#EFECE6] overflow-hidden">
        {/* Header Warm Atelier */}
        <div className="bg-[#F5F2EC] p-8 text-center border-b border-[#EFECE6] flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EE7C6A]/10 border border-[#EE7C6A]/20 flex items-center justify-center mb-3">
            <Compass className="w-7 h-7 text-[#EE7C6A]" />
          </div>
          <div className="flex items-center justify-center gap-1 font-serif-atelier text-3xl font-bold tracking-tight text-[#1C1917]">
            <span>ECO INCLUSIVO</span>
            <span className="text-[#EE7C6A] text-sm align-super">✦</span>
          </div>
          <p className="font-serif-atelier italic text-[#78716C] text-sm mt-1">
            Plataforma de Aprendizaje Inmersivo
          </p>
        </div>

        <div className="p-6 md:p-8">
          {/* Selector de Rol Atelier */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F2EC] rounded-full mb-8 border border-[#EBE8E0]">
            <button
              type="button"
              onClick={() => { setEsEstudiante(true); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
                esEstudiante
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#EE7C6A]" />
              Estudiante
            </button>
            <button
              type="button"
              onClick={() => { setEsEstudiante(false); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
                !esEstudiante
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <User className="w-4 h-4 text-[#7294B9]" />
              Educador / Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {esEstudiante ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Tu nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Ana López"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Tu curso o clase
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: 3A o 4B"
                      value={curso}
                      onChange={(e) => setCurso(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2 flex justify-between">
                    Contraseña 
                    <span className="text-[#A8A29E] font-normal normal-case">(Opcional si es "123456")</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="profesor@inclusion.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-[#FFF2F0] border border-[#FFCCC7] rounded-xl text-[#D9363E] text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D9363E] mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-4 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-sm rounded-2xl transition shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {cargando ? 'Iniciando sesión...' : 'Entrar al Atelier'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-[#78716C] font-medium">
            Acceso predeterminado: <b className="text-[#1C1917]">profesor@inclusion.com</b> / <b className="text-[#1C1917]">123456</b>
          </div>
        </div>
      </div>
    </div>
  );
}