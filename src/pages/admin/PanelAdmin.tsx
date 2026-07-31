import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Perfil } from '../../types/actividad';
import { UserPlus, Users, LogOut, ShieldAlert, Award, Plus, Trash2, CheckCircle2, User, Mail, Lock } from 'lucide-react';

export default function PanelAdmin() {
  const { profile, logout } = useAuth();
  const [profesores, setProfesores] = useState<Perfil[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarProfesores = async () => {
    try {
      const data = await db.getProfesores();
      setProfesores(data);
    } catch (err) {
      console.error('Error al cargar profesores:', err);
    }
  };

  useEffect(() => {
    cargarProfesores();
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
      await cargarProfesores();
    } catch (err: any) {
      setError(err.message || 'Error al crear el profesor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-950 p-2 rounded-xl text-red-600 dark:text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black">Panel de Administración</h1>
            <p className="text-xs text-gray-500 font-medium">Inclusión Educativa Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{profile?.nombre}</p>
            <p className="text-xs font-semibold text-gray-400">Administrador</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to create teacher */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold">Registrar Nuevo Profesor</h2>
          </div>

          <form onSubmit={handleCrearProfesor} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Lic. María Clara"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="ejemplo@escuela.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900">{error}</p>}
            {success && <p className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 p-2.5 rounded-lg border border-green-200 dark:border-green-900">{success}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-blue-500/10"
            >
              {cargando ? 'Registrando...' : 'Registrar Profesor'}
            </button>
          </form>
        </div>

        {/* Right Column: Teacher Listing */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold">Profesores Registrados ({profesores.length})</h2>
            </div>
          </div>

          {profesores.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-gray-300 dark:border-gray-600">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <span className="text-sm font-semibold text-gray-500">No hay profesores registrados.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-400 font-bold">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2 text-right">ID de Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700 font-medium">
                  {profesores.map((prof) => (
                    <tr key={prof.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                      <td className="py-3.5 px-2 font-bold text-gray-900 dark:text-white">{prof.nombre}</td>
                      <td className="py-3.5 px-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold capitalize">
                          {prof.rol}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right text-gray-400 text-xs font-mono">{prof.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}