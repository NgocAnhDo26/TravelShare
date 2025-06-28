import React, { useState } from "react";
import { cn } from "@/lib/utils"; // Assume you have this cn utility
import { Button } from "@/components/ui/button"; // Assume you have Shadcn Button
import EditProfileForm from "@/components/edit-profile-form";
//import { useNavigate } from 'react-router-dom';

// --- Header Component (can be a separate file like components/layout/Header.tsx) ---
const Header: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
      {/* Left section: Logo and Main Nav */}
      <div className="flex items-center space-x-6">
        <div className="text-xl font-bold text-blue-800">TravelShare</div>{" "}
        {/* Replace with TravelShare logo */}
        <nav className="hidden md:flex space-x-4">
          <a
            href="/"
            className="text-gray-600 hover:text-blue-700 font-medium transition-colors"
          >
            Home
          </a>
          <a
            href="/travel-guides"
            className="text-gray-600 hover:text-blue-700 font-medium transition-colors"
          >
            Travel guides
          </a>
          <a
            href="/hotels"
            className="text-gray-600 hover:text-blue-700 font-medium transition-colors"
          >
            Hotels
          </a>
          <a
            href="/deals"
            className="text-gray-600 hover:text-blue-700 font-medium transition-colors"
          >
            Deals
          </a>
        </nav>
      </div>

      {/* Right section: Search, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Enter place or user"
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 text-sm"
          />
          {/* Use Font Awesome icon if installed */}
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <button className="relative p-2 text-gray-600 hover:text-blue-700"></button>
        <button className="p-2 relative">
          {" "}
          {/* Add relative for positioning dot */}
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-blue-400"
            onError={(e) =>
              (e.currentTarget.src =
                "https://placehold.co/32x32/cccccc/999999?text=A")
            } // Fallback if image fails to load
          />
          {/* Small red dot on user's profile picture */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

// --- ProfileCard Component (can be a separate file like components/profile/ProfileCard.tsx) ---
interface ProfileCardProps {
  userName: string;
  userHandle: string;
  followers: number;
  following: number;
  onEdit: () => void;
  onShare: () => void;
  avatarUrl?: string; // Optional avatar
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userName,
  userHandle,
  followers,
  following,
  onEdit,
  onShare,
  avatarUrl,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
      {/* Avatar Section */}
      <div className="relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border border-gray-200">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <i className="fas fa-user text-5xl text-gray-400"></i>
        )}
        {/* Text for adding profile picture if no avatarUrl */}
        {!avatarUrl && (
          <span className="absolute bottom-2 text-xs text-gray-500">
            Add profile picture
          </span>
        )}
      </div>

      {/* User Info */}
      <h3 className="text-xl font-bold text-gray-800">{userName}</h3>
      <p className="text-gray-500 text-sm mb-4">{userHandle}</p>

      {/* Follow Stats */}
      <div className="flex space-x-6 mb-6">
        <div className="text-center">
          <span className="block text-lg font-bold text-gray-800">
            {followers}
          </span>
          <span className="text-gray-500 text-xs uppercase">Followers</span>
        </div>
        <div className="text-center">
          <span className="block text-lg font-bold text-gray-800">
            {following}
          </span>
          <span className="text-gray-500 text-xs uppercase">Following</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 w-full">
        <Button
          onClick={onEdit}
          className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-full py-2 font-semibold"
        >
          Edit
        </Button>
        <Button
          onClick={onShare}
          className="flex-1 bg-gray-800 text-white hover:bg-gray-700 rounded-full py-2 font-semibold"
        >
          Share
        </Button>
      </div>
    </div>
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
  rank,
  travelLog,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col text-left">
      {" "}
      {/* Added text-left here */}
      {/* Top section: COUNTRIES, CITIES, & REGIONS stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4 text-gray-700 text-sm font-semibold">
          <div>
            <span className="block text-xl font-bold">{countriesVisited}</span>
            <span>COUNTRIES</span>
          </div>
          <div>
            <span className="block text-xl font-bold">{citiesVisited}</span>
            <span>CITIES</span>
          </div>
          <div>
            <span className="block text-xl font-bold">{regionsVisited}</span>
            <span>& REGIONS</span>
          </div>
        </div>
      </div>
      {/* Rank display */}
      <div className="flex items-center mb-4 text-gray-700 text-sm">
        <i className="fas fa-medal text-lg text-blue-500 mr-2"></i>
        <span className="font-semibold">{rank}</span>
      </div>
      {/* Travel Log Section with Scrollbar */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Nhật kí du lịch</h2>
      <div
        className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-4"
        style={{ height: "200px" }}
      >
        {" "}
        {/* Fixed height for scroll area */}
        {travelLog.length > 0 ? (
          travelLog.map((entry, index) => (
            <div key={index}>
              {/* Ensured text alignment is left by default for block elements */}
              <p className="text-gray-700 font-semibold">- {entry.country}:</p>
              <ul className="list-disc list-inside ml-4 text-gray-600 text-sm">
                {entry.cities.map((city, cityIndex) => (
                  <li key={cityIndex}>{city}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          // Corrected the comment placement outside of the JSX element
          <p className="text-gray-500 py-4">
            Chưa có chuyến đi nào được ghi lại.
          </p>
        )}
      </div>
      {/* "Thêm địa điểm" button */}
      <div className="flex justify-end mt-4">
        <Button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
          Thêm địa điểm đã ghé thăm
        </Button>
      </div>
    </div>
  );
};

// --- FAQSection Component (can be a separate file like components/profile/FAQSection.tsx) ---
interface FAQSectionProps {
  faqs: { question: string; link?: string }[]; // 'answer' changed to 'link' for hyperlink
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const [userQuestion, setUserQuestion] = useState(""); // State for the input field

  const handleQuestionSubmit = () => {
    if (userQuestion.trim()) {
      console.log("Câu hỏi người dùng:", userQuestion);
      // TODO: Gửi câu hỏi này đến backend hoặc xử lý tại đây
      alert('Câu hỏi của bạn đã được gửi: "${userQuestion}"'); // Sử dụng alert tạm thời
      setUserQuestion(""); // Reset input
    } else {
      alert("Vui lòng nhập câu hỏi của bạn.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Những câu hỏi thường gặp
      </h2>
      <div className="space-y-4 mb-6">
        {faqs.map((faq, index) => (
          <div key={index}>
            <a
              href={faq.link || "#"} // Link to specified URL or '#' if no link
              className="text-blue-600 hover:text-blue-800 underline block leading-relaxed" // Hyperlink styling
              target={faq.link ? "_blank" : "_self"} // Open in new tab if there's a link
              rel={faq.link ? "noopener noreferrer" : ""}
            >
              - {faq.question}
            </a>
          </div>
        ))}
      </div>
      {/* Input field for user questions */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Bạn có câu hỏi nào dành cho cộng đồng chúng tôi không ?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleQuestionSubmit();
            }
          }}
        />
        <Button
          onClick={handleQuestionSubmit}
          className="w-full mt-3 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Gửi câu hỏi
        </Button>
      </div>
    </div>
  );
};

// --- TabsSection Component (can be a separate file like components/profile/TabsSection.tsx) ---
interface TabsSectionProps {
  tripPlansCount: number;
  guidesCount: number;
}

const TabsSection: React.FC<TabsSectionProps> = ({
  tripPlansCount,
  guidesCount,
}) => {
  const [activeTab, setActiveTab] = useState("tripPlans"); // 'tripPlans' or 'guides'

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("tripPlans")}
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "tripPlans"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Kế hoạch đi du lịch ({tripPlansCount})
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === "guides"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Hướng dẫn ({guidesCount})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tripPlans" && (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">
              Bạn chưa có kế hoạch nào cả
            </p>
            <Button className="bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-full hover:bg-orange-600 transition-colors shadow-md">
              Lên kế hoạch ngay
            </Button>
          </div>
        )}
        {activeTab === "guides" && (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">
              You don't have any guides yet.
            </p>
            <Button className="bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-full hover:bg-orange-600 transition-colors shadow-md">
              Create your first guide
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main User Profile Page Component ---
const UserProfilePage: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userData = {
    userName: "Phát Nguyễn",
    userHandle: "@pht5",
    followers: 0,
    following: 0,
    avatarUrl:
      "https://topanh.com/wp-content/uploads/2025/05/hinh-gai-xinh-tiktok-2.jpg",
    countriesVisited: 5,
    citiesVisited: 12,
    regionsVisited: 3,
    rank: "Newbie TravelShare",
    tripPlansCount: 0,
    guidesCount: 0,
    travelLog: [
      { country: "Trung Quốc", cities: ["Thâm Quyến", "Vạn Lý Trường Thành"] },
      { country: "Việt Nam", cities: ["Biển Lâm Đồng", "Thị trấn Đà Lạt"] },
      { country: "Nhật Bản", cities: ["Tokyo", "Kyoto"] },
      { country: "Hàn Quốc", cities: ["Seoul", "Busan", "Đảo Jeju"] },
      { country: "Thái Lan", cities: ["Bangkok", "Chiang Mai"] },
    ],
    faqs: [
      {
        question:
          "Bạn thân tôi thường hay chơi với tôi nhưng nay tôi đi du lịch, thì tôi kiếm dịch vụ trông chó ở đâu cho uy tín ?",
        link: "https://example.com/pet-sitting",
      },
      {
        question:
          "Tôi có vợ tôi ở nhà nhưng nay tôi đi du lịch cô ấy không muốn đi với tôi và khuyến khích tôi đi một mình để cô ấy trông nhà nhưng tôi hơi cô đơn, có nên ở nhà không ?",
        link: "https://example.com/solo-travel-loneliness",
      },
      {
        question: "Tôi không muốn đi du lịch thì phải làm sao ?",
        link: "https://example.com/no-travel-motivation",
      },
    ],
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleShareProfile = () => {
    console.log("Share Profile clicked!");
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <Header avatarUrl={userData.avatarUrl} />
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-1 space-y-6">
          <ProfileCard
            userName={userData.userName}
            userHandle={userData.userHandle}
            followers={userData.followers}
            following={userData.following}
            onEdit={handleEditProfile}
            onShare={handleShareProfile}
            avatarUrl={userData.avatarUrl}
          />
          <FAQSection faqs={userData.faqs} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <TravelLogCard
            countriesVisited={userData.countriesVisited}
            citiesVisited={userData.citiesVisited}
            regionsVisited={userData.regionsVisited}
            rank={userData.rank}
            travelLog={userData.travelLog}
          />
          <TabsSection
            tripPlansCount={userData.tripPlansCount}
            guidesCount={userData.guidesCount}
          />
        </div>
      </main>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Chỉnh sửa hồ sơ
            </h2>
            <EditProfileForm
              user={{
                username: userData.userName,
                avatarUrl: userData.avatarUrl,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;