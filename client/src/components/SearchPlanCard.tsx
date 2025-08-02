import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Heart, MessageCircle, Calendar } from 'lucide-react';
import type { SearchTravelPlan } from '@/types/search';

interface SearchPlanCardProps {
  plan: SearchTravelPlan;
  onClick?: () => void;
}

const SearchPlanCard: React.FC<SearchPlanCardProps> = ({ plan, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow'
      onClick={onClick}
    >
      <div className='relative'>
        <img
          src={
            plan.coverImageUrl ||
            'https://placehold.co/400x200/CCCCCC/FFFFFF?text=TravelShare'
          }
          alt={plan.title}
          className='w-full h-48 object-cover rounded-t-lg'
        />
        <Badge className='absolute top-2 right-2 bg-white/90 text-black'>
          Travel Plan
        </Badge>
      </div>

      <CardHeader className='pb-2'>
        <CardTitle className='text-lg line-clamp-2'>{plan.title}</CardTitle>
        <div className='flex items-center text-sm text-muted-foreground'>
          <MapPin className='h-4 w-4 mr-1' />
          {plan.destination.name}
        </div>
      </CardHeader>

      <CardContent>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            {plan.author ? (
              <>
                <Avatar className='h-6 w-6'>
                  <AvatarImage
                    src={plan.author.avatarUrl}
                    alt={plan.author.displayName || plan.author.username}
                  />
                  <AvatarFallback>
                    {(plan.author.displayName || plan.author.username)
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className='text-sm text-muted-foreground'>
                  {plan.author.displayName || plan.author.username}
                </span>
              </>
            ) : (
              <div className='flex items-center space-x-2'>
                <Avatar className='h-6 w-6'>
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <span className='text-sm text-muted-foreground italic'>
                  Unknown author
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-3 text-sm text-muted-foreground'>
            <div className='flex items-center'>
              <Heart className='h-4 w-4 mr-1' />
              {plan.likesCount}
            </div>
            <div className='flex items-center'>
              <MessageCircle className='h-4 w-4 mr-1' />
              {plan.commentsCount}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center'>
            <Calendar className='h-3 w-3 mr-1' />
            Created {formatDate(plan.createdAt)}
          </div>
          <div>
            {plan.destination.country && (
              <Badge variant='outline' className='text-xs'>
                {plan.destination.country}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchPlanCard;
