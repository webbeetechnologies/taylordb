import axios from 'axios';
import { getToken } from './auth.js';

const umsApi = axios.create({
  baseURL:
    process.env.TAYLORDB_UMS_BASE_URL || 'https://ums.taylordb.ai/graphql',
});

const taylorApi = axios.create({
  baseURL: process.env.TAYLORDB_SERVER_BASE_URL || 'https://server.taylordb.ai',
});

umsApi.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

taylorApi.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { taylorApi, umsApi };
