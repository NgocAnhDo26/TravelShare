import { Request, Response } from 'express';
import User from '../models/user.model';
import mongoose from 'mongoose';


interface UpdateProfileData {
  displayName?: string;
  username?: string;
  email?: string;
  fileUrl?: string;
}

interface IUserService {
  getEditProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
}


const UserService: IUserService = {
 
  getEditProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: 'Invalid user ID format.' });
        return;
    }

    try {
     
      const userProfile = await User.findById(userId).select('displayName username email avatarUrl');

      if (!userProfile) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json(userProfile);

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { displayName, username, email, fileUrl }: UpdateProfileData = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: 'Invalid user ID format.' });
        return;
    }
    
    try {
    
      if (username) {
        const existingUserByUsername = await User.findOne({ 
          username: username.trim().toLowerCase(),
          _id: { $ne: userId }
        });
        if (existingUserByUsername) {
          res.status(409).json({ error: 'Username already exists.' });
          return;
        }
      }
      if (email) {
        const existingUserByEmail = await User.findOne({ 
          email: email.trim().toLowerCase(),
          _id: { $ne: userId } 
        });
        if (existingUserByEmail) {
          res.status(409).json({ error: 'Email already exists.' });
          return;
        }
      }

      const updateFields: any = {};
      if (displayName) updateFields.displayName = displayName;
      if (username) updateFields.username = username.trim().toLowerCase();
      if (email) updateFields.email = email.trim().toLowerCase();
      if (fileUrl) updateFields.avatarUrl = fileUrl;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      )
    
      .select('displayName username email avatarUrl');

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser,
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

export default UserService;