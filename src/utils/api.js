import axios from 'axios';
import { WEIGHT_API_URL } from '../config.js';
import { useUserStore } from '../stores/user.js';
import router from '../router.js';

const api = axios.create({ baseURL: WEIGHT_API_URL });

const API_ERROR_THRESHOLD = 2;
let consecutiveApiErrors = 0;
let navigatingToErrorPage = false;

export const resetApiErrorStreak = () => {
  consecutiveApiErrors = 0;
  navigatingToErrorPage = false;
};

api.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.getToken) config.headers['x-auth-token'] = userStore.getToken;
  return config;
});

api.interceptors.response.use(
  (response) => {
    resetApiErrorStreak();
    return response;
  },
  async (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      resetApiErrorStreak();
      useUserStore().reset();
      await router.push('/login');
      return Promise.reject(error);
    }

    const isApiOutage = !error?.response || error.response.status >= 500;

    if (isApiOutage) {
      consecutiveApiErrors += 1;

      if (consecutiveApiErrors >= API_ERROR_THRESHOLD) {
        error.isApiOutage = true;

        if (!navigatingToErrorPage) {
          navigatingToErrorPage = true;
          await router.replace('/error');
        }
      }
    } else {
      resetApiErrorStreak();
    }

    return Promise.reject(error);
  }
);

export default api;
