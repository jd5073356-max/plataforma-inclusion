import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Carga diferida de Three.js: baja el bundle principal (~1.3 MB → se divide)
const Visor3D = React.lazy(() => import('./Visor3D'));

interface PuntoInteres {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Visor3DLazyProps {
  modeloUrl?: string;
  nombreObjeto: string;
  puntosDeInteres?: PuntoInteres[];
  onSeleccionar?: (punto: PuntoInteres) => void;
  alto?: number;
}

export default function Visor3DLazy({ modeloUrl, nombreObjeto, puntosDeInteres, onSeleccionar, alto = 420 }: Visor3DLazyProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full flex flex-col items-center justify-center gap-3" style={{ height: alto }}>
          <Loader2 className="w-8 h-8 text-[#EE7C6A] animate-spin" />
          <p className="text-xs font-bold text-[#78716C]">Preparando el visor 3D...</p>
        </div>
      }
    >
      <Visor3D modeloUrl={modeloUrl} nombreObjeto={nombreObjeto} puntosDeInteres={puntosDeInteres} onSeleccionar={onSeleccionar} alto={alto} />
    </Suspense>
  );
}
