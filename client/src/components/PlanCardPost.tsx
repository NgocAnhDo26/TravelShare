import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageCircle, Heart, Share2 } from 'lucide-react';
import API from '../utils/axiosInstance';

interface Plan {
  _id: string;
  title: string;
  destination: { name: string };
  coverImageUrl?: string;
  author: {
    _id: string;
    username: string;
    displayName?: string; 
    avatarUrl?: string;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

interface FeedPostProps {
  plan: Plan;
}

const FeedPost: React.FC<FeedPostProps> = ({ plan }) => {
  const navigate = useNavigate();

  // Local state for optimistic UI and animation
  const [isLiked, setIsLiked] = useState(!!plan.isLiked);
  const [likesCount, setLikesCount] = useState(plan.likesCount);
  const [pop, setPop] = useState(false);

  if (!plan?.author) {
    return null;
  }
  
  const handleViewPlan = () => navigate(`/plans/${plan._id}`);
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${plan.author._id}`);
  };

  const fallbackChar = (plan.author.displayName || plan.author.username || 'A')
                        .charAt(0)
                        .toUpperCase();

  // Toggle like handler (optimistic UI + pop animation)
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Play pop animation
    setPop(true);

    setIsLiked(prevLiked => {
      setLikesCount(prevCount => prevLiked ? prevCount - 1 : prevCount + 1);
      return !prevLiked;
    });

    try {
      await API.post(`/plans/${plan._id}/like`);
    } catch (err) {
      // Revert both states if error
      setIsLiked(prevLiked => {
        setLikesCount(prevCount => prevLiked ? prevCount - 1 : prevCount + 1);
        return !prevLiked;
      });
    } finally {
      // Remove pop after animation duration
      setTimeout(() => setPop(false), 200);
    }
  };

  return (
    <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewPlan}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar onClick={handleViewProfile} className="cursor-pointer">
            <AvatarImage src={plan.author.avatarUrl} alt={plan.author.displayName || plan.author.username} />
            <AvatarFallback>{fallbackChar}</AvatarFallback>
          </Avatar>
          <div onClick={handleViewProfile} className="cursor-pointer">
            <p className="font-semibold text-gray-800">{plan.author.displayName || plan.author.username}</p>
            <p className="text-xs text-gray-500">@{plan.author.username}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-bold text-lg mb-2">{plan.title}</h3>
        <p className="text-sm text-gray-600 mb-4">Destination: {plan.destination.name}</p>
        {plan.coverImageUrl && <img src={plan.coverImageUrl} alt={plan.title} className="w-full h-64 object-cover rounded-lg mb-4" />}
        <div className="flex items-center gap-6 text-gray-600">
          <button
            type="button"
            onClick={handleToggleLike}
            onMouseDown={e => e.stopPropagation()}
            className={`
              group flex items-center gap-2 px-2 py-1 rounded-full
              transition bg-transparent hover:bg-red-50 active:bg-red-100
              focus:outline-none
              cursor-pointer active:scale-95
            `}
            aria-label={isLiked ? "Unlike" : "Like"}
            tabIndex={0}
          >
            <Heart
              size={22}
              className={`
                transition-all duration-200
                ${isLiked
                  ? 'text-red-500 fill-red-500 group-hover:scale-125 group-hover:fill-red-500 group-hover:text-red-500'
                  : 'text-gray-400 fill-transparent group-hover:scale-125 group-hover:text-red-500 group-hover:fill-red-200'
                }
                ${pop ? 'scale-150' : ''}
              `}
              style={{
                filter: isLiked ? 'drop-shadow(0 0 4px #f87171)' : undefined,
                transition: 'transform 0.05s, color 0.05s, fill 0.05s, filter 0.05s'
              }}
            />
            <span className="font-medium">{likesCount}</span>
          </button>
          <div className="flex items-center gap-2"><MessageCircle size={18} /><span>{plan.commentsCount || 0}</span></div>
          <div className="flex items-center gap-2"><Share2 size={18} /><span>Share</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedPost;