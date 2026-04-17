import { useEffect, useState } from "react";
import { generateGeminiJson } from "@/lib/gemini";

const DAY_MS = 24 * 60 * 60 * 1000;

interface CacheRecord<T> {
  timestamp: number;
  data: T;
}

export function useDailyGemini<T>(cacheKey: string, prompt: string, fallback: T, ttlMs: number = DAY_MS) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (typeof window !== "undefined") {
          const cachedRaw = window.localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as CacheRecord<T>;
            const fresh = Date.now() - cached.timestamp < ttlMs;
            if (fresh) {
              setData(cached.data);
              setLoading(false);
              return;
            }
          }
        }

        const freshData = await generateGeminiJson<T>(prompt, { responseMimeType: "application/json" });
        if (!isMounted) return;
        setData(freshData);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({ timestamp: Date.now(), data: freshData } satisfies CacheRecord<T>),
          );
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to refresh data";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [cacheKey, prompt, ttlMs]);

  return { data, loading, error };
}
