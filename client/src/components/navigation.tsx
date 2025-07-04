import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AvatarImage } from '@radix-ui/react-avatar';

const GlobalNavigation = () => {
  const { user, isLoading, logout } = useAuth();
  console.log('GlobalNavigation state:', { user, isLoading });

  return (
    <div className='flex items-center gap-4 border-b-1 px-24 py-2 shadow-sm'>
      <Link to='/' className='text-md font-normal text-gray-800 mr-4'>
        <img src='/logo_title.png' alt='Logo' className='h-12' />
      </Link>

      <Link to='/' className='text-md font-normal text-gray-800'>
        Home
      </Link>

      <Link to='/' className='text-md font-normal text-gray-800'>
        Discover
      </Link>

      <div className='ml-auto flex items-center gap-2'>
        {user ? (
          <>
            <Link
              to='/profile'
              className='flex items-center gap-2 text-md font-semibold text-gray-800'
            >
              <Avatar>
                <AvatarImage
                  src={user.avatarUrl || '/default-avatar.png'}
                  alt={user.username}
                />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className='text-md font-medium text-gray-800'>
                {user.username}
              </span>
            </Link>
            <Button variant='outline' onClick={logout} className='ml-4'>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to='/login' className='text-md font-semibold text-gray-800'>
              <Button variant='secondary'>Login</Button>
            </Link>
            <Link
              to='/register'
              className='text-md font-semibold text-gray-800'
            >
              <Button>Sign up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalNavigation;
