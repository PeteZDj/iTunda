import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthResponse, UserRole } from '../types';

interface AuthState {
  token: string | null;
  userId: number | null;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role') as UserRole | null;
    const userId = Number(localStorage.getItem('userId')) || null;
    return { token, userId, name, email, role, isLoggedIn: !!token };
  });

  const login = (auth: AuthResponse) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('name', auth.name);
    localStorage.setItem('email', auth.email ?? '');
    localStorage.setItem('role', auth.role as string);
    localStorage.setItem('userId', String(auth.userId));
    setState({ token: auth.token, userId: auth.userId, name: auth.name, email: auth.email, role: auth.role, isLoggedIn: true });
  };

  const logout = () => {
    localStorage.clear();
    setState({ token: null, userId: null, name: null, email: null, role: null, isLoggedIn: false });
  };

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
