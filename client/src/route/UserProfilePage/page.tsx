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

import {
  EllipsisVerticalIcon,
  Milestone,
  NotepadText,
  PencilIcon,
  Share,
  TrashIcon,
  Lock,
  Globe,
} from 'lucide-react';
import EditProfileForm from '@/components/edit-profile-form';
import FollowersFollowingDialog from '@/components/FollowersFollowingDialog';
import { useParams, useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import type { Trip } from '@/types/trip';
import { Badge } from '@/components/ui/badge';

// Post interface for user profile posts
interface Post {
  _id: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  images?: string[];
  author: string;
  privacy: 'public' | 'private';
  likesCount: number;
  commentsCount: number;
  remixCount?: number;
  createdAt: string;
  updatedAt: string;
}

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

// --- TabsSection Component (can be a separate file like components/profile/TabsSection.tsx) ---
interface TabsSectionProps {
  tripPlans: Trip[];
  posts: Post[];
  guidesCount: number;
  isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

const TabsSection: React.FC<TabsSectionProps> = ({
  tripPlans = [],
  posts = [],
  isMyProfile = false,
  setPosts,
}) => {
  const [activeTab, setActiveTab] = useState('tripPlans');
  const [plans, setPlans] = useState(tripPlans);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Trip | null>(null);
  const [postDeleteDialogOpen, setPostDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('TabsSection posts:', posts);
  console.log('TabsSection posts type:', typeof posts);
  console.log('TabsSection posts isArray:', Array.isArray(posts));

  // Ensure posts is always an array
  const safePosts = Array.isArray(posts) ? posts : [];

  useEffect(() => {
    setPlans(tripPlans);
  }, [tripPlans]);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await API.delete(`/plans/${planToDelete._id}`);
      setPlans((prev) => prev.filter((p) => p._id !== planToDelete._id));
      toast.success('Plan deleted successfully');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'error' in err.response.data &&
        typeof err.response.data.error === 'string'
          ? err.response.data.error
          : 'Failed to delete plan';
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await API.delete(`/posts/${postToDelete._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== postToDelete._id));
      toast.success('Post deleted successfully');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'error' in err.response.data &&
        typeof err.response.data.error === 'string'
          ? err.response.data.error
          : 'Failed to delete post';
      toast.error(errorMessage);
    } finally {
      setPostDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  return (
    <Card className='p-6 gap-2 rounded-md overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left'>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{planToDelete?.title}"?
              This action cannot be undone.
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
      <Dialog open={postDeleteDialogOpen} onOpenChange={setPostDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the post "{postToDelete?.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button variant='destructive' onClick={handleDeletePost} autoFocus>
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
            <NotepadText /> Posts
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
                >
                  <div className='relative w-full h-20'>
                    <img
                      src={plan.coverImageUrl}
                      alt={plan.title}
                      className='w-full h-20 object-cover'
                      onClick={() => navigate(`/plans/${plan._id}`)}
                    />
                    {/* Privacy badge */}
                    <div className='absolute top-2 left-2 z-10'>
                      <Badge variant={plan.privacy === 'private' ? "secondary" : "default"} className='gap-1 text-xs'>
                        {plan.privacy === 'private' ? 
                          <><Lock className='h-3 w-3' /> Private</> : 
                          <><Globe className='h-3 w-3' /> Public</>
                        }
                      </Badge>
                    </div>
                    {user &&
                      plan.author &&
                      user.userId === plan.author.toString() && (
                        <div className='absolute top-2 right-2 z-10'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='w-7 h-7'
                              >
                                <EllipsisVerticalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/plans/${plan._id}/edit`)
                                }
                              >
                                <PencilIcon />
                                Edit plan
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className='text-red-600 focus:text-red-700'
                                onClick={() => {
                                  setPlanToDelete(plan);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <TrashIcon className='text-red-600' />
                                Delete plan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    <div
                      className='pointer-events-none absolute bottom-0 left-0 w-full h-1/2'
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                      }}
                    />
                  </div>
                  <div className='px-4 mt-0 pb-2 flex flex-col flex-1' onClick={() => navigate(`/plans/${plan._id}`)}>
                    <h3 
                      className='text-lg font-bold mb-1 text-left line-clamp-2'
                      title={plan.title}
                    >
                      {plan.title}
                    </h3>
                    <p className='text-gray-500 text-sm mb-2 text-left flex-1'>
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
                      <div className='flex items-center gap-2 text-xs text-gray-400'>
                        {(plan.likesCount > 0 || plan.commentsCount > 0 || plan.remixCount > 0) ? (
                          <>
                            {plan.likesCount > 0 && (
                              <span className='flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full flex-nowrap whitespace-nowrap'>
                                ❤️ {plan.likesCount}
                              </span>
                            )}
                            {plan.commentsCount > 0 && (
                              <span className='flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full flex-nowrap whitespace-nowrap'>
                                💬 {plan.commentsCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className='text-gray-300 text-xs'>No engagement yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        {activeTab === 'guides' && (
          (!safePosts || safePosts.length === 0) ? (
            <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
              <p className='text-gray-600 text-lg mb-4'>
                {isMyProfile
                  ? "You don't have any posts yet."
                  : "This user doesn't have any posts yet."}
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {safePosts.map((post) => (
                <Card
                  key={post._id}
                  className='relative p-0 overflow-hidden group gap-0 cursor-pointer hover:scale-105 transition-transform duration-250'
                >
                  <div className='relative w-full h-20'>
                    <img
                      src={post.coverImageUrl || 'https://placehold.co/400x200/CCCCCC/FFFFFF?text=No+Image'}
                      alt={post.title}
                      className='w-full h-20 object-cover'
                      onClick={() => navigate(`/posts/${post._id}`)}
                    />
                    {/* Privacy badge */}
                    <div className='absolute top-2 left-2 z-10'>
                      <Badge variant={post.privacy === 'private' ? "secondary" : "default"} className='gap-1 text-xs'>
                        {post.privacy === 'private' ? 
                          <><Lock className='h-3 w-3' /> Private</> : 
                          <><Globe className='h-3 w-3' /> Public</>
                        }
                      </Badge>
                    </div>
                    {user &&
                      post.author &&
                      user.userId === post.author.toString() && (
                        <div className='absolute top-2 right-2 z-10'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='w-7 h-7'
                              >
                                <EllipsisVerticalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/posts/${post._id}/edit`)
                                }
                              >
                                <PencilIcon />
                                Edit post
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className='text-red-600 focus:text-red-700'
                                onClick={() => {
                                  setPostToDelete(post);
                                  setPostDeleteDialogOpen(true);
                                }}
                              >
                                <TrashIcon className='text-red-600' />
                                Delete post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    <div
                      className='pointer-events-none absolute bottom-0 left-0 w-full h-1/2'
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                      }}
                    />
                  </div>
                  <div className='px-4 mt-0 pb-2 flex flex-col flex-1' onClick={() => navigate(`/posts/${post._id}`)}>
                    <h3 
                      className='text-lg font-bold mb-1 text-left line-clamp-2'
                      title={post.title}
                    >
                      {post.title}
                    </h3>
                    <p className='text-gray-500 text-sm mb-2 text-left flex-1 line-clamp-2'>
                      {post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No content'}
                    </p>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-gray-400'>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString()
                          : ''}
                      </span>
                      <div className='flex items-center gap-2 text-xs text-gray-400'>
                        {(post.likesCount > 0 || post.commentsCount > 0 || (post.remixCount && post.remixCount > 0)) ? (
                          <>
                            {post.likesCount > 0 && (
                              <span className='flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full'>
                                ❤️ {post.likesCount}
                              </span>
                            )}
                            {post.commentsCount > 0 && (
                              <span className='flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full'>
                                💬 {post.commentsCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className='text-gray-300 text-xs'>No engagement yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
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
  const [tripPlans, setTripPlans] = useState<Trip[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followersDialogOpen, setFollowersDialogOpen] =
    useState<boolean>(false);
  const [followingDialogOpen, setFollowingDialogOpen] =
    useState<boolean>(false);

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
    const fetchTripPlansByAuthor = async () => {
      if (!user && !userId) return;
      const URL = userId
        ? `/plans/author/${userId}`
        : `/plans/author/${user?.userId}`;
      try {
        // Replace with actual API call
        const response = await API.get(URL);
        const data = response.data;
        setTripPlans(data);
      } catch (error) {
        console.error('Error fetching trip plans:', error);
        toast.error('Failed to fetch trip plans');
      }
    };

    const fetchPostsByAuthor = async () => {
      if (!user && !userId) return;
      const URL = userId
        ? `/posts/author/${userId}`
        : `/posts/author/${user?.userId}`;
      try {
        const response = await API.get(URL);
        console.log('Posts API response:', response.data); // Debug log
        const data = response.data?.data || response.data || [];
        console.log('Posts data after extraction:', data); // Debug log
        console.log('Current user data:', user); // Debug log
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to fetch posts');
        setPosts([]); // Set empty array on error
      }
    };

    fetchUserData();
    fetchTripPlansByAuthor();
    fetchPostsByAuthor();
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
        setUserData((prev) =>
          prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev,
        );
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await API.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setUserData((prev) =>
          prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev,
        );
        toast.success('Followed successfully');
      }
    } catch (error: unknown) {
      console.error('Error toggling follow:', error);
      const errorMessage =
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'Failed to update follow status';
      toast.error(errorMessage);
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
            type='followers'
            currentUserId={user?.userId || ''}
          />
          <FollowersFollowingDialog
            isOpen={followingDialogOpen}
            onClose={() => setFollowingDialogOpen(false)}
            type='following'
            currentUserId={user?.userId || ''}
          />
          {/* <TravelLogCard
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
          /> */}
          <TabsSection
            tripPlans={tripPlans || []}
            posts={posts || []}
            guidesCount={0}
            isMyProfile={!userId}
            setPosts={setPosts}
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
