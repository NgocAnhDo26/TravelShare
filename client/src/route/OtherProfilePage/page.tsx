'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils'; // Giả định bạn có utility cn này
import { Button } from '@/components/ui/button'; // Giả định bạn có Shadcn Button
import { Link } from 'react-router-dom';

// --- Header Component (có thể là một file riêng như components/layout/Header.tsx) ---
// Giữ nguyên Header từ UserProfilePage vì nó là chung cho cả ứng dụng
const Header: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => {
  return (
    <header className='flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200'>
      {/* Left section: Logo and Main Nav */}
      <div className='flex items-center space-x-6'>
        <div className='text-xl font-bold text-blue-800'>TravelShare</div>{' '}
        {/* Thay thế bằng logo TravelShare */}
        <nav className='hidden md:flex space-x-4'>
          <Link
            to='/'
            className='text-gray-600 hover:text-blue-700 font-medium transition-colors'
          >
            Home
          </Link>
          <Link
            to='/travel-guides'
            className='text-gray-600 hover:text-blue-700 font-medium transition-colors'
          >
            Travel guides
          </Link>
          <Link
            to='/hotels'
            className='text-gray-600 hover:text-blue-700 font-medium transition-colors'
          >
            Hotels
          </Link>
          <Link
            to='/deals'
            className='text-gray-600 hover:text-blue-700 font-medium transition-colors'
          >
            Deals
          </Link>
        </nav>
      </div>

      {/* Right section: Search, Notifications, Profile */}
      <div className='flex items-center space-x-4'>
        <div className='relative hidden md:block'>
          <input
            type='text'
            placeholder='Enter place or user'
            className='pl-10 pr-4 py-2 rounded-full bg-gray-100 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 text-sm'
          />
          {/* Use Font Awesome icon if installed */}
          <i className='fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'></i>
        </div>
        {/* Bell icon (no red dot for this context, assuming dot is only for current user's unread notifs) */}
        <button className='relative p-2 text-gray-600 hover:text-blue-700'>
          <i className='fas fa-bell text-lg'></i>
        </button>
        {/* User's own profile picture in Header with red dot for notification */}
        <button className='p-2 relative'>
          <img
            src={avatarUrl}
            alt='User Avatar'
            className='w-8 h-8 rounded-full object-cover border-2 border-blue-400'
            onError={(e) =>
              (e.currentTarget.src =
                'https://placehold.co/32x32/cccccc/999999?text=A')
            } // Fallback if image fails to load
          />
          {/* Small red dot on user's own profile picture (simulating notification) */}
          <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white'></span>
        </button>
      </div>
    </header>
  );
};

// --- ProfileCardOther Component (phiên bản cho hồ sơ người khác) ---
interface ProfileCardOtherProps {
  userName: string;
  userHandle: string;
  followers: number;
  following: number;
  avatarUrl?: string; // Tùy chọn avatar
  isFollowing: boolean;
  onToggleFollow: () => void;
  userRank?: string; // Thêm rank như trong ảnh mẫu
}

const ProfileCardOther: React.FC<ProfileCardOtherProps> = ({
  userName,
  userHandle,
  followers,
  following,
  avatarUrl,
  isFollowing,
  onToggleFollow,
  userRank,
}) => {
  return (
    <div className='bg-white rounded-xl shadow-md p-6 flex flex-col items-center'>
      {/* Avatar Section */}
      <div className='relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border border-gray-200'>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt='Profile Avatar'
            className='w-full h-full object-cover'
          />
        ) : (
          <i className='fas fa-user text-5xl text-gray-400'></i>
        )}
      </div>

      {/* User Info */}
      <h3 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
        {userName}
        {userRank && (
          <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800'>
            {userRank}
          </span>
        )}
      </h3>
      <p className='text-gray-500 text-sm mb-4'>{userHandle}</p>

      {/* Follow Stats */}
      <div className='flex space-x-6 mb-6'>
        <div className='text-center'>
          <span className='block text-lg font-bold text-gray-800'>
            {followers}
          </span>
          <span className='text-gray-500 text-xs uppercase'>Followers</span>
        </div>
        <div className='text-center'>
          <span className='block text-lg font-bold text-gray-800'>
            {following}
          </span>
          <span className='text-gray-500 text-xs uppercase'>Following</span>
        </div>
      </div>

      {/* Action Button: Follow/Following */}
      <div className='w-full'>
        <Button
          onClick={onToggleFollow}
          className={cn(
            'w-full py-2.5 rounded-full font-semibold',
            isFollowing
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-orange-500 text-white hover:bg-orange-600',
          )}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    </div>
  );
};

