import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, GraduationCap, Lock, AlertCircle } from 'lucide-react';

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
        
        // El perfil determinará adónde va después de iniciar sesión
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center text-white">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-100" />
          <h1 className="text-2xl font-extrabold tracking-tight">ECO INCLUSIVO</h1>
          <p className="text-blue-100 mt-1 text-sm font-medium">Portal Educativo Adaptativo</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Role selector buttons */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => { setEsEstudiante(true); setError(''); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                esEstudiante
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Estudiante
            </button>
            <button
              type="button"
              onClick={() => { setEsEstudiante(false); setError(''); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                !esEstudiante
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              Educador / Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {esEstudiante ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Tu nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Ana López"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-gray-800 font-medium placeholder-gray-400 bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Tu curso o clase
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: 3A o 4B"
                      value={curso}
                      onChange={(e) => setCurso(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-gray-800 font-medium placeholder-gray-400 bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                    Contraseña 
                    <span className="text-gray-400 font-normal normal-case">(Opcional si es "123456")</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-gray-800 font-medium placeholder-gray-400 bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="profesor@inclusion.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-gray-800 font-medium placeholder-gray-400 bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-gray-800 font-medium placeholder-gray-400 bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {cargando ? 'Iniciando sesión...' : 'Entrar a la Plataforma'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400 font-medium">
            Usuarios predeterminados: <b>profesor@inclusion.com</b> / <b>123456</b>
          </div>
        </div>
      </div>
    </div>
  );
}