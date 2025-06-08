import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  verifyToken(req: Request, res: Response): Promise<void>;
}

const AuthController: IAuthController = {
  register: async (req: Request, res: Response) => {
    await AuthService.register(req, res);
  },

  login: async (req: Request, res: Response) => {
    await AuthService.login(req, res);
  },

  verifyToken: async (req: Request, res: Response) => {
    await AuthService.verifyToken(req, res);
  },
};

export default AuthController;