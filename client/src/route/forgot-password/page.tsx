import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}