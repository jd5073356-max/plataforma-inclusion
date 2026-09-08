import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2, Box, AlertTriangle, RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';

interface PuntoInteres {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Visor3DProps {
  modeloUrl?: string;
  nombreObjeto: string;
  puntosDeInteres?: PuntoInteres[];
  onSeleccionar?: (punto: PuntoInteres) => void;
  alto?: number;
}

// Visor 3D honesto: carga el GLB real de la actividad con estados claros.
// Sin modelo → mensaje explícito (nunca esculturas falsas). Con error → reintentar.
export const Visor3D: React.FC<Visor3DProps> = ({
  modeloUrl,
  nombreObjeto,
  puntosDeInteres = [],
  onSeleccionar,
  alto = 420
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reintentos, setReintentos] = useState(0);
  const [puntoActivo, setPuntoActivo] = useState<PuntoInteres | null>(null);
  const [autoGirando, setAutoGirando] = useState(true);

  const controlesRef = useRef<OrbitControls | null>(null);
  const camaraInicialRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const modeloListoRef = useRef(false);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let controles: OrbitControls | null = null;
    let objetoCargado: THREE.Object3D | null = null;
    let luces: THREE.Light[] = [];
    let cancelado = false;
    modeloListoRef.current = false;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0xf7f4ee);

