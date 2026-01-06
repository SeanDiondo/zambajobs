import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isFetching, error } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isFetching,
    error,
    isAuthenticated: !!user,
    needsOnboarding: user && !user.role,
  };
}
