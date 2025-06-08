import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include credentials for Cookies
});

export default API;