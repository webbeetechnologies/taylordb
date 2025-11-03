import axios from 'axios';
import {getToken} from './auth';

const authApi = axios.create({
  baseURL: 'http://localhost:8070/graphql',
});

const apyApi = axios.create({
  baseURL: 'http://localhost:8090/graphql',
});

apyApi.interceptors.request.use(config => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

authApi.interceptors.request.use(config => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export {apyApi, authApi};
