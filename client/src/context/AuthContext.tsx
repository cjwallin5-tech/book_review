import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getToken, setToken, clearToken, getMe, login as apiLogin, register as apiRegister, updateProfile as apiUpdateProfile } from "../api";

export interface User {
  id: number;
  username: string;
  bio: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { bio?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      getMe()
        .then((u) => setUser({ id: u.id, username: u.username, bio: u.bio ?? "", avatar_url: u.avatar_url ?? "" }))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const res = await apiLogin(username, password);
    setToken(res.token);
    setUser(res.user as User);
  }

  async function register(username: string, password: string) {
    const res = await apiRegister(username, password);
    setToken(res.token);
    setUser(res.user as User);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  async function updateProfile(data: { bio?: string; avatar_url?: string }) {
    const updated = await apiUpdateProfile(data);
    setUser((prev) => prev ? { ...prev, ...updated } : prev);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
