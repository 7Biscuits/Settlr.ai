import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as apiLogin, register as apiRegister, getMe } from "../api/auth";
import { getToken, setToken, clearToken } from "../api/session";
import { setUnauthorizedHandler } from "../api/client";
import type { User } from "../api/types";

interface AuthState {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, name: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  // Restore session on launch: if a token exists, validate it via /auth/me.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const { user } = await getMe();
          setUser(user);
        }
      } catch {
        await clearToken();
      } finally {
        setInitializing(false);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(
    async (email: string, name: string, password: string) => {
      const res = await apiRegister(email, name, password);
      await setToken(res.token);
      setUser(res.user);
    },
    [],
  );

  const value = useMemo(
    () => ({ user, initializing, signIn, signUp, signOut }),
    [user, initializing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
