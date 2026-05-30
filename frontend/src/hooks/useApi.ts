import { useState, useEffect, useRef } from 'react';

interface UseApiOptions {
  timeout?: number; // timeout in ms, default 5000
}

interface UseApiState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export const useApi = <T,>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  options: UseApiOptions = {}
): UseApiState<T> => {
  const { timeout = 5000 } = options;
  const [data, setData] = useState<T>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => reject(new Error('API timeout')), timeout);
        });

        const result = await Promise.race([apiCall(), timeoutPromise]);

        if (isMounted) {
          setData(result);
          setIsUsingFallback(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('API call failed, using fallback data:', err);
          setData(fallbackData);
          setIsUsingFallback(true);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [apiCall, fallbackData, timeout]);

  return { data, loading, error, isUsingFallback };
};
