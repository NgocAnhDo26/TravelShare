import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <LoginForm className='w-full max-w-md' />
    </div>
  );
}
