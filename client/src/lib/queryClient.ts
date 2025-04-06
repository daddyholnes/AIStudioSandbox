import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = "";
    try {
      const errorData = await res.json();
      errorText = errorData.message || errorData.error || res.statusText;
    } catch (e) {
      errorText = res.statusText;
    }
    throw new Error(errorText);
  }
}

/**
 * Make a request to the API with type safety
 */
export async function apiRequest<TResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<TResponse> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  await throwIfResNotOk(res);

  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (endpoint: string) => Promise<T | null> =
  ({ on401 }) =>
  async (endpoint) => {
    try {
      return await apiRequest<T>(endpoint);
    } catch (e) {
      if (
        on401 === "returnNull" &&
        e instanceof Error &&
        e.message.includes("Unauthorized")
      ) {
        return null;
      }
      throw e;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});