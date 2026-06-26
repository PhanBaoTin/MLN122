import { create } from 'zustand';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
}

interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  token: localStorage.getItem('adminToken'),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  
  setAuth: (admin, token) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(admin));
    set({ admin, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ admin: null, token: null, isAuthenticated: false });
  },
}));
