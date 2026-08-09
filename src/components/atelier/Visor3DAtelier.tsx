import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, ZoomIn, Eye, Layers, Box, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { AtelierHotspot } from '../../types/actividad';

interface Visor3DAtelierProps {
  modeloUrl?: string;
  nombreObjeto: string;
  subtitulo?: string;
  hotspots?: AtelierHotspot[];
  instruccionTip?: string;
  onSelectHotspot?: (hotspot: AtelierHotspot) => void;
  alto?: number | string;
}

export const Visor3DAtelier: React.FC<Visor3DAtelierProps> = ({
  modeloUrl,
  nombreObjeto,
  subtitulo = 'Muestra 3D · explora sus componentes',
  hotspots = [],
  instruccionTip = 'Arrastra para rotar · Rueda para zoom · Toca un punto',
  onSelectHotspot,
  alto = '100%'
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hotspotActivo, setHotspotActivo] = useState<AtelierHotspot | null>(null);
  const [herramientaActiva, setHerramientaActiva] = useState<string>('rotate');

  const controlesRef = useRef<OrbitControls | null>(null);
  const escenaRef = useRef<THREE.Scene | null>(null);
  const camaraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let objetoCargado: THREE.Object3D | null = null;

    // Escena con fondo cálido al estilo Atelier (#F7F4EE)
    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0xF7F4EE);
    escenaRef.current = escena;

    // Cámara
    const camara = new THREE.PerspectiveCamera(45, contenedor.clientWidth / contenedor.clientHeight, 0.1, 100);
    camara.position.set(2.4, 1.8, 3.2);
    camaraRef.current = camara;

    // Iluminación de estudio fotográfico cálido
    const luzAmbiente = new THREE.AmbientLight(0xFFFAF0, 0.85);
    const luzPrincipal = new THREE.DirectionalLight(0xFFE4CE, 1.4);
    luzPrincipal.position.set(4, 6, 3);
    const luzRelleno = new THREE.DirectionalLight(0xD9E6F2, 0.6);
    luzRelleno.position.set(-4, 3, -3);

    escena.add(luzAmbiente, luzPrincipal, luzRelleno);

    // Renderer WebGL
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    contenedor.appendChild(renderer.domElement);

    // OrbitControls
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.autoRotate = autoRotate;
    controles.autoRotateSpeed = 1.5;
    controles.minDistance = 1.0;
    controles.maxDistance = 10;
    controlesRef.current = controles;

    // Función para crear un espécimen interactivo si no hay GLB válido
    const crearEspecimenProcedural = () => {
      const grupo = new THREE.Group();
      
      // 1. Estructura piramidal / cristalina interior (Núcleo facetado)
      const geoNucleo = new THREE.DodecahedronGeometry(0.95, 1);
      const matNucleo = new THREE.MeshPhysicalMaterial({
        color: 0xEE7C6A,
        roughness: 0.15,
        metalness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
      const mallaNucleo = new THREE.Mesh(geoNucleo, matNucleo);
      grupo.add(mallaNucleo);

      // 2. Capa cristalina exterior translúcida (Anatomía celular)
      const geoExterior = new THREE.IcosahedronGeometry(1.35, 2);
      const matExterior = new THREE.MeshPhysicalMaterial({
        color: 0x7294B9,
        roughness: 0.1,
        metalness: 0.0,
        transmission: 0.65, // Efecto cristal translúcido
        opacity: 0.85,
        transparent: true,
        ior: 1.5
      });
      const mallaExterior = new THREE.Mesh(geoExterior, matExterior);
      grupo.add(mallaExterior);

      // 3. Marco de alambre / estructura de soporte didáctica (Wireframe)
      const geoWire = new THREE.IcosahedronGeometry(1.37, 2);
      const matWire = new THREE.MeshBasicMaterial({
        color: 0x1C1917,
        wireframe: true,
        opacity: 0.15,
        transparent: true
      });
      const mallaWire = new THREE.Mesh(geoWire, matWire);
      grupo.add(mallaWire);

      // 4. Anillos didácticos concéntricos articulados
      const geoAnillo1 = new THREE.TorusGeometry(1.75, 0.035, 16, 100);
      const matAnillo1 = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.2, metalness: 0.5 });
      const anillo1 = new THREE.Mesh(geoAnillo1, matAnillo1);
      anillo1.rotation.x = Math.PI / 4;
      grupo.add(anillo1);

      const geoAnillo2 = new THREE.TorusGeometry(2.0, 0.025, 16, 100);
      const matAnillo2 = new THREE.MeshStandardMaterial({ color: 0xEE7C6A, roughness: 0.3, metalness: 0.4 });
      const anillo2 = new THREE.Mesh(geoAnillo2, matAnillo2);
      anillo2.rotation.y = Math.PI / 3;
      grupo.add(anillo2);

      escena.add(grupo);
      objetoCargado = grupo;
      setCargando(false);
    };

    const cargarModelo = async () => {
      if (!modeloUrl) {
        crearEspecimenProcedural();
        return;
      }

      try {
        setCargando(true);
        setError(null);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modeloUrl);
        objetoCargado = gltf.scene;
        escena.add(objetoCargado);

        // Centrar y escalar automáticamente
        const caja = new THREE.Box3().setFromObject(objetoCargado);
        const centro = caja.getCenter(new THREE.Vector3());
        const tamano = caja.getSize(new THREE.Vector3());
        const maxDim = Math.max(tamano.x, tamano.y, tamano.z);
        const escala = 2.2 / maxDim;
        objetoCargado.scale.multiplyScalar(escala);
        objetoCargado.position.sub(centro.multiplyScalar(escala));

        setCargando(false);
      } catch (e) {
        console.warn('Fallback a espécimen visual procedural por falta de GLB remoto:', e);
        crearEspecimenProcedural();
      }
    };

    cargarModelo();

    // Bucle de renderizado
    const animar = () => {
      frameId = requestAnimationFrame(animar);
      controles.autoRotate = autoRotate;
      controles.update();
      renderer?.render(escena, camara);
    };
    animar();

    // Resize listener
    const manejarRedim = () => {
      if (!renderer || !contenedor) return;
      const ancho = contenedor.clientWidth;
      const altoActual = contenedor.clientHeight;
      renderer.setSize(ancho, altoActual);
      camara.aspect = ancho / altoActual;
      camara.updateProjectionMatrix();
    };
    window.addEventListener('resize', manejarRedim);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', manejarRedim);
      controles.dispose();
      renderer?.dispose();
      if (objetoCargado) {
        escena.remove(objetoCargado);
      }
      if (renderer?.domElement?.parentElement === contenedor) {
        contenedor.removeChild(renderer.domElement);
      }
    };
  }, [modeloUrl, autoRotate]);

  const handleResetView = () => {
    if (controlesRef.current && camaraRef.current) {
      camaraRef.current.position.set(2.4, 1.8, 3.2);
      controlesRef.current.target.set(0, 0, 0);
      controlesRef.current.update();
    }
  };

  const handleSelectHotspot = (hp: AtelierHotspot) => {
    setHotspotActivo(hp);
    onSelectHotspot?.(hp);
  };

  return (
    <div className="relative w-full h-full min-h-[440px] bg-[#F7F4EE] rounded-[24px] border border-[#EFECE6] overflow-hidden flex flex-col justify-between">
      {/* Glow ambiental cálido */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(238, 124, 106, 0.25) 0%, rgba(247, 244, 238, 0) 70%)'
        }}
      />

      {/* Contenedor 3D Three.js */}
      <div ref={contenedorRef} className="absolute inset-0 w-full h-full" />

      {/* Indicador de carga */}
      {cargando && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F4EE]/90 backdrop-blur-sm z-30 gap-3">
          <RefreshCw className="w-8 h-8 text-[#EE7C6A] animate-spin" />
          <p className="font-serif-atelier text-xl font-bold text-[#1C1917]">Cargando espécimen didáctico...</p>
        </div>
      )}

      {/* Barra flotante lateral izquierda de herramientas Atelier */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setHerramientaActiva('rotate')}
          className={`atelier-tool-btn ${herramientaActiva === 'rotate' ? 'active' : ''}`}
          title="Rotar modelo"
        >
          <RotateCcw className="w-5 h-5 mb-0.5" />
          <span>Rotar</span>
        </button>

        <button
          type="button"
          onClick={() => setHerramientaActiva('zoom')}
          className={`atelier-tool-btn ${herramientaActiva === 'zoom' ? 'active' : ''}`}
          title="Zoom"
        >
          <ZoomIn className="w-5 h-5 mb-0.5" />
          <span>Zoom</span>
        </button>

        <button
          type="button"
          onClick={() => setHerramientaActiva('isolate')}
          className={`atelier-tool-btn ${herramientaActiva === 'isolate' ? 'active' : ''}`}
          title="Aislar componente"
        >
          <Eye className="w-5 h-5 mb-0.5" />
          <span>Aislar</span>
        </button>

        <button
          type="button"
          onClick={() => setHerramientaActiva('layers')}
          className={`atelier-tool-btn ${herramientaActiva === 'layers' ? 'active' : ''}`}
          title="Capas didácticas"
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Capas</span>
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="atelier-tool-btn"
          title="Restablecer vista"
        >
          <Box className="w-5 h-5 mb-0.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Nota adhesiva amarilla ("Tip") superior derecha */}
      <div className="absolute top-6 right-6 z-20 max-w-[210px] atelier-tip-note p-3 text-xs text-[#78350F] shadow-sm pointer-events-auto">
        <div className="flex items-center gap-1.5 font-bold mb-1 text-[#92400E]">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Consejo Didáctico</span>
        </div>
        <p className="leading-relaxed opacity-90">{instruccionTip}</p>
      </div>

      {/* Hotspots interactivos renderizados sobre el canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {hotspots.map((hp) => (
          <button
            key={hp.id}
            type="button"
            onClick={() => handleSelectHotspot(hp)}
            style={{ left: `${hp.xPercent}%`, top: `${hp.yPercent}%` }}
            className={`hotspot-dot pointer-events-auto flex items-center justify-center text-[10px] font-black text-white ${
              hotspotActivo?.id === hp.id ? 'scale-125 bg-[#EE7C6A] ring-4 ring-[#EE7C6A]/40' : ''
            }`}
            title={hp.nombre}
          >
            •
          </button>
        ))}
      </div>

      {/* Modal / Card flotante desplegable cuando se selecciona un hotspot */}
      {hotspotActivo && (
        <div className="absolute bottom-16 left-6 right-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#EFECE6] shadow-xl animate-fadeIn flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EE7C6A]">Componente Destacado</span>
            <h4 className="font-serif-atelier text-xl font-bold text-[#1C1917] mt-0.5">{hotspotActivo.nombre}</h4>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{hotspotActivo.descripcion}</p>
          </div>
          <button
            onClick={() => setHotspotActivo(null)}
            className="text-xs font-bold text-[#78716C] hover:text-[#1C1917] px-2 py-1 bg-[#F5F5F4] rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Leyenda inferior y control de Auto-rotate */}
      <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-auto">
        <div className="bg-white/85 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#EFECE6] text-xs font-medium text-[#57534E]">
          <span className="font-bold text-[#1C1917]">{nombreObjeto}</span> — <span className="italic">{subtitulo}</span>
        </div>

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            autoRotate ? 'bg-[#EE7C6A] text-white' : 'bg-white/90 text-[#57534E] border border-[#EFECE6]'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>Giro Automático</span>
        </button>
      </div>
    </div>
  );
};

export default Visor3DAtelier;
