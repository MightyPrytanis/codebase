import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    }).catch((error) => {
      // Silently handle network errors (CORS, connection refused, etc.)
      // Return a mock response that will be handled gracefully
      return new Response(null, { status: 503, statusText: 'Service Unavailable' });
    });

    // Don't throw on network errors - let components handle gracefully
    if (res.status === 503 || res.status === 0) {
      return res; // Let the caller handle it
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Return a response that won't crash the app
    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      }).catch((error) => {
        // Silently handle network errors - return null to prevent UI blocking
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Don't throw on network errors - return null gracefully
      if (res.status === 503 || res.status === 0 || !res.ok) {
        return null as T;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Return null instead of throwing to prevent UI blocking
      return null as T;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
