import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, correoInterno } from '../lib/db';
import { Perfil } from '../types/actividad';

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
        const data = await db.getCurrentUser();
        if (data) {
          setUser(data.user);
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Error loading current user', err);
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
      const data = await db.signIn(email, pass);
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
