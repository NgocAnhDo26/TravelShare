import { Link, useNavigate } from 'react-router-dom';
import React from 'react'; // Ensure React is imported
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback } from './ui/avatar';
// No need for @radix-ui/react-avatar, use the one from './ui/avatar'
// import { AvatarImage } from '@radix-ui/react-avatar';
import { AvatarImage } from './ui/avatar'; // Use AvatarImage from './ui/avatar'

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
import { Calendar, Heart, LogOut, Settings, User, Menu, Home, Compass } from 'lucide-react'; // Added Menu, Home, Compass icons for mobile nav
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'; // Import Sheet components for mobile menu

const GlobalNavigation = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Function to generate initials from username
    const getInitials = (username: string) => {
        if (!username) return '';
        const parts = username.split(' ');
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return username.charAt(0).toUpperCase();
    };

    return (
        <div className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            {/* Main container for the header content */}
            {/* Adjusted padding for mobile (px-4) and larger screens (sm:px-6 md:px-8) */}
            {/* Removed fixed px-24 which was likely causing overflow on mobile */}
            <div className='flex h-16 items-center justify-between px-4 sm:px-6 md:px-8 py-2'>

                {/* Logo - Always visible on all screen sizes */}
                <Link to='/' className='flex items-center space-x-2'> {/* Use flex for icon and text alignment */}
                    {/* Assuming logo_title.png is the image, ensure its path is correct */}
                    {/* If logo_title.png is just the text "TravelShare", consider using the text directly */}
                    <img
                        src='/logo_title.png' // Make sure this path is correct and the image exists
                        alt='TravelShare Logo'
                        className='h-10 sm:h-12' // Adjust height for mobile (h-10) and desktop (sm:h-12)
                        onError={(e) => {
                            // Fallback if image fails to load: display text logo
                            e.currentTarget.style.display = 'none'; // Hide the broken image icon
                            const textLogo = document.createElement('span');
                            textLogo.className = 'text-xl font-bold text-primary';
                            textLogo.textContent = 'TravelShare';
                            e.currentTarget.parentNode?.insertBefore(textLogo, e.currentTarget.nextSibling);
                        }}
                    />
                    {/* If your logo is just text, you can use this instead of img: */}
                    {/* <span className="text-xl font-bold text-primary">TravelShare</span> */}
                </Link>

                {/* Desktop Navigation Menu - Hidden on screens smaller than 'md' */}
                <NavigationMenu className="hidden md:flex ml-4"> {/* Added ml-4 for spacing from logo */}
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

                {/* Right-aligned section: User Profile / Login-Signup Buttons and Mobile Menu */}
                <div className='ml-auto flex items-center gap-2 sm:gap-4'> {/* Adjust gap for mobile */}
                    {user ? (
                        /* Logged-in user dropdown */
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className='cursor-pointer flex items-center gap-2'>
                                    <Avatar className="h-8 w-8"> {/* Smaller avatar on mobile */}
                                        <AvatarImage
                                            src={user.avatarUrl || `https://placehold.co/32x32/FF6347/FFFFFF?text=${getInitials(user.username)}`}
                                            alt={user.username}
                                            onError={(e) => {
                                                e.currentTarget.src = `https://placehold.co/32x32/FF6347/FFFFFF?text=${getInitials(user.username)}`;
                                            }}
                                        />
                                        <AvatarFallback>
                                            {getInitials(user.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className='text-sm font-medium text-gray-800 hidden sm:inline'> {/* Hide username on very small screens */}
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
                                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                                    <User className='mr-2 h-4 w-4' />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/my-plans')}>
                                    <Calendar className='mr-2 h-4 w-4' />
                                    <span>My Plans</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/favorites')}>
                                    <Heart className='mr-2 h-4 w-4' />
                                    <span>Favorites</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/settings')}>
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
                        /* Login/Signup buttons - Hide on very small screens, show on sm and up */
                        <div className="hidden sm:flex items-center gap-2">
                            <Link to='/login' className='text-md font-semibold text-gray-800'>
                                <Button variant='secondary'>Login</Button>
                            </Link>
                            <Link to='/register' className='text-md font-semibold text-gray-800'>
                                <Button>Sign up</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Hamburger Menu - Show only on screens smaller than 'md' */}
                    <div className="md:hidden flex items-center">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center space-x-2">
                                        {/* Logo inside mobile menu */}
                                        <img
                                            src='/logo_title.png'
                                            alt='TravelShare Logo'
                                            className='h-10'
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const textLogo = document.createElement('span');
                                                textLogo.className = 'text-xl font-bold text-primary';
                                                textLogo.textContent = 'TravelShare';
                                                e.currentTarget.parentNode?.insertBefore(textLogo, e.currentTarget.nextSibling);
                                            }}
                                        />
                                        {/* <span className="text-xl font-bold text-primary">TravelShare</span> */}
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 mt-8">
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/')}>
                                        <Home className="mr-2 h-4 w-4" /> Home
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/explore')}>
                                        <Compass className="mr-2 h-4 w-4" /> Explore
                                    </Button>
                                    {/* Conditional rendering for logged-in user menu items */}
                                    {user && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/profile')}>
                                                <User className="mr-2 h-4 w-4" /> Profile
                                            </Button>
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/my-plans')}>
                                                <Calendar className="mr-2 h-4 w-4" /> My Plans
                                            </Button>
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/favorites')}>
                                                <Heart className="mr-2 h-4 w-4" /> Favorites
                                            </Button>
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/settings')}>
                                                <Settings className="mr-2 h-4 w-4" /> Settings
                                            </Button>
                                            <Button variant="ghost" className="justify-start text-red-500 hover:text-red-600" onClick={logout}>
                                                <LogOut className="mr-2 h-4 w-4" /> Log out
                                            </Button>
                                        </>
                                    )}
                                    {/* Conditional rendering for guest user menu items */}
                                    {!user && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/login')}>
                                                Login
                                            </Button>
                                            <Button variant="ghost" className="justify-start" onClick={() => navigate('/register')}>
                                                Sign up
                                            </Button>
                                        </>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalNavigation;