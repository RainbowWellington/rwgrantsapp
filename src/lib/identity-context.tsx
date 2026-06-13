import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getUser,
  logout as nlLogout,
  onAuthChange,
  type User,
} from "@netlify/identity";

interface IdentityContextValue {
  /** The current Identity user, or null when signed out. */
  user: User | null;
  /** False until the initial session lookup has completed. */
  ready: boolean;
  /** Signs the current user out and clears the session. */
  logout: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

/**
 * Provides client-side Netlify Identity auth state to the React tree. Hydrates
 * from the `nf_jwt` cookie on mount and stays in sync with login/logout events
 * (including changes made in other browser tabs).
 */
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u ?? null);
      setReady(true);
    });

    return onAuthChange((_event, u) => {
      setUser(u ?? null);
    });
  }, []);

  return (
    <IdentityContext.Provider value={{ user, ready, logout: nlLogout }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx)
    throw new Error("useIdentity must be used within an IdentityProvider");
  return ctx;
}
