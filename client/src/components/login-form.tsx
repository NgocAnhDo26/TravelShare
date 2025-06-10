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

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isLoading) return; // Prevent multiple submissions

		if (emailRef.current && passwordRef.current) {
			const emailValue = emailRef.current.value.trim();
			const passwordValue = passwordRef.current.value.trim();

			if (!emailValue || !passwordValue) {
				toast.error("Please fill in all fields.");
				return;
			}

			setEmail(emailValue);
			setPassword(passwordValue);
			setIsLoading(true);

			const loadingToast = toast.loading("Logging in...");

			API.post("/auth/login", {
				email: email,
				password: password,
			})
				.then((response) => {
					toast.dismiss(loadingToast);
					console.log("Login successful:", response.data);
					toast.success("Login successful!");
				})
				.catch((error) => {
					toast.dismiss(loadingToast);
					console.error("Login failed:", error);
					const errorMessage =
						error.response?.data?.error ||
						"Login failed. Please check your credentials.";
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
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
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
							<div className="grid gap-3">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
									<a
										href="#"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										Forgot your password?
									</a>
								</div>
								<Input
									id="password"
									type="password"
									required
									disabled={isLoading}
									ref={passwordRef}
									placeholder="*********"
								/>
							</div>
							<div className="flex flex-col gap-3">
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={isLoading}
								>
									{isLoading ? "Logging in..." : "Login"}
								</Button>
								<Button
									variant="outline"
									className="w-full"
									disabled={isLoading}
									type="button"
								>
									Login with Google
								</Button>
							</div>
						</div>
						<div className="mt-4 text-center text-sm">
							Don&apos;t have an account?{" "}
							<a
								href="/register"
								className="underline underline-offset-4"
							>
								Sign up
							</a>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
