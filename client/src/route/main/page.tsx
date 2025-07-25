import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, MapPin, Globe, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../../context/AuthContext';
import Feed from '../../components/PlanCard'; // Assuming this component is responsive internally
import API from '../../utils/axiosInstance';
import PublicPlanCard from '../../components/PublicPlanCard'; // Assuming this component is responsive internally

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [publicPlans, setPublicPlans] = useState<any[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  useEffect(() => {
    // Only fetch public plans if user is not logged in and not currently loading auth state
    if (!isLoading && !user) {
      const fetchPublicPlans = async () => {
        setIsPublicLoading(true);
        try {
          const response = await API.get('/plans/public');
          setPublicPlans(response.data);
        } catch (error) {
          console.error('Failed to fetch public plans:', error);
          // Optionally, set publicPlans to an empty array or handle error state for UI
          setPublicPlans([]);
        } finally {
          setIsPublicLoading(false);
        }
      };
      fetchPublicPlans();
    }
  }, [user, isLoading]);

  const handleCreatePlan = () => {
    navigate('/plans/create');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Điều chỉnh max-w cho mobile. Mặc định sẽ là w-full và có padding nhỏ hơn.
          sm:max-w-2xl để áp dụng max-w-2xl khi màn hình đạt breakpoint sm trở lên.
          sm:py-6 sm:px-4 để padding lớn hơn trên màn hình lớn.
      */}
      <div className="w-full mx-auto py-4 px-2 sm:max-w-2xl sm:py-6 sm:px-4">
        {user ? (
          // Logged in user content
          <>
            {/* Create Plan Section */}
            <Card className="mb-6 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Create a New Travel Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Thay đổi flex-direction. Mặc định là column trên mobile,
                    trở thành row khi màn hình sm trở lên.
                    items-start trên mobile để văn bản căn trái, items-center trên sm.
                    Nút Create Plan chiếm toàn bộ chiều rộng trên mobile (w-full),
                    và tự động chiều rộng trên sm (sm:w-auto).
                */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm mb-2">
                      Share your travel adventures with the community
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>Plan your next destination</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreatePlan}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-4 sm:mt-0"
                  >
                    <Plus className="w-4 h-4 mr-2" /> {/* Thêm mr-2 để icon và text có khoảng cách */}
                    Create Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Feed Section */}
            <div>
              <Separator className='my-6' />
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Feed</h2>
              {/* Đảm bảo component Feed cũng được tối ưu responsive */}
              <Feed />
            </div>
          </>
        ) : (
          // Guest user content
          <>
            {/* Welcome Section */}
            <Card className="mb-6 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                {/* Điều chỉnh font size cho mobile (text-xl) và lớn hơn trên sm (sm:text-2xl) */}
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                  Welcome to TravelShare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  {/* Điều chỉnh font size cho mobile (text-base) và lớn hơn trên sm (sm:text-lg) */}
                  <p className="text-gray-600 text-base sm:text-lg">
                    Discover amazing travel plans and share your adventures with the world
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Explore destinations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Connect with travelers</span>
                    </div>
                  </div>
                  {/* Thay đổi flex-direction. Mặc định là column trên mobile,
                      trở thành row khi màn hình sm trở lên.
                      Các nút chiếm toàn bộ chiều rộng trên mobile (w-full),
                      và tự động chiều rộng trên sm (sm:w-auto).
                  */}
                  <div className="flex flex-col gap-3 justify-center pt-4 sm:flex-row">
                    <Button
                      onClick={handleLogin}
                      variant="outline"
                      className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={handleRegister}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Join TravelShare
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Feed Preview */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                {/* Điều chỉnh font size cho mobile (text-lg) và lớn hơn trên sm (sm:text-xl) */}
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  Recent Travel Plans
                </h2>
                <p className="text-gray-600 text-sm">
                  Sign up to create your own travel plans and interact with the community
                </p>
              </div>

              {/* Limited skeleton posts for guests */}
              {isPublicLoading ? (
                // Hiển thị skeleton khi đang tải
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-48 w-full rounded-lg" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Hiển thị các kế hoạch công khai hoặc thông báo nếu không có
                publicPlans.length > 0 ? (
                  publicPlans.map((plan) => (
                    // Đảm bảo PublicPlanCard cũng được tối ưu responsive bên trong nó
                    <PublicPlanCard key={plan._id} plan={plan} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No public travel plans found.
                    <br />
                    Sign up to create your first plan!
                  </p>
                )
              )}

              {/* Call to action */}
              <Card className="mt-6 shadow-sm border-dashed border-2 border-gray-300 bg-gray-50">
                <CardContent className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Want to see more travel plans and create your own?
                  </p>
                  <Button
                    onClick={handleRegister}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign Up Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainPage;