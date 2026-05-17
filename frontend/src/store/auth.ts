// Greenpack Pro — Auth Store (Zustand)
import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      set({
        token: data.access_token,
        user: { id: data.user_id, email: data.email, full_name: data.full_name,
                role: data.role, company_id: '' },
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const user = await authApi.me();
      set({ user, token });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, token: null });
    }
  },
}));