    const ancho = Math.max(contenedor.clientWidth, 320);
    const camara = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 100);
    camara.position.set(2.2, 1.6, 2.8);

    luces = [
      new THREE.AmbientLight(0xffffff, 0.6),
      new THREE.DirectionalLight(0xffffff, 1.1),
      new THREE.DirectionalLight(0xffffff, 0.4)
    ];
    luces[1].position.set(3, 4, 2);
    luces[2].position.set(-3, 2, -2);
    escena.add(...luces);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(ancho, alto);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      contenedor.appendChild(renderer.domElement);
    } catch (webglErr) {
      console.error('WebGL no disponible:', webglErr);
      setError('Tu navegador no soporta gráficos 3D. Prueba con otro dispositivo.');
      setCargando(false);
      return;
    }

    controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.12;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 1.2;
    controles.minDistance = 1.2;
    controles.maxDistance = 8;
    controlesRef.current = controles;
    camaraInicialRef.current = {
      pos: camara.position.clone(),
      target: controles.target.clone()
    };

    const cargarModelo = async () => {
      if (!modeloUrl) {
        setError(null);
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError(null);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modeloUrl);
        if (cancelado) return;

        objetoCargado = gltf.scene;
        escena.add(objetoCargado);

        const caja = new THREE.Box3().setFromObject(objetoCargado);
        const centro = caja.getCenter(new THREE.Vector3());
        const tamano = caja.getSize(new THREE.Vector3());
        const maxDim = Math.max(tamano.x, tamano.y, tamano.z);
        const escala = maxDim > 0 ? 2.2 / maxDim : 1;

        objetoCargado.scale.setScalar(escala);
        objetoCargado.position.copy(centro).multiplyScalar(-escala);
        modeloListoRef.current = true;

        setCargando(false);
      } catch (e: any) {
        if (cancelado) return;
        console.error('No se pudo cargar el modelo 3D:', e?.message || e);
        setError('No pudimos cargar el modelo 3D. Revisa tu conexión e inténtalo de nuevo.');
        setCargando(false);
      }
    };

    cargarModelo();

    const animar = () => {
      frameId = requestAnimationFrame(animar);
      controles?.update();
      renderer?.render(escena, camara);
    };
    animar();

    const manejarRedim = () => {
      if (!renderer || !contenedor) return;
      const nuevoAncho = Math.max(contenedor.clientWidth, 320);
      renderer.setSize(nuevoAncho, alto);
      camara.aspect = nuevoAncho / alto;
      camara.updateProjectionMatrix();
    };
    window.addEventListener('resize', manejarRedim);

    return () => {
      cancelado = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', manejarRedim);
      controles?.dispose();
      renderer?.dispose();
      if (objetoCargado) {
        escena.remove(objetoCargado);
        objetoCargado.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            const material = obj.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
            if (Array.isArray(material)) material.forEach((m) => m.dispose());
            else material?.dispose();
          }
        });
      }
      luces.forEach(l => escena.remove(l));
      if (renderer?.domElement?.parentElement === contenedor) {
        contenedor.removeChild(renderer.domElement);
      }
    };
  }, [modeloUrl, alto, reintentos]);

  const seleccionarPunto = (punto: PuntoInteres) => {
    setPuntoActivo(punto);
    onSeleccionar?.(punto);
  };

  const reiniciarVista = () => {
    const c = controlesRef.current;
    const ini = camaraInicialRef.current;
    if (!c || !ini) return;
    c.object.position.copy(ini.pos);
    c.target.copy(ini.target);
    c.update();
  };

  const alternarAutoGiro = () => {
    const c = controlesRef.current;
    if (!c) return;
    c.autoRotate = !autoGirando;
    setAutoGirando(!autoGirando);
  };

  return (
    <div>
      <div
        ref={contenedorRef}
        className="relative w-full rounded-2xl border-4 border-[#EFECE6] overflow-hidden bg-[#F7F4EE]"
        style={{ height: alto }}
      >
        {cargando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F4EE] gap-3 z-10">
            <Loader2 className="w-10 h-10 text-[#EE7C6A] animate-spin" />
            <p className="text-sm font-bold text-[#78716C]">Cargando {nombreObjeto}...</p>
          </div>
        )}

        {!cargando && !modeloUrl && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-6 text-center">
            <Box className="w-10 h-10 text-[#A8A29E]" />
            <p className="text-sm font-bold text-[#57534E]">Esta actividad todavía no tiene un modelo 3D.</p>
            <p className="text-xs text-[#78716C]">Continúa con la pregunta de abajo.</p>
          </div>
        )}

        {!cargando && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-[#E65100]" />
            <p className="text-sm font-bold text-[#57534E]">{error}</p>
            <button
              type="button"
              onClick={() => setReintentos(r => r + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-[#EE7C6A] text-white text-xs font-bold rounded-full shadow hover:bg-[#E46653] transition"
            >
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
          </div>
        )}

        {/* Controles flotantes */}
        {!cargando && !error && modeloUrl && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={alternarAutoGiro}
              className={`p-2 rounded-full shadow transition ${autoGirando ? 'bg-[#EE7C6A] text-white' : 'bg-white text-[#57534E] hover:bg-[#F5F2EC]'}`}
              title={autoGirando ? 'Detener giro' : 'Girar automáticamente'}
            >
              {autoGirando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={reiniciarVista}
              className="p-2 bg-white text-[#57534E] hover:bg-[#F5F2EC] rounded-full shadow transition"
              title="Reiniciar vista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {puntosDeInteres.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#78716C] mb-2">
            Toca una parte para conocerla:
          </p>
          <div className="flex flex-wrap gap-2">
            {puntosDeInteres.map((punto) => (
              <button
                key={punto.id}
                type="button"
                onClick={() => seleccionarPunto(punto)}
                className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition ${
                  puntoActivo?.id === punto.id
                    ? 'border-[#EE7C6A] bg-[#EE7C6A] text-white shadow'
                    : 'border-[#EFECE6] bg-white text-[#1C1917] hover:bg-[#F5F2EC]'
                }`}
              >
                {punto.nombre}
              </button>
            ))}
          </div>

          {puntoActivo && (
            <div className="mt-3 p-4 rounded-2xl border border-[#EFECE6] bg-white animate-slideUp">
              <p className="font-extrabold text-[#1C1917] mb-1">{puntoActivo.nombre}</p>
              <p className="text-sm text-[#57534E]">{puntoActivo.descripcion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Visor3D;
