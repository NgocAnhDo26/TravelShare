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
import type { Destination } from '@/types/destination';
import { useLikeToggle } from '@/hooks/useLikeToggle';

function toDestination(raw: unknown): Destination | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.placeId === 'string' ? r.placeId : '',
    type: 'Geography',
    entityType: typeof r.entityType === 'string' ? r.entityType : '',
    address: {
      municipality: typeof r.municipality === 'string' ? r.municipality : '',
      countrySecondarySubdivision:
        typeof r.countrySecondarySubdivision === 'string'
          ? r.countrySecondarySubdivision
          : '',
      countrySubdivision:
        typeof r.countrySubdivision === 'string' ? r.countrySubdivision : '',
      countrySubdivisionName:
        typeof r.countrySubdivisionName === 'string'
          ? r.countrySubdivisionName
          : '',
      countrySubdivisionCode:
        typeof r.countrySubdivisionCode === 'string'
          ? r.countrySubdivisionCode
          : '',
      countryCode: typeof r.countryCode === 'string' ? r.countryCode : '',
      country: typeof r.country === 'string' ? r.country : '',
      countryCodeISO3:
        typeof r.countryCodeISO3 === 'string' ? r.countryCodeISO3 : '',
      freeformAddress: typeof r.address === 'string' ? r.address : '',
    },
    position: {
      lat:
        typeof r.coordinates === 'object' &&
        r.coordinates &&
        'lat' in r.coordinates
          ? ((r.coordinates as { lat?: number }).lat ?? 0)
          : 0,
      lon:
        typeof r.coordinates === 'object' &&
        r.coordinates &&
        'lng' in r.coordinates
          ? ((r.coordinates as { lng?: number }).lng ?? 0)
          : 0,
    },
    viewport: (r.viewport ?? undefined) as Destination['viewport'],
    boundingBox: (r.boundingBox ?? undefined) as Destination['boundingBox'],
    dataSources:
      r.dataSources &&
      typeof r.dataSources === 'object' &&
      !Array.isArray(r.dataSources)
        ? (r.dataSources as Record<string, unknown>)
        : undefined,
  };
}

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
    console.log('PlanEditorPage useEffect triggered:', {
      planId,
      user,
      editMode,
    });

    const fetchTripData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching plan data for planId:', planId);
        const { data } = await API.get(`/plans/${planId}`);
        console.log('Plan data received:', data);
        setPlanData(data);

        // Validate if user can edit this plan
        const canEdit = getActualEditMode(editMode, data, user);
        console.log('Can edit check:', {
          editMode,
          canEdit,
          user: user?.userId,
          planAuthor: data.author,
        });

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

  // This hook is now the single source of truth for the like state.
  const { isLiked, likesCount, handleToggleLike } = useLikeToggle({
    targetId: planData?._id ?? '',
    initialIsLiked: planData?.isLiked ?? false,
    initialLikesCount: planData?.likesCount ?? 0,
    apiPath: '/plans',
    onModel: 'TravelPlan',
  });

  const handleTripUpdate = (updatedTrip: Trip) => {
    setPlanData(updatedTrip);
  };

  // Handle item added to a specific day
  const handleItemAdded = (dayNumber: number, item: IPlanItem) => {
    if (!planData) return;
    const updatedSchedule = planData.schedule.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: [...day.items, item],
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule,
    });
  };

  // Handle item updated in a specific day
  const handleItemUpdated = (
    dayNumber: number,
    itemId: string,
    updatedItem: IPlanItem,
  ) => {
    if (!planData) return;
    if (updatedItem.startTime && updatedItem.endTime) {
      const startDate = new Date(updatedItem.startTime)
        .toISOString()
        .split('T')[1];
      const endDate = new Date(updatedItem.endTime).toISOString().split('T')[1];
      if (startDate > endDate) {
        toast.error('Start time cannot be after end time');
        return;
      }
    }

    const updatedSchedule = planData.schedule.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: day.items.map((item) =>
            item._id === itemId ? updatedItem : item,
          ),
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule,
    });
  };

  // Handle item deleted from a specific day
  const handleItemDeleted = (dayNumber: number, itemId: string) => {
    if (!planData) return;

    const updatedSchedule = planData.schedule.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          items: day.items.filter((item) => item._id !== itemId),
        };
      }
      return day;
    });

    setPlanData({
      ...planData,
      schedule: updatedSchedule,
    });
  };

  const currentUserForSocialSection = user ? {
    ...user,
    _id: user.userId,
  } : null;

  // Show loading state – skeleton placeholders
  if (isLoading) {
    return (
      <div className='flex flex-col h-full max-w-7xl mx-auto lg:mx-8 my-8'>
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

  if (!planData) {
    return (
      <div className='flex flex-col h-full justify-center max-w-7xl mx-auto lg:mx-8 my-8'>
        <div className='flex items-center justify-center'>
          <div className='text-lg text-red-600'>Plan not found</div>
        </div>
      </div>
    );
  }

  // Create the data object for TripHeader, now including the live like state
  const displayTripData = {
    ...planData,
    isLiked,
    likesCount,
  };

  return (
    <div className='flex flex-col justify-center max-w-7xl mx-auto lg:mx-8 my-8'>
      <Card className='w-full overflow-hidden pt-0'>
        <TripHeader
          trip={displayTripData}
          editMode={actualEditMode}
          onTripUpdate={handleTripUpdate}
          onToggleLike={handleToggleLike} // Pass the handler down
        />
        <ItinerarySection
          itinerary={planData?.schedule || []}
          editMode={actualEditMode}
          tripId={planData._id}
          onItemAdded={handleItemAdded}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
          itineraryDestination={toDestination(planData.destination)}
        />
      </Card>

      {!actualEditMode && planData && (
        <SocialSection
          targetId={planData._id}
          onModel='TravelPlan'
          initialCommentsCount={planData.commentsCount}
          currentUser={currentUserForSocialSection}
          // Pass the live state and handler down
          likesCount={likesCount}
          isLiked={isLiked}
          onToggleLike={handleToggleLike}
        />
      )}

      {/* Related Posts */}
      {!actualEditMode && (
        <Card className="mt-8">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-left mb-4">Related Posts</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-br p-2 rounded-lg">
              <div className="rounded-lg p-4 shadow-sm hover:shadow transition flex flex-col bg-transparent">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">Exploring Đà Lạt: Top 5 Cafés</span>
                  <span className="ml-2 text-xs text-gray-400">by Jane Doe</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>12 likes</span>
                  <span>3 comments</span>
                </div>
              </div>
              <div className="rounded-lg p-4 shadow-sm hover:shadow transition flex flex-col bg-transparent">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">Hiking Langbiang Mountain</span>
                  <span className="ml-2 text-xs text-gray-400">by John Smith</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>8 likes</span>
                  <span>1 comment</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlanEditorPage;