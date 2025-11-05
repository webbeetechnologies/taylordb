import axios from 'axios';
import {getToken} from './auth';

const umsApi = axios.create({
  baseURL: 'http://localhost:8070/graphql',
});

const taylorApi = axios.create({
  baseURL: 'http://localhost:8090',
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

export {taylorApi, umsApi};
