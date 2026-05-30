import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/userApi';

const extractCustomer = (res: unknown): { id?: string } => {
  if (typeof res === 'object' && res !== null) {
    if ('data' in res) {
      return (res as Record<string, unknown>).data as { id?: string };
    }
    if ('id' in res) {
      return res as { id?: string };
    }
  }
  return {};
};

export const useCustomerId = () => {
    const accountId = useAuthStore((state) => state.user?.accountId);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCustomerId = async () => {
            if (!accountId) {
                setCustomerId(null);
                return;
            }

            setLoading(true);
            try {
                const res = await userApi.getCustomerByAccountId(accountId);
                if (isMounted) {
                    const customer = extractCustomer(res);
                    setCustomerId(customer.id ?? null);
                }
            } catch {
                if (isMounted) {
                    setCustomerId(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCustomerId();

        return () => {
            isMounted = false;
        };
    }, [accountId]);

    return { customerId, loading };
};