// --- TravelLogCard Component (sử dụng lại, nhưng có prop ẩn nút) ---
interface TravelLogCardProps {
  countriesVisited: number;
  citiesVisited: number;
  regionsVisited: number;
  rank: string;
  travelLog: { country: string; cities: string[] }[];
  showAddButton?: boolean; // Thêm prop để kiểm soát việc hiển thị nút
}

const TravelLogCard: React.FC<TravelLogCardProps> = ({
  countriesVisited,
  citiesVisited,
  regionsVisited,
  rank,
  travelLog,
  showAddButton = false, // Mặc định là false cho OtherProfilePage
}) => {
  return (
    <div className='bg-white rounded-xl shadow-md p-6 flex flex-col text-left'>
      {/* Top section: COUNTRIES, CITIES, & REGIONS stats */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex space-x-4 text-gray-700 text-sm font-semibold'>
          <div>
            <span className='block text-xl font-bold'>{countriesVisited}</span>
            <span>COUNTRIES</span>
          </div>
          <div>
            <span className='block text-xl font-bold'>{citiesVisited}</span>
            <span>CITIES</span>
          </div>
          <div>
            <span className='block text-xl font-bold'>{regionsVisited}</span>
            <span>& REGIONS</span>
          </div>
        </div>
        {showAddButton && ( // Chỉ hiển thị nút nếu showAddButton là true
          <button className='bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors'>
            Add visited places
          </button>
        )}
      </div>

      {/* Rank display */}
      <div className='flex items-center mb-4 text-gray-700 text-sm'>
        <i className='fas fa-medal text-lg text-blue-500 mr-2'></i>
        <span className='font-semibold'>{rank}</span>
      </div>

      {/* Travel Log Section with Scrollbar */}
      <h2 className='text-xl font-bold text-gray-800 mb-4'>Nhật kí du lịch</h2>
      <div
        className='space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-4'
        style={{ height: '200px' }}
      >
        {travelLog.length > 0 ? (
          travelLog.map((entry, index) => (
            <div key={index}>
              <p className='text-gray-700 font-semibold'>- {entry.country}:</p>
              <ul className='list-disc list-inside ml-4 text-gray-600 text-sm'>
                {entry.cities.map((city, cityIndex) => (
                  <li key={cityIndex}>{city}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className='text-gray-500 py-4'>
            Chưa có chuyến đi nào được ghi lại.
          </p>
        )}
      </div>

      {/* Removed the "Thêm địa điểm đã ghé thăm" button as per request for OtherProfilePage */}
    </div>
  );
};

// --- TabsSection Component (giữ nguyên) ---
interface TabsSectionProps {
  tripPlansCount: number;
  guidesCount: number;
}

const TabsSection: React.FC<TabsSectionProps> = ({
  tripPlansCount,
  guidesCount,
}) => {
  const [activeTab, setActiveTab] = useState('tripPlans'); // 'tripPlans' or 'guides'

  return (
    <div className='bg-white rounded-xl shadow-md p-6'>
      <div className='border-b border-gray-200 mb-6'>
        <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
          <button
            onClick={() => setActiveTab('tripPlans')}
            className={cn(
              'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors',
              activeTab === 'tripPlans'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Kế hoạch đi du lịch ({tripPlansCount})
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={cn(
              'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors',
              activeTab === 'guides'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Hướng dẫn ({guidesCount})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tripPlans' && (
          <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 text-lg mb-4'>
              Bạn chưa có kế hoạch nào cả
            </p>
            <Button className='bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-full hover:bg-orange-600 transition-colors shadow-md'>
              Lên kế hoạch ngay
            </Button>
          </div>
        )}
        {activeTab === 'guides' && (
          <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 text-lg mb-4'>
              You don't have any guides yet.
            </p>
            <Button className='bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-full hover:bg-orange-600 transition-colors shadow-md'>
              Create your first guide
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Other User Profile Page Component ---
const OtherProfilePage: React.FC = () => {
  // Dữ liệu giả định cho hồ sơ người khác
  const otherUserData = {
    userName: 'Trâm Anh',
    userRank: 'PRO', // Thêm rank cho hồ sơ người khác
    userHandle: '@tramanh2phut',
    followers: 1140,
    following: 10,
    avatarUrl:
      'https://maunailxinh.com/wp-content/uploads/2025/05/hinh-anh-trai-dep-6-mui-viet-nam.jpg', // Ảnh đại diện của người khác
    countriesVisited: 20,
    citiesVisited: 50,
    regionsVisited: 10,
    rank: 'Experienced TravelShare', // Rank của người khác
    tripPlansCount: 5, // Người này có kế hoạch du lịch
    guidesCount: 2, // Người này có hướng dẫn
    // THÊM travelLog VÀO ĐÂY VÌ NÓ BỊ THIẾU TRONG KIỂU DỮ LIỆU
    travelLog: [
      { country: 'Thái Lan', cities: ['Yanhee Pride Center', 'Bangkok'] },
      { country: 'Việt Nam', cities: ['Biển Lâm Đồng', 'Thị trấn Đà Lạt'] },
      { country: 'Nhật Bản', cities: ['Tokyo', 'Kyoto'] },
      { country: 'Hàn Quốc', cities: ['Seoul', 'Busan', 'Đảo Jeju'] },
    ],
  };

  const [isFollowing, setIsFollowing] = useState(false); // State để quản lý trạng thái follow

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    // TODO: Gửi yêu cầu follow/unfollow đến backend ở đây
    console.log(isFollowing ? 'Unfollowing user...' : 'Following user...');
  };

  // Avatar của người dùng hiện tại (cho Header)
  const currentUserAvatar =
    'https://maunailxinh.com/wp-content/uploads/2025/05/hinh-anh-trai-dep-6-mui-viet-nam.jpg'; // Ảnh đại diện của bạn

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col'>
      {/* Header sử dụng avatar của người dùng hiện tại */}
      <Header avatarUrl={currentUserAvatar} />
      <main className='flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full'>
        {/* Left Column (Profile Card Other) */}
        <div className='lg:col-span-1 space-y-6'>
          <ProfileCardOther
            userName={otherUserData.userName}
            userHandle={otherUserData.userHandle}
            followers={otherUserData.followers}
            following={otherUserData.following}
            avatarUrl={otherUserData.avatarUrl}
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
            userRank={otherUserData.userRank} // Truyền rank vào ProfileCardOther
          />
          {/* Không có FAQSection ở đây */}
        </div>

        {/* Right Column (Travel Log and Tabs Section) */}
        <div className='lg:col-span-2 space-y-6'>
          <TravelLogCard
            countriesVisited={otherUserData.countriesVisited}
            citiesVisited={otherUserData.citiesVisited}
            regionsVisited={otherUserData.regionsVisited}
            rank={otherUserData.rank}
            travelLog={otherUserData.travelLog} // Truyền travelLog vào đây
            showAddButton={false} // Rõ ràng không hiển thị nút "Thêm địa điểm"
          />
          <TabsSection
            tripPlansCount={otherUserData.tripPlansCount}
            guidesCount={otherUserData.guidesCount}
          />
        </div>
      </main>
    </div>
  );
};

export default OtherProfilePage;
