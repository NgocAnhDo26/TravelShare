import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, useEffect } from 'react';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import PswStrength, { customPasswordStrength } from './password-strength';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return; // Prevent multiple submissions

    if (passwordRef.current) {
      const passwordValue = passwordRef.current.value.trim();

      if (!customPasswordStrength(passwordValue)) {
        toast.error('Password does not meet strength requirements.');
        return;
      }

      setIsLoading(true);

      const loadingToast = toast.loading('Setting new password...');

      API.post('/auth/reset-password', {
        token: token,
        newPassword: passwordValue,
      })
        .then((response) => {
          toast.dismiss(loadingToast);
          console.log('Password reset successful:', response.data);
          toast.success('Password has been reset successfully!');
          setTimeout(() => navigate('/login'), 2000);
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          console.error('Password reset failed:', error);
          const errorMessage =
            error.response?.data?.error ||
            'Failed to reset password. Please try again.';
          toast.error(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-3'>
                <Label htmlFor='password'>New Password</Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter new password'
                    required
                    disabled={isLoading}
                    ref={passwordRef}
                    minLength={8}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-gray-500' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-500' />
                    )}
                  </button>
                </div>
              </div>
              <div className='flex flex-col gap-3'>
                <Button
                  type='submit'
                  className='w-full cursor-pointer'
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
                {password && <PswStrength password={password} />}
              </div>
            </div>
            <div className='mt-4 text-center text-sm'>
              Remember your password?{' '}
              <Link to='/login' className='underline underline-offset-4'>
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
