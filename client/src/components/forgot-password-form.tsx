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
import API from "@/utils/axiosInstance";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isLoading, setIsLoading] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isLoading) return; // Prevent multiple submissions

		if (emailRef.current) {
			const emailValue = emailRef.current.value.trim();

			if (!emailValue || emailValue.length === 0) {
				toast.error("Please enter your email address.");
				return;
			}

			setIsLoading(true);

			const loadingToast = toast.loading("Sending reset link...");

			API.post("/auth/forgot-password", {
				email: emailValue,
			})
				.then((response) => {
					toast.dismiss(loadingToast);
					console.log("Reset link sent:", response.data);
					toast.success("Password reset link sent to your email!");
				})
				.catch((error) => {
					toast.dismiss(loadingToast);
					console.error("Reset request failed:", error);
					const errorMessage =
						error.response?.data?.error ||
						"Failed to send reset link. Please try again.";
					toast.error(errorMessage);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Reset your password</CardTitle>
					<CardDescription>
						Enter your email and we'll send you a link to reset your
						password
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<div className="flex flex-col gap-6">
							<div className="grid gap-3">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="mail@example.com"
									required
									disabled={isLoading}
									ref={emailRef}
								/>
							</div>
							<div className="flex flex-col gap-3">
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={isLoading}
								>
									{isLoading
										? "Sending..."
										: "Send Reset Link"}
								</Button>
							</div>
						</div>
						<div className="mt-4 text-center text-sm">
							Remember your password?{" "}
							<Link
								to="/"
								className="underline underline-offset-4"
							>
								Back to login
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
