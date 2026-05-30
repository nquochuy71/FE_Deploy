const authBaseUrl = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081/api/v1';
const userBaseUrl = import.meta.env.VITE_USER_API_URL || 'http://localhost:8082/api/v1';
const catalogBaseUrl = import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:8083/api/v1';
const cartBaseUrl = import.meta.env.VITE_CART_API_URL || 'http://localhost:8084/api/v1';
const orderBaseUrl = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8085/api/v1';
const uploadBaseUrl = import.meta.env.VITE_UPLOAD_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const paymentBaseUrl = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:8087/api/v1';

const gatewayBaseUrl = import.meta.env.VITE_API_BASE_URL;
const useGateway = !!gatewayBaseUrl;

export const serviceBase = {
  auth: authBaseUrl,
  user: userBaseUrl,
  catalog: catalogBaseUrl,
  cart: cartBaseUrl,
  order: orderBaseUrl,
  upload: uploadBaseUrl,
  payment: paymentBaseUrl,
  useGateway,
};

export const resolveBaseUrl = (directBaseUrl: string) => {
  return useGateway ? undefined : directBaseUrl;
};
