import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Assume you have this cn utility
import { Button } from '@/components/ui/button'; // Assume you have Shadcn Button
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

import { EllipsisVerticalIcon, EyeIcon, Milestone, NotepadText, PencilIcon, Share, TrashIcon } from 'lucide-react';
import EditProfileForm from '@/components/edit-profile-form'; // Assuming this component is responsive internally
import FollowersFollowingDialog from '@/components/FollowersFollowingDialog'; // Assuming this component is responsive internally
import { useParams, useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

// --- ProfileCard Component (can be a separate file like components/profile/ProfileCard.tsx) ---
interface ProfileCardProps {
  userName: string;
  displayName: string;
  followers: number;
  following: number;
  onShare: () => void;
  avatarUrl?: string; // Optional avatar
  isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
  email?: string;
  userId?: string; // User ID for follow/unfollow operations
  isFollowing?: boolean; // Whether the current user is following this user
  onFollowToggle?: () => void; // Callback for follow/unfollow
  isLoading?: boolean; // Loading state for follow/unfollow button
  onFollowersClick?: () => void; // Callback for followers click
  onFollowingClick?: () => void; // Callback for following click
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userName,
  displayName,
  followers,
  following,
  onShare,
  avatarUrl,
  isMyProfile = false,
  email,
  isFollowing,
  onFollowToggle,
  isLoading,
  onFollowersClick,
  onFollowingClick,
}) => {
  return (
    <Card className='flex flex-col items-center gap-0 p-4 sm:p-6'> {/* Adjusted padding for mobile */}
      {/* Avatar Section */}
      <Avatar className='w-32 h-32 sm:w-48 sm:h-48 mb-4'> {/* Responsive avatar size */}
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className='text-3xl font-bold'>
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <h3 className='text-lg sm:text-xl font-bold text-gray-800'>{displayName}</h3> {/* Responsive font size */}
      <p className='text-gray-500 text-sm mb-4'>@{userName}</p>

      {/* Follow Stats */}
      <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 mb-6 w-full'> {/* Stack on mobile, side-by-side on sm+ */}
        <div 
          className={`text-center transition-opacity p-2 rounded-lg w-full sm:w-auto ${ /* Full width on mobile */
            isMyProfile 
              ? 'cursor-pointer hover:opacity-80 hover:bg-gray-50' 
              : ''
          }`}
          onClick={isMyProfile ? onFollowersClick : undefined}
        >
          <span className='block text-lg font-bold text-gray-800'>
            {followers}
          </span>
          <span className='text-gray-500 text-xs uppercase'>Followers</span>
        </div>
        <div 
          className={`text-center transition-opacity p-2 rounded-lg w-full sm:w-auto ${ /* Full width on mobile */
            isMyProfile 
              ? 'cursor-pointer hover:opacity-80 hover:bg-gray-50' 
              : ''
          }`}
          onClick={isMyProfile ? onFollowingClick : undefined}
        >
          <span className='block text-lg font-bold text-gray-800'>
            {following}
          </span>
          <span className='text-gray-500 text-xs uppercase'>Following</span>
        </div>
      </div>

      {/* Action Buttons */}
      {isMyProfile ? (
        <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full px-4 sm:px-0'> {/* Stack on mobile, side-by-side on sm+, added horizontal padding for mobile */}
          <EditProfileForm
            user={{
              displayName: displayName,
              username: userName,
              avatarUrl: avatarUrl ?? '',
              email: email, 
            }}
            className="w-full" // Ensure EditProfileForm's button takes full width on mobile
          />
          <Button onClick={onShare} className='flex-1 cursor-pointer w-full'> {/* Full width on mobile */}
            <Share className="mr-2 h-4 w-4" /> {/* Adjusted icon size and margin */}
            Share
          </Button>
        </div>
      ) : (
        <Button 
          className='cursor-pointer w-full' /* Full width on mobile */
          onClick={onFollowToggle}
          disabled={isLoading}
          variant={isFollowing ? 'outline' : 'default'}
        >
          {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </Card>
  );
};

// --- TravelLogCard Component (replaces MapOverviewCard, can be components/profile/TravelLogCard.tsx) ---
interface TravelLogCardProps {
  countriesVisited: number;
  citiesVisited: number;
  regionsVisited: number;
  rank: string;
  travelLog: { country: string; cities: string[] }[];
}

const TravelLogCard: React.FC<TravelLogCardProps> = ({
  countriesVisited,
  citiesVisited,
  regionsVisited,
  // rank,
  travelLog,
}) => {
  return (
    <Card className='p-4 sm:p-6 text-left gap-0'> {/* Adjusted padding for mobile */}
      {/* Top section: COUNTRIES, CITIES, & REGIONS stats */}
      <div className='flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-4'> {/* Stack on mobile, side-by-side on sm+, added gap */}
        <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 text-gray-700 text-sm font-semibold w-full sm:w-auto'> {/* Stack inner cards on mobile */}
          <Card className='gap-2 p-3 bg-blue-400 text-white w-full sm:w-40 rounded-md border-none'> {/* Full width on mobile */}
            <span className='block text-2xl sm:text-3xl font-bold mb-2'> {/* Responsive font size */}
              {countriesVisited}
            </span>
            <span>COUNTRIES</span>
          </Card>
          <Card className='gap-2 p-3 bg-amber-400 text-white w-full sm:w-40 rounded-md border-none'> {/* Full width on mobile */}
            <span className='block text-2xl sm:text-3xl font-bold mb-2'> {/* Responsive font size */}
              {citiesVisited + regionsVisited}
            </span>
            <span>CITIES & REGIONS</span>
          </Card>
        </div>
      </div>
      {/* Rank display */}
      {/* <div className='flex items-center mb-4 text-gray-700 text-sm'>
        <i className='fas fa-medal text-lg text-blue-500 mr-2'></i>
        <span className='font-semibold'>{rank}</span>
      </div> */}
      {/* Travel Log Section with Scrollbar */}
      <h2 className='text-xl sm:text-2xl font-bold my-4'>Travel Log</h2> {/* Responsive font size */}
      <div className='overflow-y-auto custom-scrollbar pr-4 max-h-52'>
        {/* Fixed height for scroll area */}
        {travelLog.length > 0 ? (
          travelLog.map((entry, index) => (
            <div key={index}>
              {/* Ensured text alignment is left by default for block elements */}
              <p className='text-gray-700 font-semibold'>
                {entry.country}:{' '}
                {entry.cities.map((city, cityIndex) => (
                  <span key={cityIndex} className='font-normal'>
                    {city}
                    {cityIndex < entry.cities.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          ))
        ) : (
          // Corrected the comment placement outside of the JSX element
          <p className='text-gray-500 py-4'>
            Chưa có chuyến đi nào được ghi lại.
          </p>
        )}
      </div>
    </Card>
  );
};

// --- TabsSection Component (can be a separate file like components/profile/TabsSection.tsx) ---
interface TabsSectionProps {
  tripPlans: any[];
  guidesCount: number;
  isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
}

const TabsSection: React.FC<TabsSectionProps> = ({
  tripPlans = [],
  isMyProfile = false,
}) => {
  const [activeTab, setActiveTab] = useState('tripPlans');
  const [plans, setPlans] = useState(tripPlans);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPlans(tripPlans);
  }, [tripPlans]);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await API.delete(`/plans/${planToDelete._id}`);
      setPlans((prev) => prev.filter((p) => p._id !== planToDelete._id));
      toast.success('Plan deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete plan');
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  return (
    <Card className='p-4 sm:p-6 gap-2'> {/* Adjusted padding for mobile */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md"> {/* Ensure dialog is responsive */}
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{planToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0"> {/* Stack buttons on mobile */}
            <DialogClose asChild>
              <Button variant='outline' className="w-full sm:w-auto">Cancel</Button> {/* Full width on mobile */}
            </DialogClose>
            <Button variant='destructive' onClick={handleDeletePlan} autoFocus className="w-full sm:w-auto"> {/* Full width on mobile */}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className='border-b border-gray-200 mb-6'>
        <nav className='-mb-px flex space-x-2 justify-center' aria-label='Tabs'>
          <Button
            variant={'ghost'}
            onClick={() => setActiveTab('tripPlans')}
            className={cn(
              'whitespace-nowrap border-b-2 font-medium text-sm sm:text-md transition-colors rounded-b-none px-2 sm:px-4', // Responsive text size and padding
              activeTab === 'tripPlans'
                ? 'border-blue-600 text-blue-700 hover:bg-none'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <Milestone className="h-4 w-4 mr-1 sm:mr-2" /> Trip plans {/* Responsive icon size */}
          </Button>
          <Button
            variant={'ghost'}
            onClick={() => setActiveTab('guides')}
            className={cn(
              'whitespace-nowrap border-b-2 font-medium text-sm sm:text-md transition-colors rounded-b-none px-2 sm:px-4', // Responsive text size and padding
              activeTab === 'guides'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <NotepadText className="h-4 w-4 mr-1 sm:mr-2" /> Guides {/* Responsive icon size */}
          </Button>
        </nav>
      </div>
      {/* Tab Content */}
      <div>
        {activeTab === 'tripPlans' &&
          (plans.length === 0 ? (
            <div className='text-center py-6 sm:py-10 bg-gray-50 rounded-lg border border-gray-200 mx-2 sm:mx-0'> {/* Adjusted padding and horizontal margin for mobile */}
              <p className='text-gray-600 text-base sm:text-lg mb-4'> {/* Responsive font size */}
                {isMyProfile
                  ? "You don't have any trip plans yet."
                  : "This user doesn't have any trip plans yet."}
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {plans.map((plan) => (
                <Card
                  key={plan._id}
                  className='relative p-0 overflow-hidden group gap-0 cursor-pointer hover:scale-105 transition-transform duration-250'
                  onClick={() => navigate(`/plans/${plan._id}`)}
                >
                  <div className="relative w-full h-24 sm:h-20"> {/* Responsive image height */}
                    <img
                      src={plan.coverImageUrl}
                      alt={plan.title}
                      className='w-full h-full object-cover' // Use h-full to fill container
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size='icon' variant='ghost' className="w-7 h-7 bg-white/80 hover:bg-white"> {/* Added background for visibility */}
                            <EllipsisVerticalIcon className="w-5 h-5" /> {/* Adjusted icon size */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); navigate(`/plans/${plan._id}/edit`); }} // Stop propagation
                          >
                            <PencilIcon className="h-4 w-4 mr-2" /> {/* Adjusted icon size */}
                            Edit plan
                          </DropdownMenuItem>
                          {user && plan.author && user.userId === plan.author.toString() && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              onClick={(e) => { // Stop propagation
                                e.stopPropagation();
                                setPlanToDelete(plan);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className="h-4 w-4 mr-2 text-red-600" /> {/* Adjusted icon size */}
                              Delete plan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      className="pointer-events-none absolute bottom-0 left-0 w-full h-1/2"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                      }}
                    />
                  </div>
                  <div className='px-4 mt-0 pb-2'>
                    <h3 className='text-base sm:text-lg font-bold mb-1 text-left'>{plan.title}</h3> {/* Responsive font size */}
                    <p className='text-gray-500 text-xs sm:text-sm mb-2 text-left'> {/* Responsive font size */}
                      {plan.destination?.name}
                    </p>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-gray-400'>
                        {plan.startDate
                          ? new Date(plan.startDate).toLocaleDateString()
                          : ''}{' '}
                        -{' '}
                        {plan.endDate
                          ? new Date(plan.endDate).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        {activeTab === 'guides' && (
          <div className='text-center py-6 sm:py-10 bg-gray-50 rounded-lg border border-gray-200 mx-2 sm:mx-0'> {/* Adjusted padding and horizontal margin for mobile */}
            <p className='text-gray-600 text-base sm:text-lg mb-4'> {/* Responsive font size */}
              {isMyProfile
                ? "You don't have any guides yet."
                : "This user doesn't have any guides yet."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Define interface for user profile data
interface UserProfileData {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  followers: string[];
  following: string[];
  tripPlans: any[]; // Changed to any[] as per usage in TabsSection
  guides: string[];
  travelLog: { country: string; cities: string[] }[]; // Changed to match TravelLogCard prop
  faqs: string[];
}

// --- Main User Profile Page Component ---
const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  let { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserProfileData | undefined>(
    undefined,
  );
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followersDialogOpen, setFollowersDialogOpen] = useState<boolean>(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState<boolean>(false);

  // Use userId prop to fetch user data from API
  // Call API to fetch user data based on userId
  useEffect(() => {
    // Simulate fetching user data from an API
    const fetchUserData = async () => {
      // If no specific userId is provided in params, assume it's the current logged-in user's profile
      const targetUserId = userId || user?.userId;

      if (!targetUserId) {
        // If no user is logged in and no userId in params, handle accordingly (e.g., redirect to login or show error)
        console.warn("No user ID available to fetch profile.");
        // Optionally navigate to login or a public home page
        // navigate('/login'); 
        return;
      }

      const URL = `/users/${targetUserId}/profile`;

      try {
        // Replace with actual API call
        const response = await API.get(URL);
        const data = response.data;
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
        // Handle case where user data cannot be fetched (e.g., user not found)
        navigate('/404'); // Example: navigate to a 404 page
      }
    };

    fetchUserData();
  }, [user, userId, navigate]); // Added navigate to dependency array

  // Check if current user is following the profile user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !userId || user.userId === userId) {
        setIsFollowing(false); // Can't follow self
        return;
      }
      
      try {
        const response = await API.get(`/users/${userId}/is-following`);
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
        // If API fails, default to not following
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [user, userId]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user) {
      // Navigate to login page if user is not authenticated
      navigate('/login');
      return;
    }

    if (!userId || user.userId === userId) return; // Prevent following self

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await API.delete(`/users/${userId}/unfollow`);
        setIsFollowing(false);
        setUserData(prev => prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await API.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setUserData(prev => prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev);
        toast.success('Followed successfully');
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProfile = () => {
    // Implement actual share logic here
    const profileUrl = window.location.href; // Get current profile URL
    if (navigator.share) {
      navigator.share({
        title: `${userData?.displayName || userData?.username}'s Profile`,
        url: profileUrl,
      }).then(() => {
        toast.success('Profile shared successfully!');
      }).catch((error) => {
        console.error('Error sharing:', error);
        toast.error('Failed to share profile.');
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          toast.success('Profile link copied to clipboard!');
        })
        .catch((error) => {
          console.error('Failed to copy link:', error);
          toast.error('Failed to copy profile link.');
        });
    }
  };

  const isMyProfile = !userId || user?.userId === userId;

  const handleFollowersClick = () => {
    // Only allow viewing followers/following on own profile
    if (!isMyProfile) return;
    setFollowersDialogOpen(true);
  };

  const handleFollowingClick = () => {
    // Only allow viewing followers/following on own profile
    if (!isMyProfile) return;
    setFollowingDialogOpen(true);
  };

  // Ensure userData is defined before rendering components that depend on it
  if (!userData) {
    return (
        <div className='flex flex-col items-center justify-center min-h-screen p-4'>
            <div className='text-lg text-gray-600'>Loading profile...</div>
            {/* You can add a skeleton loader here if needed */}
        </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'> {/* Ensure min-h-screen for full height */}
      <main className='flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto w-full'> {/* Adjusted padding and gap */}
        {/* Left Column */}
        <div className='lg:col-span-1 space-y-4 sm:space-y-6'> {/* Adjusted space-y for mobile */}
          <ProfileCard
            userName={userData.username}
            displayName={userData.displayName ?? userData.username}
            email={userData.email}
            followers={userData.followerCount}
            following={userData.followingCount}
            onShare={handleShareProfile}
            avatarUrl={userData.avatarUrl}
            isMyProfile={isMyProfile}
            userId={userData._id}
            isFollowing={isFollowing}
            onFollowToggle={handleFollowToggle}
            isLoading={isLoading}
            onFollowersClick={handleFollowersClick}
            onFollowingClick={handleFollowingClick}
          />
          {/* Add FAQSection below ProfileCard */}
          {/* <FAQSection faqs={userData.faqs} /> */}
        </div>

        {/* Right Column (Travel Log and Tabs Section) */}
        <div className='lg:col-span-2 space-y-4 sm:space-y-6'> {/* Adjusted space-y for mobile */}
          
          {/* Followers/Following Dialogs */}
          <FollowersFollowingDialog
            isOpen={followersDialogOpen}
            onClose={() => setFollowersDialogOpen(false)}
            type="followers"
            currentUserId={user?.userId || ''}
            // profileUserId={userData._id} // Pass the profile user ID
          />
          <FollowersFollowingDialog
            isOpen={followingDialogOpen}
            onClose={() => setFollowingDialogOpen(false)}
            type="following"
            currentUserId={user?.userId || ''}
            // profileUserId={userData._id} // Pass the profile user ID
          />
          <TravelLogCard
            countriesVisited={userData.travelLog?.length || 0} // Use actual data
            citiesVisited={userData.travelLog?.reduce((acc, log) => acc + log.cities.length, 0) || 0} // Use actual data
            regionsVisited={0} // Assuming regionsVisited is not directly in travelLog, set to 0 or derive if possible
            rank={'N/A'} // Placeholder if no rank data
            travelLog={userData.travelLog || []} // Use actual data
          />
          <TabsSection
            tripPlans={userData.tripPlans || []}
            guidesCount={userData.guides?.length || 0} // Use actual data
            isMyProfile={isMyProfile}
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;