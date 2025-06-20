import { Request, Response } from 'express';
import UserService from '../services/user.service'; // Assuming UserService is in ../services/user.service

interface IUserController {
  getEditProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
}

const UserController: IUserController = {
  getEditProfile: async (req: Request, res: Response) => {
    await UserService.getEditProfile(req, res);
  },

  updateProfile: async (req: Request, res: Response) => {
    await UserService.updateProfile(req, res);
  },
};

export default UserController;