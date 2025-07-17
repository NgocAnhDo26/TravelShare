import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AvatarImage } from '@radix-ui/react-avatar';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Calendar, Heart, LogOut, Settings, User } from 'lucide-react';

const GlobalNavigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className='sticky top-0 z-50 flex items-center gap-4 border-b-1 px-24 py-2 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <Link to='/' className='text-md font-normal text-gray-800 mr-4'>
        <img src='/logo_title.png' alt='Logo' className='h-12' />
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link to='/' className={navigationMenuTriggerStyle()}>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to='/explore' className={navigationMenuTriggerStyle()}>
              Explore
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className='ml-auto flex items-center gap-2'>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='cursor-pointer flex items-center gap-2'>
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
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none mt-1'>
                    Hi, {user.username}!
                  </p>
                  <p className='text-xs leading-none text-muted-foreground'></p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  navigate('/profile');
                }}
              >
                <User className='mr-2 h-4 w-4' />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className='mr-2 h-4 w-4' />
                <span>My Plans</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Heart className='mr-2 h-4 w-4' />
                <span>Favorites</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
