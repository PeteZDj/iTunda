import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthResponse, UserRole } from '../types';

interface AuthState {
  token: string | null;
  userId: number | null;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  image: string | null;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (auth: AuthResponse) => void;
  logout: () => void;
  updateProfile: (patch: { name?: string; image?: string | null }) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role') as UserRole | null;
    const image = localStorage.getItem('image');
    const userId = Number(localStorage.getItem('userId')) || null;
    return { token, userId, name, email, role, image, isLoggedIn: !!token };
  });

  const login = (auth: AuthResponse) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('name', auth.name);
    localStorage.setItem('email', auth.email ?? '');
    localStorage.setItem('role', auth.role as string);
    localStorage.setItem('userId', String(auth.userId));
    if (auth.imagePath) localStorage.setItem('image', auth.imagePath); else localStorage.removeItem('image');
    setState({ token: auth.token, userId: auth.userId, name: auth.name, email: auth.email, role: auth.role, image: auth.imagePath ?? null, isLoggedIn: true });
  };

  const logout = () => {
    localStorage.clear();
    setState({ token: null, userId: null, name: null, email: null, role: null, image: null, isLoggedIn: false });
  };

  const updateProfile = (patch: { name?: string; image?: string | null }) => {
    setState(s => {
      const next = { ...s };
      if (patch.name !== undefined) { next.name = patch.name; localStorage.setItem('name', patch.name); }
      if (patch.image !== undefined) {
        next.image = patch.image;
        if (patch.image) localStorage.setItem('image', patch.image); else localStorage.removeItem('image');
      }
      return next;
    });
  };

  return <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
