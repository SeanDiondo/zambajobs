import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";

interface AuthContextType {
  user: UserType | null | undefined;
  isLoading: boolean;
  isError: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useQuery<UserType>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, isError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
