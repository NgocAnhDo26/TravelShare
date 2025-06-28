import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import API from "@/utils/axiosInstance";
import { Button } from "./ui/button";

type EditProfileFormProps = {
  user: {
    username: string;
    avatarUrl: string;
  };
} & React.ComponentProps<"div">;

const EditProfileForm = ({
  user,
  className,
  ...props
}: EditProfileFormProps) => {
  const [username, setUsername] = useState(user.username);
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
      toast.error("Username cannot be empty.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      await API.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Edit your profile</CardTitle>
          <CardDescription>
            Enter your new account name and change your picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Current Avatar</Label>
              <img
                src={previewUrl}
                alt="Current Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="avatar">Change avatar</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={avatarInputRef}
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                {avatarFile && (
                  <span className="text-sm text-gray-600">
                    {avatarFile.name}
                  </span>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfileForm;
