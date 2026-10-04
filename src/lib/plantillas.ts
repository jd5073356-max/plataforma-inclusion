import { Etapa } from '../types/actividad';

// Esqueleto de las 5 rutas guiadas del seed. Los contenidos vivos están en
// seed-activities.json; este archivo solo define las rutas (las consume db.ts
// para MOCK_ETAPAS).
export const ETAPA_ANDRES: Etapa = { id: 'etapa-andres', nombre: 'Guía Andrés — Grado 8 · Tangram y dinero', orden: 3, profesor_id: 'profesor-1' };
export const ETAPA_DAVID: Etapa = { id: 'etapa-david', nombre: 'Guía David — Grado 7 · Números enteros', orden: 4, profesor_id: 'profesor-1' };
export const ETAPA_YESSICA: Etapa = { id: 'etapa-yessica', nombre: 'Guía Yessica — Grado 8 · La casa EN/ES', orden: 5, profesor_id: 'profesor-1' };
export const ETAPA_MARIA: Etapa = { id: 'etapa-maria', nombre: 'Guía María Paula — Grado 9 · Biología', orden: 6, profesor_id: 'profesor-1' };
export const ETAPA_EMOCIONES: Etapa = { id: 'etapa-emociones', nombre: 'Guía Convivencia — Emociones', orden: 7, profesor_id: 'profesor-1' };

export const ETAPAS_GUIA: Etapa[] = [ETAPA_ANDRES, ETAPA_DAVID, ETAPA_YESSICA, ETAPA_MARIA, ETAPA_EMOCIONES];
