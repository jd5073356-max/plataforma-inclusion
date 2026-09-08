import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, correoInterno, activarModoMock, prepararModoDatos } from '../lib/db';
import { Perfil } from '../types/actividad';

// Un fallo de red (Supabase inalcanzable) activa el modo mock de emergencia;
// los errores de credenciales se dejan pasar tal cual.
const esFalloDeRed = (err: unknown): boolean =>
  err instanceof TypeError ||
  /failed to fetch|fetch failed|networkerror|load failed/i.test(
    err instanceof Error ? err.message : String(err)
  );

interface AuthContextType {
  user: any;
  profile: Perfil | null;
  loading: boolean;
  login: (emailOrName: string, pass: string, course?: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStudent: (nombre: string, curso: string, contrasena: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        await prepararModoDatos();
        const data = await db.getCurrentUser();
        if (data) {
          setUser(data.user);
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Error loading current user', err);
        if (esFalloDeRed(err)) {
          activarModoMock();
          try {
            const data = await db.getCurrentUser();
            if (data) {
              setUser(data.user);
              setProfile(data.profile);
            }
          } catch {
            // seguir sin sesión en modo mock
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (emailOrName: string, pass: string, course?: string) => {
    setLoading(true);
    try {
      let email = emailOrName;
      if (course) {
        // If course is provided, it's a student login, resolve internal email
        email = correoInterno(emailOrName, course);
      }
      let data: Awaited<ReturnType<typeof db.signIn>>;
      try {
        data = await db.signIn(email, pass);
      } catch (err) {
        if (!esFalloDeRed(err)) throw err;
        // Supabase inalcanzable → conmutar a mock y reintentar
        activarModoMock();
        data = await db.signIn(email, pass);
      }
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await db.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error logging out', err);
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (nombre: string, curso: string, contrasena: string) => {
    if (!profile || profile.rol !== 'profesor') {
      throw new Error('Solo los profesores pueden registrar estudiantes');
    }
    await db.crearEstudiante(nombre, curso, contrasena, profile.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, registerStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
