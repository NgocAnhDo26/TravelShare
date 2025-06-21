import axios from 'axios';

const env = import.meta.env.VITE_ENV;
console.warn('VITE_ENV:', env);
let baseURL: string;

switch (env) {
  case 'local':
    baseURL = 'http://localhost:3000/api';
    break;
  case 'dev':
    if (!import.meta.env.VITE_API_URL_DEV) {
      throw new Error('VITE_API_URL_DEV is not defined for dev mode.');
    }
    baseURL = import.meta.env.VITE_API_URL_DEV;
    break;
  case 'prod':
    if (!import.meta.env.VITE_API_URL_PROD) {
      throw new Error('VITE_API_URL_PROD is not defined for prod mode.');
    }
    baseURL = import.meta.env.VITE_API_URL_PROD;
    break;
  default:
    console.warn('Unknown VITE_ENV. Defaulting to local mode.');
    baseURL = 'http://localhost:3000/api';
}

const API = axios.create({
  baseURL,
  // timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include credentials for Cookies
});

export default API;
