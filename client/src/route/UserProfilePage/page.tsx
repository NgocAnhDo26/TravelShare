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
import { Card } from '@/components/ui/card'; // Ensure this Card component is the responsive one you've updated earlier
import { useAuth } from '@/context/AuthContext';

// --- Helper to get initials ---
const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

// --- ProfileCard Component ---
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
        // Adjusted padding for Card, and ensured it's flex-col by default
        <Card className='flex flex-col items-center gap-2 p-4 sm:p-6'>
            {/* Avatar Section - Adjusted size for mobile */}
            <Avatar className='w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-2 sm:mb-4'>
                <AvatarImage
                    src={avatarUrl}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://placehold.co/${target.width}x${target.height}/cccccc/ffffff?text=${getInitials(displayName || userName)}`;
                    }}
                />
                <AvatarFallback className='text-xl sm:text-2xl md:text-3xl font-bold'>
                    {getInitials(displayName || userName)}
                </AvatarFallback>
            </Avatar>

            {/* User Info - Adjusted font sizes for mobile */}
            <h3 className='text-lg sm:text-xl font-bold text-gray-800 text-center'>{displayName}</h3>
            <p className='text-gray-500 text-xs sm:text-sm mb-2 sm:mb-4 text-center'>@{userName}</p>

            {/* Follow Stats - Adjusted spacing and made clickable areas larger */}
            <div className='flex space-x-4 sm:space-x-6 mb-4 sm:mb-6 w-full justify-center'>
                <div
                    className={`text-center transition-opacity p-2 rounded-lg cursor-pointer hover:opacity-80 hover:bg-gray-50`}
                    onClick={onFollowersClick} // Always allow click for dialog
                >
                    <span className='block text-lg sm:text-xl font-bold text-gray-800'>
                        {followers}
                    </span>
                    <span className='text-gray-500 text-xs uppercase'>Followers</span>
                </div>
                <div
                    className={`text-center transition-opacity p-2 rounded-lg cursor-pointer hover:opacity-80 hover:bg-gray-50`}
                    onClick={onFollowingClick} // Always allow click for dialog
                >
                    <span className='block text-lg sm:text-xl font-bold text-gray-800'>
                        {following}
                    </span>
                    <span className='text-gray-500 text-xs uppercase'>Following</span>
                </div>
            </div>

            {/* Action Buttons - Made full width on mobile, stack if needed */}
            {isMyProfile ? (
                <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full px-2'> {/* Added px-2 for padding */}
                    {/* EditProfileForm is a trigger for a dialog, so it's a button */}
                    <EditProfileForm
                        user={{
                            displayName: displayName,
                            username: userName,
                            avatarUrl: avatarUrl ?? '',
                            email: email,
                        }}
                    />
                    <Button onClick={onShare} className='w-full sm:flex-1 cursor-pointer'> {/* Full width on mobile */}
                        <Share className="mr-2 h-4 w-4" /> {/* Added icon and margin */}
                        Share
                    </Button>
                </div>
            ) : (
                <Button
                    className='w-full cursor-pointer' // Full width on mobile
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

// --- TravelLogCard Component ---
interface TravelLogCardProps {
    countriesVisited: number;
    citiesVisited: number;
    regionsVisited: number;
    rank: string; // Not used in current render, but kept for interface
    travelLog: { country: string; cities: string[] }[];
}

const TravelLogCard: React.FC<TravelLogCardProps> = ({
    countriesVisited,
    citiesVisited,
    regionsVisited,
    // rank, // Not used
    travelLog,
}) => {
    return (
        // Adjusted padding for Card, and ensured text-left
        <Card className='p-4 sm:p-6 text-left gap-2'>
            {/* Top section: COUNTRIES, CITIES, & REGIONS stats - Made responsive */}
            <div className='flex flex-col sm:flex-row items-center justify-between mb-4 gap-4'> {/* Changed to flex-col on mobile, gap-4 */}
                <Card className='gap-2 p-3 bg-blue-400 text-white w-full sm:w-40 rounded-md border-none text-center'> {/* Full width on mobile, text-center */}
                    <span className='block text-2xl sm:text-3xl font-bold mb-1 sm:mb-2'> {/* Adjusted font size */}
                        {countriesVisited}
                    </span>
                    <span className='text-sm uppercase'>COUNTRIES</span> {/* Adjusted font size */}
                </Card>
                <Card className='gap-2 p-3 bg-amber-400 text-white w-full sm:w-40 rounded-md border-none text-center'> {/* Full width on mobile, text-center */}
                    <span className='block text-2xl sm:text-3xl font-bold mb-1 sm:mb-2'> {/* Adjusted font size */}
                        {citiesVisited + regionsVisited}
                    </span>
                    <span className='text-sm uppercase'>CITIES & REGIONS</span> {/* Adjusted font size */}
                </Card>
            </div>
            {/* Travel Log Section with Scrollbar */}
            <h2 className='text-xl sm:text-2xl font-bold my-4'>Travel Log</h2> {/* Adjusted font size */}
            <div className='overflow-y-auto custom-scrollbar pr-4 max-h-52'>
                {travelLog.length > 0 ? (
                    travelLog.map((entry, index) => (
                        <div key={index} className="mb-2"> {/* Added mb-2 for spacing between entries */}
                            <p className='text-gray-700 font-semibold text-sm sm:text-base'> {/* Adjusted font size */}
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
                    <p className='text-gray-500 py-4 text-sm sm:text-base'> {/* Adjusted font size */}
                        Chưa có chuyến đi nào được ghi lại.
                    </p>
                )}
            </div>
        </Card>
    );
};

// --- TabsSection Component ---
interface TabsSectionProps {
    tripPlans: any[];
    guidesCount: number; // Not used in current render, but kept for interface
    isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
}

const TabsSection: React.FC<TabsSectionProps> = ({
    tripPlans = [],
    // guidesCount = 0, // Not used
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
        // Adjusted padding for Card
        <Card className='p-4 sm:p-6 gap-2'>
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
            <div className='border-b border-gray-200 mb-4 sm:mb-6'> {/* Adjusted mb for spacing */}
                <nav className='-mb-px flex space-x-2 justify-center' aria-label='Tabs'>
                    <Button
                        variant={'ghost'}
                        onClick={() => setActiveTab('tripPlans')}
                        className={cn(
                            'whitespace-nowrap border-b-2 font-medium text-sm sm:text-md transition-colors rounded-b-none px-2 sm:px-4', // Adjusted font size and padding
                            activeTab === 'tripPlans'
                                ? 'border-blue-600 text-blue-700 hover:bg-none'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        )}
                    >
                        <Milestone className="w-4 h-4 mr-1 sm:mr-2" /> Trip plans {/* Adjusted icon size and margin */}
                    </Button>
                    <Button
                        variant={'ghost'}
                        onClick={() => setActiveTab('guides')}
                        className={cn(
                            'whitespace-nowrap border-b-2 font-medium text-sm sm:text-md transition-colors rounded-b-none px-2 sm:px-4', // Adjusted font size and padding
                            activeTab === 'guides'
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        )}
                    >
                        <NotepadText className="w-4 h-4 mr-1 sm:mr-2" /> Guides {/* Adjusted icon size and margin */}
                    </Button>
                </nav>
            </div>
            {/* Tab Content */}
            <div>
                {activeTab === 'tripPlans' &&
                    (plans.length === 0 ? (
                        <div className='text-center py-6 sm:py-10 bg-gray-50 rounded-lg border border-gray-200'> {/* Adjusted padding */}
                            <p className='text-gray-600 text-base sm:text-lg mb-4'> {/* Adjusted font size */}
                                {isMyProfile
                                    ? "You don't have any trip plans yet."
                                    : "This user doesn't have any trip plans yet."}
                            </p>
                        </div>
                    ) : (
                        // Adjusted grid for mobile (1 column) and desktop (2-3 columns)
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {plans.map((plan) => (
                                <Card
                                    key={plan._id}
                                    className='relative p-0 overflow-hidden group gap-0 cursor-pointer hover:scale-105 transition-transform duration-250'
                                    onClick={() => navigate(`/plans/${plan._id}`)}
                                >
                                    <div className="relative w-full h-28 sm:h-32"> {/* Adjusted height for mobile */}
                                        <img
                                            src={plan.coverImageUrl}
                                            alt={plan.title}
                                            className='w-full h-full object-cover'
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = 'https://placehold.co/400x150/cccccc/ffffff?text=Plan+Image';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 z-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size='icon' variant='ghost' className="w-6 h-6 sm:w-7 sm:h-7"> {/* Adjusted size for mobile */}
                                                        <EllipsisVerticalIcon className="w-4 h-4" /> {/* Adjusted icon size */}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align='end'>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/plans/${plan._id}/edit`)}
                                                    >
                                                        <PencilIcon className="mr-2 h-4 w-4" />
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
                                                            <TrashIcon className="mr-2 h-4 w-4 text-red-600" />
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
                                    <div className='px-3 sm:px-4 mt-0 pb-2'> {/* Adjusted padding */}
                                        <h3 className='text-base sm:text-lg font-bold mb-1 text-left'>{plan.title}</h3> {/* Adjusted font size */}
                                        <p className='text-gray-500 text-xs sm:text-sm mb-2 text-left'> {/* Adjusted font size */}
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
                    <div className='text-center py-6 sm:py-10 bg-gray-50 rounded-lg border border-gray-200'> {/* Adjusted padding */}
                        <p className='text-gray-600 text-base sm:text-lg mb-4'> {/* Adjusted font size */}
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
    tripPlans: Trip[]; // Changed to array of Trip objects
    guides: string[];
    travelLog: { country: string; cities: string[] }[]; // Changed to match TravelLogCard
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
            if (!user && !userId) return;
            // Determine the URL based on whether a userId is provided in params
            const targetUserId = userId || user?.userId;
            if (!targetUserId) {
                console.error("No user ID available to fetch profile.");
                return;
            }

            const URL = `/users/${targetUserId}/profile`;

            try {
                // Replace with actual API call
                const response = await API.get(URL);
                const data = response.data;

                // Mocking data structure to match interfaces for demonstration
                setUserData({
                    _id: data._id || targetUserId,
                    username: data.username || 'mockuser',
                    email: data.email || 'mock@example.com',
                    displayName: data.displayName || data.username || 'Mock User',
                    avatarUrl: data.avatarUrl || 'https://placehold.co/100x100/cccccc/ffffff?text=U',
                    followerCount: data.followerCount || 0,
                    followingCount: data.followingCount || 0,
                    followers: data.followers || [],
                    following: data.following || [],
                    tripPlans: data.tripPlans || [], // Ensure this is an array of Trip objects
                    guides: data.guides || [],
                    travelLog: data.travelLog || [], // Ensure this matches the TravelLogCard interface
                    faqs: data.faqs || [],
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Failed to fetch user data');
                setUserData(undefined); // Set to undefined on error to show loading state again or error message
            }
        };

        fetchUserData();
    }, [user, userId]);

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
                setIsFollowing(false); // Assume not following on error
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
        // Implement share logic here, e.g., using navigator.share or copying URL
        if (navigator.share) {
            navigator.share({
                title: `${userData?.displayName || userData?.username}'s TravelShare Profile`,
                url: window.location.href,
            }).then(() => {
                toast.success('Profile shared successfully!');
            }).catch((error) => {
                console.error('Error sharing:', error);
                toast.error('Failed to share profile.');
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            // Copy URL to clipboard
            const profileUrl = window.location.href;
            const tempInput = document.createElement('input');
            tempInput.value = profileUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            toast.success('Profile URL copied to clipboard!');
        }
    };

    const isMyProfile = !userId || user?.userId === userId;

    const handleFollowersClick = () => {
        // Only allow viewing followers/following on own profile for now,
        // or if the profile is public and allows it.
        // For simplicity, we'll allow it if isMyProfile is true.
        // In a real app, you might check privacy settings.
        setFollowersDialogOpen(true);
    };

    const handleFollowingClick = () => {
        setFollowingDialogOpen(true);
    };

    // Ensure userData is defined before rendering components that depend on it
    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        // Main container for the UserProfilePage, adjusted padding for mobile
        <div className='flex flex-col min-h-screen bg-gray-50'> {/* Added bg-gray-50 for consistent background */}
            <main className='flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto w-full'>
                {/* Left Column - Stacks on mobile */}
                <div className='lg:col-span-1 space-y-4 sm:space-y-6'>
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

                {/* Right Column (Travel Log and Tabs Section) - Stacks on mobile */}
                <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
                    {/* Followers/Following Dialogs */}
                    <FollowersFollowingDialog
                        isOpen={followersDialogOpen}
                        onClose={() => setFollowersDialogOpen(false)}
                        type="followers"
                        currentUserId={user?.userId || ''}
                        profileUserId={userData._id} // Pass profile user ID
                        usersList={userData.followers} // Pass actual followers list
                    />
                    <FollowersFollowingDialog
                        isOpen={followingDialogOpen}
                        onClose={() => setFollowingDialogOpen(false)}
                        type="following"
                        currentUserId={user?.userId || ''}
                        profileUserId={userData._id} // Pass profile user ID
                        usersList={userData.following} // Pass actual following list
                    />
                    <TravelLogCard
                        countriesVisited={userData.travelLog.length} // Example: count countries in travel log
                        citiesVisited={userData.travelLog.reduce((acc, log) => acc + log.cities.length, 0)} // Example: count cities
                        regionsVisited={0} // Assuming regions are not explicitly tracked separately
                        rank={'Explorer'} // Placeholder rank
                        travelLog={userData.travelLog}
                    />
                    <TabsSection
                        tripPlans={userData.tripPlans || []}
                        guidesCount={0} // Assuming guides are not implemented yet
                        isMyProfile={isMyProfile}
                    />
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;