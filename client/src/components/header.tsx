// Vibe code using Copilot, reviewed and improved by Do Hai.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  User,
  Search,
  Settings,
  LogOut,
  Heart,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import API from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import type {
  SearchSuggestionsResponse,
  SearchSuggestion,
} from '@/types/search';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleLogout() {
    API.post('/auth/logout')
      .then(() => {
        toast.success('Logged out successfully!');
        navigate('/');
      })
      .catch((error) => {
        console.error('Logout failed:', error);
        toast.error('Failed to log out. Please try again.');
      });
  }

  // Handle search input changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(searchQuery.trim());
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchSearchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await API.get<SearchSuggestionsResponse>(
        `/search/suggestions?q=${encodeURIComponent(query)}&limit=5`,
      );

      if (response.data.success) {
        const allSuggestions = [
          ...response.data.data.plans,
          ...response.data.data.users,
        ];
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    handleSearch(suggestion.title);
  };

  // Mock user data - replace with actual user state/context
  const user = {
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    avatar: '/api/placeholder/32/32', // Replace with actual avatar URL
    initials: 'SJ', // initials for fallback avatar. TODO: create a function to generate initials from name
    // e.g., "Sarah Johnson" -> "SJ"
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center justify-between'>
        {/* Logo */}
        <div className='flex items-center space-x-2'>
          <MapPin className='h-6 w-6 text-primary' />
          <span className='text-xl font-bold'>TravelShare</span>
        </div>

        {/* Navigation */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href='/'
                className={navigationMenuTriggerStyle()}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href='/destinations'
                className={navigationMenuTriggerStyle()}
              >
                Travel Itinerary
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href='/experiences'
                className={navigationMenuTriggerStyle()}
              >
                Hotels
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href='/trips'
                className={navigationMenuTriggerStyle()}
              >
                Deals
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Search and Profile */}
        <div className='flex items-center space-x-4'>
          {/* Search with autocomplete */}
          <div className='relative'>
            <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
              <PopoverTrigger asChild>
                <div className='relative'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search destinations, plans, users...'
                    className='pl-8 w-64'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() =>
                      suggestions.length > 0 && setShowSuggestions(true)
                    }
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-0' align='start'>
                <div className='p-2'>
                  {isLoading ? (
                    <div className='p-2 text-sm text-muted-foreground'>
                      Loading...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className='p-2 text-sm text-muted-foreground'>
                      No suggestions found.
                    </div>
                  ) : (
                    <div className='space-y-1'>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className='p-2 hover:bg-accent rounded-sm cursor-pointer'
                        >
                          <div className='flex flex-col'>
                            <span className='font-medium text-sm'>
                              {suggestion.title}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {suggestion.subtitle}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {user.name}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground'>
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className='mr-2 h-4 w-4' />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className='mr-2 h-4 w-4' />
                <span>My Bookings</span>
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
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
