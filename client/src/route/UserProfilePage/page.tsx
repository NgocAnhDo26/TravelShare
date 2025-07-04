import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Assume you have this cn utility
import { Button } from '@/components/ui/button'; // Assume you have Shadcn Button

import { Milestone, NotepadText, Share } from 'lucide-react';
import EditProfileForm from '@/components/edit-profile-form';
import { useParams } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

// --- ProfileCard Component (can be a separate file like components/profile/ProfileCard.tsx) ---
interface ProfileCardProps {
  userName: string;
  displayName: string;
  followers: number;
  following: number;
  onShare: () => void;
  avatarUrl?: string; // Optional avatar
  isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userName,
  displayName,
  followers,
  following,
  onShare,
  avatarUrl,
  isMyProfile,
}) => {
  return (
    <Card className="flex flex-col items-center gap-0 p-6">
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

        {/* Action Buttons */}
        {isMyProfile ? (
          <div className='flex space-x-3 w-full'>
            <EditProfileForm
              user={{
                username: userName,
                avatarUrl: avatarUrl ?? '',
              }}
            />
            <Button onClick={onShare} className='flex-1 cursor-pointer'>
              <Share />
              Share
            </Button>
          </div>
        ) : (
          <Button className='cursor-pointer'>Follow</Button>
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
    <Card className='p-6 text-left gap-0'>
      {' '}
      {/* Added text-left here */}
      {/* Top section: COUNTRIES, CITIES, & REGIONS stats */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex space-x-4 text-gray-700 text-sm font-semibold'>
          <Card className="gap-2 p-3 bg-blue-400 text-white w-40 rounded-md border-none">
            <span className='block text-3xl font-bold mb-2'>{countriesVisited}</span>
            <span>COUNTRIES</span>
          </Card>
          <Card className="gap-2 p-3 bg-amber-400 text-white w-40 rounded-md border-none">
            <span className='block text-3xl font-bold mb-2'>{citiesVisited + regionsVisited}</span>
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
              <p className='text-gray-700 font-semibold'>{entry.country}: {" "}
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

// --- FAQSection Component (can be a separate file like components/profile/FAQSection.tsx) ---
// interface FAQSectionProps {
//   faqs: { question: string; link?: string }[]; // 'answer' changed to 'link' for hyperlink
// }

// const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
//   const [userQuestion, setUserQuestion] = useState(''); // State for the input field

//   const handleQuestionSubmit = () => {
//     if (userQuestion.trim()) {
//       console.log('Câu hỏi người dùng:', userQuestion);
//       // TODO: Gửi câu hỏi này đến backend hoặc xử lý tại đây
//       alert(`Câu hỏi của bạn đã được gửi: "${userQuestion}"`); // Sử dụng alert tạm thời
//       setUserQuestion(''); // Reset input
//     } else {
//       alert('Vui lòng nhập câu hỏi của bạn.');
//     }
//   };

//   return (
//     <div className='bg-white rounded-xl shadow-md p-6'>
//       <h2 className='text-xl font-bold text-gray-800 mb-4'>
//         Những câu hỏi thường gặp
//       </h2>
//       <div className='space-y-4 mb-6'>
//         {faqs.map((faq, index) => (
//           <div key={index}>
//             <a
//               href={faq.link || '#'} // Link to specified URL or '#' if no link
//               className='text-blue-600 hover:text-blue-800 underline block leading-relaxed' // Hyperlink styling
//               target={faq.link ? '_blank' : '_self'} // Open in new tab if there's a link
//               rel={faq.link ? 'noopener noreferrer' : ''}
//             >
//               - {faq.question}
//             </a>
//           </div>
//         ))}
//       </div>
//       {/* Input field for user questions */}
//       <div className='mt-4'>
//         <input
//           type='text'
//           placeholder='Bạn có câu hỏi nào dành cho cộng đồng chúng tôi không ?'
//           className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700'
//           value={userQuestion}
//           onChange={(e) => setUserQuestion(e.target.value)}
//           onKeyPress={(e) => {
//             if (e.key === 'Enter') {
//               handleQuestionSubmit();
//             }
//           }}
//         />
//         <Button
//           onClick={handleQuestionSubmit}
//           className='w-full mt-3 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md'
//         >
//           Gửi câu hỏi
//         </Button>
//       </div>
//     </div>
//   );
// };

// --- TabsSection Component (can be a separate file like components/profile/TabsSection.tsx) ---
interface TabsSectionProps {
  tripPlansCount: number;
  guidesCount: number;
  isMyProfile?: boolean; // Optional prop to check if this is the user's own profile
}

const TabsSection: React.FC<TabsSectionProps> = ({
  // tripPlansCount,
  // guidesCount,
  isMyProfile = false,
}) => {
  const [activeTab, setActiveTab] = useState('tripPlans'); // 'tripPlans' or 'guides'

  return (
    <Card className='p-6 gap-2'>
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
            <Milestone/> Trip plans
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
        {activeTab === 'tripPlans' && (
          <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 text-lg mb-4'>
              {isMyProfile ? 'You don\'t have any trip plans yet.' : 'This user doesn\'t have any trip plans yet.'}
            </p>
          </div>
        )}
        {activeTab === 'guides' && (
          <div className='text-center py-10 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 text-lg mb-4'>
              {isMyProfile ? 'You don\'t have any guides yet.' : 'This user doesn\'t have any guides yet.'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Define interface for user profile data
interface UserProfileData {
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
  let { userId } = useParams();
  const [userData, setUserData] = useState<UserProfileData | undefined>(
    undefined,
  );
  // Use userId prop to fetch user data from API
  // Call API to fetch user data based on userId
  useEffect(() => {
    // Simulate fetching user data from an API
    const fetchUserData = async () => {
      const URL = userId ? `/users/${userId}` : '/users/me';

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
  }, []);

  //   // Dữ liệu giả định cho trang profile
  //   const userData = {
  //     userName: 'Phát Nguyễn',
  //     userHandle: '@pht5',
  //     followers: 0,
  //     following: 0,
  //     avatarUrl:
  //       'https://topanh.com/wp-content/uploads/2025/05/hinh-gai-xinh-tiktok-2.jpg', // Updated avatar URL
  //     countriesVisited: 5, // Example data for TravelLogCard
  //     citiesVisited: 12, // Example data for TravelLogCard
  //     regionsVisited: 3, // Example data for TravelLogCard
  //     rank: 'Newbie TravelShare', // Rank data
  //     tripPlansCount: 0,
  //     guidesCount: 0,
  //     travelLog: [
  //       // Travel log data
  //       { country: 'Trung Quốc', cities: ['Thâm Quyến', 'Vạn Lý Trường Thành'] },
  //       { country: 'Việt Nam', cities: ['Biển Lâm Đồng', 'Thị trấn Đà Lạt'] },
  //       { country: 'Nhật Bản', cities: ['Tokyo', 'Kyoto'] },
  //       { country: 'Hàn Quốc', cities: ['Seoul', 'Busan', 'Đảo Jeju'] },
  //       { country: 'Thái Lan', cities: ['Bangkok', 'Chiang Mai'] },
  //     ],
  //     faqs: [
  //       // FAQ data with mock links
  //       {
  //         question:
  //           'Bạn thân tôi thường hay chơi với tôi nhưng nay tôi đi du lịch, thì tôi kiếm dịch vụ trông chó ở đâu cho uy tín ?',
  //         link: 'https://example.com/pet-sitting',
  //       },
  //       {
  //         question:
  //           'Tôi có vợ tôi ở nhà nhưng nay tôi đi du lịch cô ấy không muốn đi với tôi và khuyến khích tôi đi một mình để cô ấy trông nhà nhưng tôi hơi cô đơn, có nên ở nhà không ?',
  //         link: 'https://example.com/solo-travel-loneliness',
  //       },
  //       {
  //         question: 'Tôi không muốn đi du lịch thì phải làm sao ?',
  //         link: 'https://example.com/no-travel-motivation',
  //       },
  //     ],
  //   };

  const handleShareProfile = () => {
    console.log('Share Profile clicked!');
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
            followers={userData.followerCount}
            following={userData.followingCount}
            onShare={handleShareProfile}
            avatarUrl={userData.avatarUrl}
            isMyProfile={!userId} // Check if this is the user's own profile
          />
          {/* Add FAQSection below ProfileCard */}
          {/* <FAQSection faqs={userData.faqs} /> */}
        </div>

        {/* Right Column (Travel Log and Tabs Section) */}
        <div className='lg:col-span-2 space-y-6'>
          <TravelLogCard
            // countriesVisited={userData.countriesVisited}
            // citiesVisited={userData.citiesVisited}
            // regionsVisited={userData.regionsVisited}
            // rank={userData.rank}
            // travelLog={userData.travelLog}
            countriesVisited={10}
            citiesVisited={20}
            regionsVisited={30}
            rank={"hehe"}
            travelLog={[
              {
                country: 'Việt Nam',
                cities: ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh'],
              },
            ]}
          />
          <TabsSection
            // tripPlansCount={userData.tripPlansCount}
            // guidesCount={userData.guidesCount}
            tripPlansCount={0}
            guidesCount={0}
            isMyProfile={!userId} // Check if this is the user's own profile
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
