import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  verifyToken(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
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
  forgotPassword: async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req, res);
  },
  resetPassword: async (req: Request, res: Response) => {
    await AuthService.resetPassword(req, res);
  },
  logout: async (req: Request, res: Response) => {
    await AuthService.logout(req, res);
  }
};

export default AuthController;
