import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Perfil } from '../../types/actividad';
import {
  UserPlus,
  Users,
  LogOut,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  User,
  Mail,
  Lock,
  GraduationCap,
  Route,
  RefreshCw
} from 'lucide-react';

export default function PanelAdmin() {
  const { profile, logout } = useAuth();
  const [profesores, setProfesores] = useState<Perfil[]>([]);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalRutas, setTotalRutas] = useState(0);
  const [totalCompletados, setTotalCompletados] = useState(0);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarDatosAdmin = async () => {
    try {
      const [profs, ests, ets, progs] = await Promise.all([
        db.getProfesores(),
        db.getEstudiantesPorProfesor(''),
        db.getEtapas(''),
        db.getTodoElProgreso()
      ]);
      setProfesores(profs);
      setTotalEstudiantes(ests.length);
      setTotalRutas(ets.length);
      setTotalCompletados(progs.filter(p => p.completado).length);
    } catch (err) {
      console.error('Error al cargar datos del administrador:', err);
    }
  };

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const handleCrearProfesor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCargando(true);

    try {
      if (!nombre.trim() || !email.trim() || !password.trim()) {
        throw new Error('Todos los campos son obligatorios.');
      }
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }

      await db.crearProfesor(nombre, email, password);
      setSuccess('¡Profesor creado exitosamente!');
      setNombre('');
      setEmail('');
      setPassword('');
      await cargarDatosAdmin();
    } catch (err: any) {
      setError(err.message || 'Error al crear el profesor.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarProfesor = async (prof: Perfil) => {
    if (!window.confirm(`¿Eliminar al profesor «${prof.nombre}»? Sus rutas se conservarán en la plataforma.`)) return;
    setError('');
    setSuccess('');
    try {
      await db.eliminarPerfil(prof.id);
      setSuccess(`Profesor «${prof.nombre}» eliminado.`);
      await cargarDatosAdmin();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el profesor.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col font-sans-atelier">
      {/* Header */}
      <header className="bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#EE7C6A] p-2.5 rounded-2xl text-white shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif-atelier font-bold text-[#1C1917] leading-none flex items-center gap-1.5">
              Panel de Administración <span className="text-[#EE7C6A] text-xs font-sans-atelier align-super">✦</span>
            </h1>
            <p className="text-xs text-[#78716C] font-medium mt-0.5">ECO INCLUSIVO • Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarDatosAdmin}
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EC] rounded-full transition"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-[#1C1917]">{profile?.nombre}</p>
            <p className="text-[11px] text-[#78716C]">Administrador</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#EE7C6A] hover:bg-[#EE7C6A]/10 rounded-full transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-8">
        {/* Métricas globales de la institución */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-3">
            <div className="bg-[#EE7C6A]/15 p-3 rounded-2xl text-[#EE7C6A]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-serif-atelier font-bold">{profesores.length}</span>
              <span className="text-[11px] font-bold text-[#78716C] uppercase">Profesores</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-3">
            <div className="bg-[#7294B9]/15 p-3 rounded-2xl text-[#7294B9]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-serif-atelier font-bold">{totalEstudiantes}</span>
              <span className="text-[11px] font-bold text-[#78716C] uppercase">Estudiantes</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-3">
            <div className="bg-[#F59E0B]/15 p-3 rounded-2xl text-[#F59E0B]">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-serif-atelier font-bold">{totalRutas}</span>
              <span className="text-[11px] font-bold text-[#78716C] uppercase">Rutas PIAR</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-3">
            <div className="bg-[#10B981]/15 p-3 rounded-2xl text-[#10B981]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-serif-atelier font-bold">{totalCompletados}</span>
              <span className="text-[11px] font-bold text-[#78716C] uppercase">Pasos superados</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to create teacher */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] border border-[#EFECE6] shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-[#EE7C6A]" />
              <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917]">Registrar Nuevo Profesor</h2>
            </div>

            <form onSubmit={handleCrearProfesor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej: Rafael Suárez Martínez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="ejemplo@inclusion.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs font-bold text-[#D9363E] bg-[#FFF2F0] p-3 rounded-xl border border-[#FFCCC7]">{error}</p>}
              {success && <p className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] p-3 rounded-xl border border-[#A7F3D0]">{success}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-xs rounded-2xl transition shadow-sm"
              >
                {cargando ? 'Registrando...' : 'Registrar Profesor'}
              </button>
            </form>
          </div>

          {/* Right Column: Teacher Listing */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] border border-[#EFECE6] shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#EE7C6A]" />
                <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917]">
                  Profesores Registrados ({profesores.length})
                </h2>
              </div>
            </div>

            {profesores.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl border-[#EFECE6]">
                <Users className="w-12 h-12 text-[#A8A29E] mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold text-[#78716C]">No hay profesores registrados.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFECE6] text-[#78716C] font-bold">
                      <th className="py-3 px-3">Nombre</th>
                      <th className="py-3 px-3">Rol</th>
                      <th className="py-3 px-3">ID de Usuario</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6] font-medium">
                    {profesores.map((prof) => (
                      <tr key={prof.id} className="hover:bg-[#FBF9F5] transition">
                        <td className="py-3.5 px-3 font-bold text-[#1C1917]">{prof.nombre}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-3 py-1 bg-[#EE7C6A]/10 text-[#EE7C6A] rounded-full text-[11px] font-bold capitalize">
                            {prof.rol}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#A8A29E] font-mono text-[11px]">{prof.id}</td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEliminarProfesor(prof)}
                            className="p-1.5 text-[#A8A29E] hover:text-[#D9363E] hover:bg-[#FFF2F0] rounded-full transition"
                            title="Eliminar profesor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}