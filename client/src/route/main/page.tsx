import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderTabs from '@/components/HeaderTabs';
import { useAuth } from '../../context/AuthContext';
import CreatePlanSection from './CreatePlanSection';
import FeedSection from './FeedSection';
import WelcomeSection from './WelcomeSection';
import PublicFeedPreview from './PublicFeedPreview';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
<<<<<<< HEAD
=======
  const [publicPlans, setPublicPlans] = useState<any[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      const fetchPublicPlans = async () => {
        setIsPublicLoading(true);
        try {
          const response = await API.get('/plans/public');
          // Ensure we always set an array
          setPublicPlans(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Failed to fetch public plans:', error);
          setPublicPlans([]); // Set empty array on error
        } finally {
          setIsPublicLoading(false);
        }
      };
      fetchPublicPlans();
    }
  }, [user, isLoading]);
>>>>>>> SCRUM-4

  const handleCreatePlan = () => {
    navigate('/plans/create');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='max-w-3xl mx-auto py-6 px-4'>
        <HeaderTabs />
        {user ? (
          <>
            <CreatePlanSection onCreatePlan={handleCreatePlan} />
            <FeedSection />
          </>
        ) : (
          <>
<<<<<<< HEAD
            <WelcomeSection onLogin={handleLogin} onRegister={handleRegister} />
            <PublicFeedPreview onRegister={handleRegister} />
=======
            {/* Welcome Section */}
            <Card className="mb-6 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 text-center">
                  Welcome to TravelShare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-lg">
                    Discover amazing travel plans and share your adventures with the world
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Explore destinations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Connect with travelers</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      onClick={handleLogin}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={handleRegister}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
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
                publicPlans.map((plan) => (
                  <PublicPlanCard key={plan._id} plan={plan} />
                ))
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
>>>>>>> SCRUM-4
          </>
        )}
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default MainPage;
=======
export default MainPage;
>>>>>>> SCRUM-4
