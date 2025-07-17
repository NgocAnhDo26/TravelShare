import React, { useState, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Upload } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import toast from 'react-hot-toast';
import API from '@/utils/axiosInstance';

type EditProfileFormProps = {
  user: {
    username: string;
    avatarUrl: string;
    email?: string;
  };
  onSuccess?: () => void;
} & React.ComponentProps<'div'>;

const EditProfileForm = ({ user, onSuccess }: EditProfileFormProps) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // cập nhật ảnh preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Username cannot be empty.');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      await API.put('/users/profiles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile updated successfully!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile.');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' className='flex-1 cursor-pointer'>
          <Pencil />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>
            Enter your new username and/or change your picture
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <div className='grid gap-3'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='grid gap-3'>
            <Label>Current Avatar</Label>
            <Avatar className="w-24 h-24">
              <AvatarImage src={previewUrl} />
              <AvatarFallback className='text-2xl font-bold'>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='avatar'>Change Avatar</Label>
            <div className='flex items-center gap-3'>
              <Input
                id='avatar'
                type='file'
                accept='image/*'
                className='hidden'
                ref={avatarInputRef}
                onChange={handlePhotoChange}
              />
              <Button
                type='button'
                variant='outline'
                onClick={() => avatarInputRef.current?.click()}
                className='flex items-center gap-2 cursor-pointer'
              >
                <Upload />
                Upload Photo
              </Button>
              {avatarFile && (
                <span className='text-sm text-gray-600'>
                  {avatarFile.name.length > 20
                    ? avatarFile.name.slice(0, 17) + '...'
                    : avatarFile.name}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' className='cursor-pointer'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='submit' className='cursor-pointer'>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileForm;
