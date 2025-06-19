import { Request, Response } from 'express';
import UserService from '../services/user.service'; // Assuming UserService is in ../services/user.service

interface IUserController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
}

const UserController: IUserController = {
  getProfile: async (req: Request, res: Response) => {
    await UserService.getProfile(req, res);
  },

  updateProfile: async (req: Request, res: Response) => {
    await UserService.updateProfile(req, res);
  },
};

export default UserController;