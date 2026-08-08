<p align="center">
  <img src="./hero-banner.png" alt="ECO INCLUSIVO — Plataforma de Inclusión Educativa Adaptativa Header" width="100%" />
</p>

# ECO INCLUSIVO — Plataforma de Inclusión Educativa Adaptativa

[![status](https://img.shields.io/badge/status-en%20producción-success?style=for-the-badge)](https://plataforma-inclusion-adaptativa.vercel.app/login)
[![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

> **Sistema web adaptativo para la gestión de educación inclusiva.** Solución integral orientada al cumplimiento de marcos normativos de inclusión educativa (Decreto 1421), proporcionando herramientas de accesibilidad, voz sintética, actividades interactivas adaptadas y seguimiento pedagógico en tiempo real.

- **Demo en vivo:** [plataforma-inclusion-adaptativa.vercel.app/login](https://plataforma-inclusion-adaptativa.vercel.app/login)

---

## 🎯 ¿Por qué existe esta plataforma? (La Problemática)

En el sistema educativo tradicional, los estudiantes con necesidades educativas diversas (discapacidad cognitiva, motora, auditiva o visual) enfrentan barreras severas al interactuar con contenidos académicos estandarizados. 

**Problemas detectados:**
1. **Falta de contenidos adaptados:** Los materiales digitales comunes carecen de síntesis de voz, pictogramas, ajustes de contraste o tipografías accesibles.
2. **Carga administrativa para los docentes:** Elaborar y mantener los Planes Individuales de Ajustes Razonables (PIAR) requiere horas de trabajo manual sin herramientas centralizadas.
3. **Falta de seguimiento objetivo:** Dificultad para medir el progreso real del estudiante de forma cuantitativa y cualitativa.

---

## ⚡ ¿Para qué sirve? (El Propósito y Solución)

**ECO INCLUSIVO** transforma el aula de clase digital permitiendo que cada estudiante consuma el contenido académico según sus capacidades individuales, mientras que los profesores pueden crear, adaptar y monitorear actividades en tiempo real.

### Componentes Clave:
- **Reproductor Adaptativo:** Actividades interactivas con lector de voz sintética (Text-to-Speech), dictado de preguntas, asistencia visual y botones de respuesta simplificados.
- **Creador de Actividades para Docentes:** Editor intuitivo para diseñar evaluaciones de opción múltiple, ordenamiento y preguntas auditivas con felicitación inmediata y feedback positivo.
- **Gestión de Estudiantes y Cursos:** Registro individual de estudiantes por aula (`3A`, `4B`), seguimiento de intentos y almacenamiento seguro en Supabase.
- **Tablero Administrativo:** Métricas globales de uso, control de accesos y auditoría pedagógica.

---

## 🏗️ Arquitectura de la Aplicación

```mermaid
graph TD
    Client([Navegador / Dispositivo Estudiante o Docente]) -->|React + TypeScript SPA| Router[React Router DOM]
    
    subgraph Capa de Presentación
        Router --> Login[Portal de Login Multi-rol]
        Router --> AdminPanel[Panel Administrativo]
        Router --> TeacherPanel[Panel del Profesor / Creador de Actividades]
        Router --> StudentPanel[Panel del Estudiante / Reproductor Adaptativo]
    end
    
    subgraph Capa de Datos y Servicios
        Login & TeacherPanel & StudentPanel <--> AuthCtx[AuthContext / LocalStorage Fallback]
        AuthCtx <--> SupabaseSDK[Supabase Client JS]
        SupabaseSDK <--> SupabaseDB[(PostgreSQL 17 Database)]
    end
```

---

## 👥 Paneles y Roles del Sistema

| Rol | Vistas Accedidas | Funcionalidades Principales |
|---|---|---|
| **Estudiante** | `/estudiante`, `/estudiante/actividad/:id` | Reproductor adaptativo con audio-lectura, selección de respuestas visuales, retroalimentación positiva. |
| **Profesor** | `/profesor`, `/profesor/estudiantes`, `/profesor/actividades` | Registro de nuevos estudiantes, creación y edición de actividades educativas por etapa, reporte de progreso. |
| **Administrador** | `/admin` | Gestión de usuarios, métricas de plataforma y configuración global. |

---

## 🛠️ Stack Tecnológico

- **Frontend Core:** React 18, TypeScript, Vite.
- **Estilos & UI:** Tailwind CSS, Lucide React (iconografía accesible).
- **Backend & Base de Datos:** Supabase (PostgreSQL 17, Row Level Security, Auth).
- **Accesibilidad & Audio:** Web Speech API (Síntesis de voz nativa del navegador), soporte para grabador de voz HTML5.
- **Despliegue:** Vercel CI/CD automatizado.

---

## 🔑 Variables de Entorno (`.env`)

```env
# Conexión a Supabase (Opcional - incluye modo mock para pruebas locales)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## 🚀 Inicio Rápido en Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/jd5073356-max/plataforma-inclusion.git
cd plataforma-inclusion

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 👤 Autor

**Juan David Herrera**  
*AI Automation Engineer | Product Engineer · AI, Systems & Web3*  
Bogotá, Colombia  
- **GitHub:** [@jd5073356-max](https://github.com/jd5073356-max)  
- **LinkedIn:** [linkedin.com/in/juan-david-herrera](https://linkedin.com)
