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

import { EllipsisVerticalIcon, Milestone, NotepadText, PencilIcon, Share, TrashIcon } from 'lucide-react';
import EditProfileForm from '@/components/edit-profile-form';
import FollowersFollowingDialog from '@/components/FollowersFollowingDialog';
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
    <Card className='flex flex-col items-center p-6 overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-300 text-left gap-0'>
      {/* Avatar Section */}
      <Avatar className='w-48 h-48 mb-4'>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className='text-3xl font-bold'>
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <h3 className='text-xl font-bold text-gray-800'>{displayName}</h3>
      <p className='text-gray-500 text-sm mb-4'>@{userName}</p>

      {/* Follow Stats */}
      <div className='flex space-x-6 mb-6'>
        <div 
          className={`text-center transition-opacity p-2 rounded-lg ${
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
          className={`text-center transition-opacity p-2 rounded-lg ${
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
        <div className='flex space-x-3 w-full'>
          <EditProfileForm
            user={{
              displayName: displayName,
              username: userName,
              avatarUrl: avatarUrl ?? '',
              email: email, 
            }}
          />
          <Button onClick={onShare} className='flex-1 cursor-pointer'>
            <Share />
            Share
          </Button>
        </div>
      ) : (
        <Button 
          className='cursor-pointer' 
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
    <Card className='p-6 text-left rounded-md overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 gap-0'>
      {' '}
      {/* Added text-left here */}
      {/* Top section: COUNTRIES, CITIES, & REGIONS stats */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex space-x-4 text-gray-700 text-sm font-semibold'>
          <Card className='gap-2 p-3 bg-blue-400 text-white w-40 rounded-md border-none'>
            <span className='block text-3xl font-bold mb-2'>
              {countriesVisited}
            </span>
            <span>COUNTRIES</span>
          </Card>
          <Card className='gap-2 p-3 bg-amber-400 text-white w-40 rounded-md border-none'>
            <span className='block text-3xl font-bold mb-2'>
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
      <h2 className='text-2xl font-bold my-4'>Travel Log</h2>
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
    <Card className='p-6 gap-2 rounded-md overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left'>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{planToDelete?.title}"? This action cannot be undone.ap-0
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button variant='destructive' onClick={handleDeletePlan} autoFocus>
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
              'whitespace-nowrap border-b-2 font-medium text-md transition-colors rounded-b-none',
              activeTab === 'tripPlans'
                ? 'border-blue-600 text-blue-700 hover:bg-none'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <Milestone /> Trip plans
          </Button>
          <Button
            variant={'ghost'}
            onClick={() => setActiveTab('guides')}
            className={cn(
              'whitespace-nowrap border-b-2 font-medium text-md transition-colors rounded-b-none',
              activeTab === 'guides'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <NotepadText /> Guides
          </Button>
        </nav>
      </div>
      {/* Tab Content */}
      <div>
        {activeTab === 'tripPlans' &&
          (plans.length === 0 ? (
            <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
              <p className='text-gray-600 text-lg mb-4'>
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
                  <div className="relative w-full h-20">
                    <img
                      src={plan.coverImageUrl}
                      alt={plan.title}
                      className='w-full h-20 object-cover'
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size='icon' variant='ghost' className="w-7 h-7">
                            <EllipsisVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => navigate(`/plans/${plan._id}/edit`)}
                          >
                            <PencilIcon />
                            Edit plan
                          </DropdownMenuItem>
                          {user && plan.author && user.userId === plan.author.toString() && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              onClick={() => {
                                setPlanToDelete(plan);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className="text-red-600" />
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
                    <h3 className='text-lg font-bold mb-1 text-left'>{plan.title}</h3>
                    <p className='text-gray-500 text-sm mb-2 text-left'>
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
          <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 text-lg mb-4'>
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
  tripPlans: string[];
  guides: string[];
  travelLog: string[];
  faqs: string[];
}

// --- Main User Profile Page Component ---
const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { userId } = useParams();
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
      if (!user && !userId) return;
      const URL = userId
        ? `/users/${userId}/profile`
        : `/users/${user?.userId}/profile`;

      try {
        // Replace with actual API call
        const response = await API.get(URL);
        const data = response.data;
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, [user, userId]);

  // Check if current user is following the profile user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !userId || user.userId === userId) return;
      
      try {
        const response = await API.get(`/users/${userId}/is-following`);
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
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

    if (!userId || user.userId === userId) return;

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
    console.log('Share Profile clicked!');
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
    return <div>Loading...</div>;
  }

  return (
    <div className='flex flex-col'>
      <main className='flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full'>
        {/* Left Column */}
        <div className='lg:col-span-1 space-y-6'>
          {' '}
          {/* Add space-y-6 for spacing between cards */}
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
        <div className='lg:col-span-2 space-y-6'>
          
          {/* Followers/Following Dialogs */}
          <FollowersFollowingDialog
            isOpen={followersDialogOpen}
            onClose={() => setFollowersDialogOpen(false)}
            type="followers"
            currentUserId={user?.userId || ''}
          />
          <FollowersFollowingDialog
            isOpen={followingDialogOpen}
            onClose={() => setFollowingDialogOpen(false)}
            type="following"
            currentUserId={user?.userId || ''}
          />
          <TravelLogCard
            // countriesVisited={userData.countriesVisited}
            // citiesVisited={userData.citiesVisited}
            // regionsVisited={userData.regionsVisited}
            // rank={userData.rank}
            // travelLog={userData.travelLog}
            countriesVisited={10}
            citiesVisited={20}
            regionsVisited={30}
            rank={'hehe'}
            travelLog={[
              {
                country: 'Việt Nam',
                cities: ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh'],
              },
            ]}
          />
          <TabsSection
            tripPlans={userData.tripPlans || []}
            guidesCount={0}
            isMyProfile={!userId}
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
