import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageCircle, Heart, Share2 } from 'lucide-react';

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
}

interface FeedPostProps {
  plan: Plan;
}

const FeedPost: React.FC<FeedPostProps> = ({ plan }) => {
  const navigate = useNavigate();


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
          <div className="flex items-center gap-2"><Heart size={18} /><span>{plan.likesCount || 0}</span></div>
          <div className="flex items-center gap-2"><MessageCircle size={18} /><span>{plan.commentsCount || 0}</span></div>
          <div className="flex items-center gap-2"><Share2 size={18} /><span>Share</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedPost;