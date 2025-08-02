import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  fullWidth?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search destinations, plans, users...',
  className = '',
  inputClassName = 'w-64',
  fullWidth = false,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isLoading,
    handleKeyPress,
    handleSuggestionClick,
  } = useSearchSuggestions();

  const finalInputClassName = fullWidth ? 'w-full' : inputClassName;
  const popoverWidth = fullWidth ? 'w-full' : 'w-64';

  return (
    <div className={`relative ${className}`}>
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 z-10' />
            <Input
              placeholder={placeholder}
              className={`pl-12 pr-12 py-3 h-12 ${finalInputClassName} bg-gray-50 border-2 border-gray-200 rounded-full 
                focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 
                hover:bg-gray-100 hover:border-gray-300
                transition-all duration-200 text-base
                focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {searchQuery && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors z-10 flex items-center justify-center cursor-pointer'
                type='button'
                tabIndex={-1}
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className={`${popoverWidth} p-0 border-2 border-gray-200 shadow-lg`}
          align='start'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className='p-2'>
            {isLoading ? (
              <div className='p-3 text-sm text-muted-foreground flex items-center gap-2'>
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                Loading...
              </div>
            ) : suggestions.length === 0 ? (
              <div className='p-3 text-sm text-muted-foreground'>
                No suggestions found.
              </div>
            ) : (
              <div className='space-y-1'>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className='p-3 hover:bg-gray-100 rounded-md cursor-pointer transition-colors'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        {suggestion.type === 'user' && (
                          <Avatar className='h-8 w-8 flex-shrink-0'>
                            <AvatarImage
                              src={suggestion.avatarUrl}
                              alt={suggestion.title}
                            />
                            <AvatarFallback className='text-xs'>
                              {suggestion.title.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className='flex flex-col flex-1 min-w-0'>
                          <span className='font-medium text-sm text-gray-900 truncate'>
                            {suggestion.title}
                          </span>
                          <span className='text-xs text-gray-500 truncate'>
                            {suggestion.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className='ml-2 flex-shrink-0'>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${
                              suggestion.type === 'plan'
                                ? 'bg-blue-100 text-blue-800'
                                : suggestion.type === 'user'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {suggestion.type === 'plan'
                            ? 'Plan'
                            : suggestion.type === 'user'
                              ? 'User'
                              : 'Post'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
