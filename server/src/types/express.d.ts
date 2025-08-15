import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: string;
      io?: Server;
    }
  }
}

export {};
