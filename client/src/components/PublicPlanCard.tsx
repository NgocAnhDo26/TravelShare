
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Plan {
  _id: string;
  title: string;
  coverImageUrl?: string;
  destination?: {
    name: string;
  };
  author?: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

interface PublicPlanCardProps {
  plan: Plan;
}

const PublicPlanCard: React.FC<PublicPlanCardProps> = ({ plan }) => {
  const navigate = useNavigate();

  const handleViewPlan = () => {
    navigate(`/plans/${plan._id}`);
  };

 
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (plan.author) {
      navigate(`/profile/${plan.author._id}`);
    }
  };

  if (!plan) return null;

  return (
    <Card
      key={plan._id}
      className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleViewPlan}
    >
      <CardHeader>
        {plan.author ? (
          <div className="flex items-center gap-3">
            <Avatar onClick={handleViewProfile} className="w-10 h-10">
              <AvatarImage src={plan.author.avatarUrl} alt={plan.author.displayName} />
              <AvatarFallback>{plan.author.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div onClick={handleViewProfile}>
              <p className="font-semibold text-gray-800">{plan.author.displayName}</p>
              <p className="text-xs text-gray-500">@{plan.author.username}</p>
            </div>
          </div>
        ) : (
          <p className="font-semibold">Unknown User</p>
        )}
      </CardHeader>
      <CardContent>
        {plan.coverImageUrl && (
          <img
            src={plan.coverImageUrl}
            alt={plan.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <h3 className="font-bold text-lg mb-1">{plan.title}</h3>
        {plan.destination?.name && (
          <p className="text-sm text-gray-600">
            Destination: {plan.destination.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicPlanCard;