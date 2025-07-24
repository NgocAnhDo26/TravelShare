import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect, useState } from 'react';
import type { Trip, IPlanItem } from '@/types/trip';
import ItinerarySection from '@/components/ItinerarySection';
import TripHeader from '@/components/TripHeader';
import SocialSection from '@/components/SocialSection';
import { useParams, useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { getActualEditMode } from '@/utils/planPermissions';

const PlanEditorPage: React.FC<{ editMode?: boolean }> = ({
  editMode = false,
}) => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planData, setPlanData] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actualEditMode, setActualEditMode] = useState(editMode);

  useEffect(() => {
    console.log('PlanEditorPage useEffect triggered:', { planId, user, editMode });

    const fetchTripData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching plan data for planId:', planId);
        const { data } = await API.get(`/plans/${planId}`);
        console.log('Plan data received:', data);
        setPlanData(data);

        // Validate if user can edit this plan
        const canEdit = getActualEditMode(editMode, data, user);
        console.log('Can edit check:', { editMode, canEdit, user: user?.userId, planAuthor: data.author });

        if (editMode && !canEdit) {
          toast.error('You can only edit your own plans');
          setActualEditMode(false);
          // Redirect to view-only mode
          navigate(`/plans/${planId}`, { replace: true });
        } else {
          setActualEditMode(canEdit);
        }

      } catch (error) {
        console.error('Error fetching plan:', error);
        toast.error('Failed to load plan');
        navigate('/itinerary');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data if we have a planId, regardless of user state
    // The user can be null (not logged in) and we should still show public plans
    if (planId) {
      fetchTripData();
    }
  }, [planId, user, editMode, navigate]);

  const handleTripUpdate = (updatedTrip: Trip) => {
    setPlanData(updatedTrip);
  };

  // Handle item added to a specific day
  const handleItemAdded = (dayNumber: number, item: IPlanItem) => {
    if (!planData) return;
    const updatedSchedule = planData.schedule.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: [...day.items, item]
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule
    });
  };

  // Handle item updated in a specific day
  const handleItemUpdated = (dayNumber: number, itemId: string, updatedItem: IPlanItem) => {
    if (!planData) return;
    if (updatedItem.startTime && updatedItem.endTime) {
      const startDate = new Date(updatedItem.startTime).toISOString().split('T')[1];
      const endDate = new Date(updatedItem.endTime).toISOString().split('T')[1];
      if (startDate > endDate) {
        toast.error('Start time cannot be after end time');
        return;
      }
    }

    const updatedSchedule = planData.schedule.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: day.items.map(item =>
            item._id === itemId ? updatedItem : item
          )
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule
    });
  };

  // Handle item deleted from a specific day
  const handleItemDeleted = (dayNumber: number, itemId: string) => {
    if (!planData) return;

    const updatedSchedule = planData.schedule.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: day.items.filter(item => item._id !== itemId)
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule
    });
  };

  // Debug logging
  console.log('PlanEditorPage render state:', {
    isLoading,
    planData: !!planData,
    planId,
    user: !!user,
    actualEditMode
  });

  // Show loading state – skeleton placeholders
  if (isLoading) {
    return (
      <div className='flex flex-col h-full lg:mx-60 mx-24 my-10'>
        <Card className='w-full overflow-hidden pt-0'>
          {/* Cover image skeleton */}
          <Skeleton className='w-full h-72' />

          {/* Header skeleton (title, meta) */}
          <div className='p-6 space-y-4'>
            <Skeleton className='h-8 w-2/3' />
            <Skeleton className='h-4 w-1/3' />
          </div>

          {/* Itinerary skeleton */}
          <div className='p-6 space-y-6'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className='h-20 w-full' />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Show error state if no plan data
  if (!planData) {
    return (
      <div className='flex flex-col h-full justify-center lg:mx-60 mx-24 my-10'>
        <div className='flex items-center justify-center'>
          <div className='text-lg text-red-600'>Plan not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full justify-center lg:mx-60 mx-24 my-10'>
      <Card className='w-full overflow-hidden pt-0'>
        <TripHeader trip={planData} editMode={actualEditMode} onTripUpdate={handleTripUpdate} />
        <ItinerarySection
          itinerary={planData?.schedule || []}
          editMode={actualEditMode}
          tripId={planData._id}
          onItemAdded={handleItemAdded}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
        />
      </Card>

      {!actualEditMode && planData && (
        <SocialSection
          targetId={planData._id}
          onModel="TravelPlan"
          initialLikesCount={planData.likesCount}
          initialCommentsCount={planData.commentsCount}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default PlanEditorPage;
