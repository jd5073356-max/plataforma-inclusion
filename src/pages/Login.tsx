import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EscanerCarnetQR from '../components/comunes/EscanerCarnetQR';
import { User, GraduationCap, Lock, AlertCircle, ShieldCheck, Compass, Eye, EyeOff, QrCode, IdCard } from 'lucide-react';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [rolTab, setRolTab] = useState<'estudiante' | 'profesor' | 'admin'>('estudiante');
  const [idEstudiante, setIdEstudiante] = useState('');
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const esEstudiante = rolTab === 'estudiante';

  const ingresarConCodigoEstudiante = async (codigo: string) => {
    setError('');
    setCargando(true);
    try {
      if (!codigo.trim()) {
        throw new Error('Por favor, ingresa tu ID de carnet o escanea tu código QR.');
      }
      await login(codigo.trim(), '123456', '__ID__');
      navigate('/estudiante');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'No encontramos un estudiante con ese ID o código QR.');
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esEstudiante) {
      await ingresarConCodigoEstudiante(idEstudiante);
      return;
    }

    setError('');
    setCargando(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Por favor, ingresa tu correo y contraseña.');
      }
      await login(email, password);

      const { db } = await import('../lib/db');
      const userData = await db.getCurrentUser();
      if (rolTab === 'admin' && userData?.profile?.rol !== 'admin') {
        await logout();
        throw new Error(
          'Esta cuenta tiene rol de Profesor, no de Administrador. Usa la pestaña «Profesor» o ingresa con la cuenta de Administrador institucional para crear docentes.'
        );
      }

      if (userData?.profile?.rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profesor');
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
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#F5F2EC] rounded-full mb-6 border border-[#EBE8E0]">
            <button
              type="button"
              onClick={() => { setRolTab('estudiante'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                rolTab === 'estudiante'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#EE7C6A]" />
              Estudiante
            </button>
            <button
              type="button"
              onClick={() => { setRolTab('profesor'); setEscanerAbierto(false); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                rolTab === 'profesor'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <User className="w-4 h-4 text-[#7294B9]" />
              Profesor
            </button>
            <button
              type="button"
              onClick={() => { setRolTab('admin'); setEscanerAbierto(false); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                rolTab === 'admin'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Admin
            </button>
          </div>

          {rolTab === 'admin' && (
            <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-[#F5F2EC] border border-[#EFECE6] text-[11px] text-[#57534E] font-medium text-center">
              Acceso exclusivo de coordinación para crear cuentas y claves de profesores.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {esEstudiante ? (
              <>
                {/* Botón para abrir lector QR del carnet */}
                {!escanerAbierto ? (
                  <button
                    type="button"
                    onClick={() => { setEscanerAbierto(true); setError(''); }}
                    className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-[#EE7C6A] bg-[#FFF8F6] hover:bg-[#EE7C6A]/10 text-[#1C1917] font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-[#EE7C6A] text-white">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-extrabold text-[#1C1917]">
                        Escanear Código QR del Carnet
                      </span>
                      <span className="block text-[11px] text-[#78716C] font-medium">
                        Usa la cámara o sube la imagen del QR estudiantil
                      </span>
                    </div>
                  </button>
                ) : (
                  <EscanerCarnetQR
                    onDetectado={(codigoDetectado) => {
                      setIdEstudiante(codigoDetectado);
                      setEscanerAbierto(false);
                      ingresarConCodigoEstudiante(codigoDetectado);
                    }}
                    onCerrar={() => setEscanerAbierto(false)}
                  />
                )}

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-[#EFECE6]"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold uppercase text-[#A8A29E]">
                    o escribe tu ID de carnet
                  </span>
                  <div className="flex-grow border-t border-[#EFECE6]"></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Documento (T.I. / C.C.) o ID del Carnet EDUPASS
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: 1075665845, TI: 1075665845 o MP-901"
                      value={idEstudiante}
                      onChange={(e) => setIdEstudiante(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-bold placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    {rolTab === 'admin' ? 'Correo de Administrador' : 'Correo Institucional del Profesor'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                      {rolTab === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <input
                      type="email"
                      placeholder={rolTab === 'admin' ? 'coordinacion@institucion.edu.co' : 'profesor@institucion.edu.co'}
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
                      type={mostrarPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3.5 border border-[#EFECE6] rounded-2xl text-[#1C1917] font-medium placeholder-[#A8A29E] bg-[#FBF9F5] focus:outline-none focus:border-[#EE7C6A] transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A8A29E] hover:text-[#57534E]"
                      title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
        </div>
      </div>
    </div>
  );
}