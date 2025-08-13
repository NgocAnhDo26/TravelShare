import { io } from 'socket.io-client';

const URL = () => {
  switch (import.meta.env.VITE_ENV) {
    case 'local':
      return 'http://localhost:3000';
    case 'production':
      return import.meta.env.VITE_API_URL_PROD;
    default:
      return import.meta.env.VITE_API_URL_DEV;
  }
};

export const socket = io(URL(), {
  autoConnect: false, // We will connect manually
});