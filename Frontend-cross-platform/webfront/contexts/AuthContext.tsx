"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService, type User } from "../services/auth.service";
import { employeeService } from "../services/employee.service";
import { clearAccessToken, getAccessToken, onUnauthorized } from "../services/api";

export type Portal = "optician" | "employee";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  portal: Portal;
  storeId: string;
  login: (email: string, password: string) => Promise<void>;
  register: (
    input: { prenom: string; nom: string; email: string; password: string },
  ) => Promise<void>;
  logout: () => void;
  setStoreId: (storeId: string) => void;
  refreshUser: () => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const PORTAL_KEY = "lunetty.portal";
const STORE_KEY = "lunetty.store-id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [portal, setPortalState] = useState<Portal>("optician");
  const [storeId, setStoreIdState] = useState("");

  const setStoreId = useCallback((id: string) => {
    setStoreIdState(id);
    if (id) window.sessionStorage.setItem(STORE_KEY, id);
    else window.sessionStorage.removeItem(STORE_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await authService.me();
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const restoreWorkspace = async () => {
      await Promise.resolve();
      const savedPortal = window.sessionStorage.getItem(PORTAL_KEY);
      setPortalState(savedPortal === "employee" ? "employee" : "optician");
      setStoreIdState(window.sessionStorage.getItem(STORE_KEY) ?? "");
    };
    void restoreWorkspace();
    const unsubscribe = onUnauthorized(() => setUser(null));
    if (!getAccessToken()) {
      void (async () => {
        await Promise.resolve();
        setLoading(false);
      })();
      return unsubscribe;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => {
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (
      !loading &&
      user?.doit_changer_mot_de_passe &&
      window.location.pathname !== "/change-password"
    ) {
      router.replace("/change-password");
    }
  }, [loading, router, user?.doit_changer_mot_de_passe]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const current = await authService.changePassword(
        currentPassword,
        newPassword,
      );
      setUser(current);
      router.replace(`/${portal}/dashboard`);
    },
    [portal, router],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const current = await authService.login(email, password);
      setUser(current);
      if (current.doit_changer_mot_de_passe) {
        setPortalState("employee");
        window.sessionStorage.setItem(PORTAL_KEY, "employee");
        router.replace("/change-password");
        return;
      }

      try {
        const membershipResult = await employeeService.me();
        const stores = Array.isArray(membershipResult.stores)
          ? membershipResult.stores
          : [];
        const nextPortal: Portal = stores.some(
          (membership) => membership.role === "PROPRIETAIRE",
        )
          ? "optician"
          : stores.length > 0
            ? "employee"
            : "optician";
        const nextStoreId =
          stores.find((membership) => membership.role === "PROPRIETAIRE")
            ?.storeId ??
          stores[0]?.storeId ??
          "";
        setPortalState(nextPortal);
        window.sessionStorage.setItem(PORTAL_KEY, nextPortal);
        setStoreId(nextStoreId);
        router.replace(
          nextPortal === "optician" && !nextStoreId
            ? "/optician/setup"
            : `/${nextPortal}/dashboard`,
        );
      } catch (reason) {
        clearAccessToken();
        setUser(null);
        throw reason;
      }
    },
    [router, setStoreId],
  );

  const register = useCallback(
    async (
      input: { prenom: string; nom: string; email: string; password: string },
    ) => {
      const current = await authService.register(input);
      setUser(current);
      setPortalState("optician");
      window.sessionStorage.setItem(PORTAL_KEY, "optician");
      router.replace("/optician/setup");
    },
    [router],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      portal,
      storeId,
      login,
      register,
      logout,
      setStoreId,
      refreshUser,
      changePassword,
    }),
    [
      user,
      loading,
      portal,
      storeId,
      login,
      register,
      logout,
      setStoreId,
      refreshUser,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
