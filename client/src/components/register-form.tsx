import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { Eye, EyeOff, Upload } from "lucide-react";
import PswStrength, { customPasswordStrength } from "./password-strength";
import toast from "react-hot-toast";
import API from "@/utils/axiosInstance";

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const profilePhotoRef = useRef<HTMLInputElement>(null);
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePhoto(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        const email = emailRef.current?.value.trim();
        const username = usernameRef.current?.value.trim();
        const passwordValue = passwordRef.current?.value.trim();
        const confirmPasswordValue = confirmPasswordRef.current?.value.trim();
        const profilePhotoFile = profilePhotoRef.current?.files?.[0];
        
        if (
            !email ||
            !username ||
            !passwordValue ||
            !confirmPasswordValue
        ) {
            toast.error("Please fill in all required fields.");
            return;
        }
        
        if (passwordValue !== confirmPasswordValue) {
            toast.error("Passwords do not match.");
            return;
        }
        
        if (!customPasswordStrength(passwordValue)) {
            toast.error("Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.");
            return;
        }
        
        if (profilePhotoFile && !profilePhotoFile.type.startsWith("image/")) {
            toast.error("Please upload a valid image file for the profile photo.");
            return;
        }
        
        // send data to the server
        const formData = new FormData();
        formData.append("email", email);
        formData.append("username", username);
        formData.append("password", passwordValue);
        if (profilePhotoFile) {
            formData.append("avatar", profilePhotoFile);
        }
        
        API.post("/auth/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
            .then(() => {
                toast.success("Account created successfully!");
                // Optionally redirect to login/home or reset the form, but for now, just clear the form
                emailRef.current!.value = "";
                usernameRef.current!.value = "";
                passwordRef.current!.value = "";
                confirmPasswordRef.current!.value = "";
                setProfilePhoto(null);
                setPassword("");
                setConfirmPassword("");
                setShowPassword(false);
                setShowConfirmPassword(false);
                if (profilePhotoRef.current) {
                    profilePhotoRef.current.value = ""; // Clear the file input
                }
            })
            .catch((error) => {
                console.error("Error creating account:", error);
                toast.error("Failed to create account. Please try again.");
            });
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                        Enter your information below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="mail@example.com"
                                    required
                                    ref={emailRef}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    max="30"
                                    min="1"
                                    placeholder="Username"
                                    required
                                    ref={usernameRef}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="profile-photo">
                                    Profile Photo (Optional)
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="avatar"
																				name="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        ref={profilePhotoRef}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            document
                                                .getElementById("avatar")
                                                ?.click()
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Choose Photo
                                    </Button>
                                    {profilePhoto && (
                                        <span className="text-sm text-gray-600">
                                            {profilePhoto.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        max="50"
                                        placeholder="Enter your password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        ref={passwordRef}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {password && (
                                    <PswStrength password={password} />
                                )}
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="confirm-password">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        placeholder="Re-enter your password"
                                        max="50"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        ref={confirmPasswordRef}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" onClick={handleSubmit}>
                                    Create Account
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Sign up with Google
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <a
                                href="/"
                                className="underline underline-offset-4"
                            >
                                Sign in
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
