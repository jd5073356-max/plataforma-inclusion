import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2, Info } from 'lucide-react';

interface PuntoInteres {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Visor3DProps {
  modeloUrl: string;
  nombreObjeto: string;
  puntosDeInteres?: PuntoInteres[];
  onSeleccionar?: (punto: PuntoInteres) => void;
  alto?: number;
}

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
  const [puntoActivo, setPuntoActivo] = useState<PuntoInteres | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let controles: OrbitControls | null = null;
    let objetoCargado: THREE.Group | null = null;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0xf8fafc);

    const camara = new THREE.PerspectiveCamera(45, contenedor.clientWidth / alto, 0.1, 100);
    camara.position.set(2.2, 1.6, 2.8);

    const luces = [
      new THREE.AmbientLight(0xffffff, 0.6),
      new THREE.DirectionalLight(0xffffff, 1.1),
      new THREE.DirectionalLight(0xffffff, 0.4)
    ];
    luces[1].position.set(3, 4, 2);
    luces[2].position.set(-3, 2, -2);
    escena.add(...luces);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(contenedor.clientWidth, alto);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    contenedor.appendChild(renderer.domElement);

    controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.12;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 1.2;
    controles.minDistance = 1.2;
    controles.maxDistance = 8;

    const cargarModelo = async () => {
      try {
        setCargando(true);
        setError(null);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modeloUrl);
        objetoCargado = gltf.scene;
        escena.add(objetoCargado);

        const caja = new THREE.Box3().setFromObject(objetoCargado);
        const centro = caja.getCenter(new THREE.Vector3());
        const tamano = caja.getSize(new THREE.Vector3());
        const maxDim = Math.max(tamano.x, tamano.y, tamano.z);
        const escala = 2.2 / maxDim;
        objetoCargado.scale.multiplyScalar(escala);
        objetoCargado.position.sub(centro.multiplyScalar(escala));

        setCargando(false);
      } catch (e) {
        console.error('Error cargando modelo 3D:', e);
        setError('No se pudo cargar el modelo 3D. Revisa tu conexión.');
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
      renderer.setSize(contenedor.clientWidth, alto);
      camara.aspect = contenedor.clientWidth / alto;
      camara.updateProjectionMatrix();
    };
    window.addEventListener('resize', manejarRedim);

    return () => {
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
      if (renderer?.domElement?.parentElement === contenedor) {
        contenedor.removeChild(renderer.domElement);
      }
    };
  }, [modeloUrl, alto]);

  const seleccionarPunto = (punto: PuntoInteres) => {
    setPuntoActivo(punto);
    onSeleccionar?.(punto);
  };

  return (
    <div>
      <div
        ref={contenedorRef}
        className="relative w-full rounded-2xl border-4 border-gray-200 overflow-hidden"
        style={{ height: alto }}
      >
        {cargando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3 z-10">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-gray-500">Cargando {nombreObjeto}...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3 z-10 p-6 text-center">
            <Info className="w-10 h-10 text-yellow-500" />
            <p className="text-sm font-bold text-gray-700">{error}</p>
          </div>
        )}
      </div>

      {puntosDeInteres.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-gray-500 mb-2">
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
                    ? 'border-blue-600 bg-blue-600 text-white shadow'
                    : 'border-blue-300 bg-white text-blue-800 hover:bg-blue-50'
                }`}
              >
                {punto.nombre}
              </button>
            ))}
          </div>

          {puntoActivo && (
            <div className="mt-3 p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 animate-slideUp">
              <p className="font-extrabold text-blue-900 mb-1">{puntoActivo.nombre}</p>
              <p className="text-sm text-blue-950/80">{puntoActivo.descripcion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Visor3D;
