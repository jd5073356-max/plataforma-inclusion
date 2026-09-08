import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Etapa, Actividad } from '../../types/actividad';
import {
  Layers, Plus, ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronRight,
  RefreshCw, PlusCircle, Recycle, Route
} from 'lucide-react';

const msgErr = (err: unknown) => (err instanceof Error ? err.message : 'Ocurrió un error inesperado');

// Pestaña Rutas: cada etapa es un camino lineal de pasos (actividades ordenadas).
export default function Rutas() {
  const { profile } = useAuth();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [etapaAbiertaId, setEtapaAbiertaId] = useState<string | null>(null);
  const [pasos, setPasos] = useState<Actividad[]>([]);
  const [cargandoPasos, setCargandoPasos] = useState(false);
  const [loading, setLoading] = useState(true);

  // Nueva ruta
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  // Añadir paso desde el Banco
  const [banco, setBanco] = useState<Actividad[]>([]);
  const [mostrandoBanco, setMostrandoBanco] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const loadRutas = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const ets = await db.getEtapas(profile.id);
      setEtapas(ets.sort((a, b) => a.orden - b.orden));
    } catch (err) {
      console.error('Error cargando rutas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPasos = async (etapaId: string) => {
    try {
      setCargandoPasos(true);
      const ps = await db.getPasosDeEtapa(etapaId);
      setPasos(ps);
    } catch (err) {
      console.error('Error cargando pasos:', err);
    } finally {
      setCargandoPasos(false);
    }
  };

  useEffect(() => {
    loadRutas();
  }, [profile]);

  const toggleEtapa = async (etapaId: string) => {
    if (etapaAbiertaId === etapaId) {
      setEtapaAbiertaId(null);
      return;
    }
    setEtapaAbiertaId(etapaId);
    setMostrandoBanco(false);
    await loadPasos(etapaId);
  };

  const handleCrearRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !profile) return;
    try {
      setCreando(true);
      const orden = etapas.length > 0 ? Math.max(...etapas.map(e2 => e2.orden)) + 1 : 1;
      const nueva = await db.crearEtapa(nuevoNombre.trim(), orden, profile.id);
      setNuevoNombre('');
      await loadRutas();
      setEtapaAbiertaId(nueva.id);
      setPasos([]);
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al crear la ruta', success: '' });
    } finally {
      setCreando(false);
    }
  };

  const abrirBanco = async () => {
    if (!profile) return;
    setMostrandoBanco(true);
    const plantillas = await db.getBanco(profile.id);
    setBanco(plantillas);
  };

  const reciclar = async (plantillaId: string) => {
    if (!profile || !etapaAbiertaId) return;
    try {
      await db.reciclarARuta(plantillaId, etapaAbiertaId, profile.id);
      setMsg({ error: '', success: 'Paso añadido al final de la ruta.' });
      await loadPasos(etapaAbiertaId);
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al añadir el paso', success: '' });
    }
  };

  const mover = async (pasoId: string, direccion: 'arriba' | 'abajo') => {
    if (!etapaAbiertaId) return;
    try {
      await db.moverPaso(pasoId, direccion);
      await loadPasos(etapaAbiertaId);
    } catch (err) {
      console.error('Error moviendo paso:', err);
    }
  };

  const eliminar = async (pasoId: string) => {
    if (!etapaAbiertaId) return;
    try {
      await db.eliminarPaso(pasoId);
      await loadPasos(etapaAbiertaId);
    } catch (err) {
      console.error('Error eliminando paso:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans-atelier">
      {/* Crear nueva ruta */}
      <div className="bg-white p-6 rounded-[28px] border border-[#EFECE6] shadow-sm">
        <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] mb-1 flex items-center gap-2">
          <Route className="w-5 h-5 text-[#F59E0B]" /> Rutas de Aprendizaje
        </h2>
        <p className="text-xs text-[#78716C] mb-4">
          Cada ruta es un camino lineal: los pasos se completan en orden y el siguiente se desbloquea al terminar el anterior.
        </p>

        <form onSubmit={handleCrearRuta} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre de la nueva ruta. Ej: Guía María — Grado 9 · Biología"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="flex-1 px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
            required
          />
          <button
            type="submit"
            disabled={creando}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl text-xs transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Crear ruta
          </button>
        </form>

        {msg.error && <p className="mt-2 text-xs font-bold text-[#D9363E]">{msg.error}</p>}
      </div>

      {/* Lista de rutas */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-8 h-8 text-[#EE7C6A] animate-spin" />
        </div>
      ) : etapas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed rounded-[28px] border-[#EFECE6]">
          <Route className="w-12 h-12 text-[#A8A29E] mx-auto mb-3 opacity-50" />
          <p className="text-xs font-semibold text-[#78716C]">Aún no hay rutas. Crea la primera arriba.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {etapas.map((etapa) => {
            const abierta = etapaAbiertaId === etapa.id;
            return (
              <div key={etapa.id} className="bg-white rounded-[24px] border border-[#EFECE6] shadow-sm overflow-hidden">
                {/* Cabecera de la ruta */}
                <button
                  type="button"
                  onClick={() => toggleEtapa(etapa.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 hover:bg-[#FBF9F5] transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center font-black text-sm shrink-0">
                      {etapa.orden}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif-atelier font-bold text-[#1C1917] truncate">{etapa.nombre}</h3>
                      <p className="text-[11px] text-[#78716C]">Ruta #{etapa.orden} · toca para {abierta ? 'cerrar' : 'editar pasos'}</p>
                    </div>
                  </div>
                  {abierta ? <ChevronDown className="w-5 h-5 text-[#78716C] shrink-0" /> : <ChevronRight className="w-5 h-5 text-[#78716C] shrink-0" />}
                </button>

                {/* Editor de pasos */}
                {abierta && (
                  <div className="border-t border-[#EFECE6] p-5 bg-[#FBF9F5] space-y-3">
                    {cargandoPasos ? (
                      <div className="flex justify-center py-6">
                        <RefreshCw className="w-6 h-6 text-[#EE7C6A] animate-spin" />
                      </div>
                    ) : pasos.length === 0 ? (
                      <p className="text-xs font-semibold text-[#78716C] text-center py-6 border border-dashed rounded-2xl border-[#EFECE6] bg-white">
                        Esta ruta no tiene pasos todavía. Añade el primero desde el Banco o crea plantillas nuevas en esa pestaña.
                      </p>
                    ) : (
                      pasos.map((paso, idx) => (
                        <div
                          key={paso.id}
                          className="flex items-center gap-3 p-3.5 bg-white border border-[#EFECE6] rounded-2xl"
                        >
                          <span className="w-7 h-7 rounded-full bg-[#EE7C6A] text-white flex items-center justify-center text-xs font-black shrink-0">
                            {idx + 1}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
                              {paso.tipo.replace(/_/g, ' ')}
                            </p>
                            <p className="font-bold text-sm text-[#1C1917] truncate">{paso.titulo}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => mover(paso.id, 'arriba')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-full hover:bg-[#F5F2EC] text-[#78716C] disabled:opacity-30 transition"
                              title="Subir"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => mover(paso.id, 'abajo')}
                              disabled={idx === pasos.length - 1}
                              className="p-1.5 rounded-full hover:bg-[#F5F2EC] text-[#78716C] disabled:opacity-30 transition"
                              title="Bajar"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminar(paso.id)}
                              className="p-1.5 rounded-full hover:bg-[#FFF2F0] text-[#A8A29E] hover:text-[#D9363E] transition"
                              title="Quitar de la ruta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Añadir paso desde el Banco */}
                    <div className="pt-2">
                      {!mostrandoBanco ? (
                        <button
                          type="button"
                          onClick={abrirBanco}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] font-bold text-xs rounded-2xl transition"
                        >
                          <Recycle className="w-4 h-4" /> Reciclar actividad del Banco
                        </button>
                      ) : (
                        <div className="p-4 bg-white border border-[#EFECE6] rounded-2xl space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#10B981]" /> Plantillas disponibles ({banco.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setMostrandoBanco(false)}
                              className="text-xs font-bold text-[#78716C] hover:text-[#1C1917]"
                            >
                              Cerrar
                            </button>
                          </div>
                          {banco.length === 0 ? (
                            <p className="text-xs text-[#78716C] py-3 text-center border border-dashed rounded-xl border-[#EFECE6]">
                              El Banco está vacío. Crea plantillas en la pestaña «Banco de Actividades».
                            </p>
                          ) : (
                            banco.map(pl => (
                              <div key={pl.id} className="flex items-center justify-between gap-3 p-2.5 bg-[#FBF9F5] border border-[#EFECE6] rounded-xl">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1C1917] truncate">{pl.titulo}</p>
                                  <p className="text-[10px] text-[#78716C] uppercase">{pl.tipo.replace(/_/g, ' ')}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => reciclar(pl.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#10B981] hover:bg-[#0EA371] text-white rounded-full text-[11px] font-bold transition shrink-0"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> Añadir
                                </button>
                              </div>
                            ))
                          )}
                          {msg.success && <p className="text-xs font-bold text-[#10B981]">{msg.success}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
