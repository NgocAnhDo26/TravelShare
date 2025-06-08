import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <RegisterForm className="w-full max-w-md" />
    </div>
  );
}