import axios from 'axios';
import { WEIGHT_API_URL } from '../config.js';
import { useUserStore } from '../stores/user.js';
import router from '../router.js';

const api = axios.create({ baseURL: WEIGHT_API_URL });

api.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.getToken) config.headers['x-auth-token'] = userStore.getToken;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      useUserStore().reset();
      await router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
