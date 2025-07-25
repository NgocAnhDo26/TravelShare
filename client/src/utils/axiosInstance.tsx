import axios from 'axios';
import { API_CONFIG } from '@/config/env';

const env = API_CONFIG.ENV;
console.warn('VITE_ENV:', env);
let baseURL: string;

switch (env) {
  case 'local':
    baseURL = 'http://localhost:3000/api';
    break;
  case 'dev':
    if (!API_CONFIG.DEV_URL) {
      throw new Error('VITE_API_URL_DEV is not defined for dev mode.');
    }
    baseURL = API_CONFIG.DEV_URL;
    break;
  case 'prod':
    if (!API_CONFIG.PROD_URL) {
      throw new Error('VITE_API_URL_PROD is not defined for prod mode.');
    }
    baseURL = API_CONFIG.PROD_URL;
    break;
  default:
    console.warn('Unknown VITE_ENV. Defaulting to local mode.');
    baseURL = 'http://localhost:3000/api';
}

const API = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // Include credentials for Cookies
});

export default API;
