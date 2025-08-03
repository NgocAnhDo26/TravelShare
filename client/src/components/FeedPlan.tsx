import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  MessageCircle,
  Heart,
  Share2,
  MapPin,
  Bookmark,
  Zap,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import type { IPlan } from '@/types/trip';
import timeAgo from '@/utils/time';
import { useLikeToggle } from '@/hooks/useLikeToggle';

interface FeedPlanProps {
  plan: IPlan;
}

const FeedPlan: React.FC<FeedPlanProps> = ({ plan }) => {
  const navigate = useNavigate();

  if (!plan?.author) {
    return null; // Don't render if plan or author is missing
  }

  const handleViewPlan = () => navigate(`/plans/${plan._id}`);
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${plan.author._id}`);
  };

  const fallbackChar = (plan.author.displayName || plan.author.username || 'A')
    .charAt(0)
    .toUpperCase();

  const { isLiked, likesCount, pop, handleToggleLike } = useLikeToggle({
    targetId: plan._id,
    initialIsLiked: !!plan.isLiked,
    initialLikesCount: plan.likesCount,
    onModel: 'TravelPlan',
    apiPath: '/plans',
  });

  return (
    <Card
      className='overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left gap-0 pb-1'
      onClick={handleViewPlan}
    >
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <Avatar
            onClick={handleViewProfile}
            className='cursor-pointer w-12 h-12 ring-2 ring-blue-500/20'
          >
            <AvatarImage
              src={plan.author.avatarUrl}
              alt={plan.author.displayName || plan.author.username}
            />
            <AvatarFallback className='bg-gradient-to-br from-teal-500 to-blue-600 text-white font-semibold'>
              {fallbackChar}
            </AvatarFallback>
          </Avatar>
          <div onClick={handleViewProfile} className='flex-1 cursor-pointer'>
            <h3 className='font-semibold text-slate-800'>
              {plan.author.displayName || plan.author.username}
            </h3>
            <p className='text-sm text-slate-500'>@{plan.author.username}</p>
          </div>
          {plan.source_type === 'trending' ? (
            <Badge
              variant='secondary'
              className='bg-purple-100 text-purple-700 flex items-center gap-1'
            >
              <Zap className='w-3 h-3' /> Trending
            </Badge>
          ) : (
            <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
              {timeAgo(plan.createdAt)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='px-6 pb-4'>
        <div className='mb-4'>
          <h4 className='text-xl font-bold text-slate-800 mb-2'>
            {plan.title}
          </h4>
          <p className='text-slate-600 flex items-center gap-2'>
            <MapPin className='w-4 h-4 text-teal-500' />
            Destination: {plan.destination.name}
          </p>
        </div>
        <div className='relative rounded-2xl overflow-hidden group'>
          <img
            src={plan.coverImageUrl}
            alt={plan.title}
            width={600}
            height={400}
            className='w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <div className='absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <p className='font-semibold'>{plan.title}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col gap-4 px-6 py-4 bg-slate-50/50'>
        <Separator />
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-6'>
            <button
              type='button'
              onClick={handleToggleLike}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                group flex items-center gap-2 px-2 py-1 rounded-full
                transition bg-transparent hover:bg-gray-100 active:bg-gray-200
                focus:outline-none cursor-pointer active:scale-95
              `}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              tabIndex={0}
            >
              <Heart
                size={22}
                className={`
                  transition-all duration-200
                  ${
                    isLiked
                      ? 'text-red-500 fill-red-500 group-hover:scale-125 group-hover:fill-red-500 group-hover:text-red-500'
                      : 'text-gray-400 fill-transparent group-hover:scale-125 group-hover:text-red-500 group-hover:fill-red-200'
                  }
                  ${pop ? 'scale-150' : ''}
                `}
                style={{
                  filter: isLiked ? 'drop-shadow(0 0 4px #f87171)' : undefined,
                  transition:
                    'transform 0.05s, color 0.05s, fill 0.05s, filter 0.05s',
                }}
              />
              <span className='font-medium'>{likesCount}</span>
            </button>
            <button className='flex items-center gap-2 text-slate-600 hover:text-blue-500 transition-colors duration-200 group cursor-pointer'>
              <MessageCircle className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
              <span className='text-sm font-medium'>{plan.commentsCount}</span>
            </button>
            <button className='flex items-center gap-2 text-slate-600 hover:text-green-500 transition-colors duration-200 group cursor-pointer'>
              <Share2 className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
              <span className='text-sm font-medium'>Share</span>
            </button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className='text-slate-600 hover:text-yellow-500 transition-colors duration-200 cursor-pointer'>
                  <Bookmark className='w-5 h-5 hover:scale-110 transition-transform duration-200' />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save it</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FeedPlan;
