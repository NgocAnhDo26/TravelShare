import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderTabs from '@/components/HeaderTabs';
import { SearchInput } from '@/components/SearchInput';
import { useAuth } from '../../context/AuthContext';
import CreatePlanSection from './CreatePlanSection';
import FeedSection from './FeedSection';
import WelcomeSection from './WelcomeSection';
import PublicFeedPreview from './PublicFeedPreview';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

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
        {/* Full width search bar like Twitter */}
        <div className='mb-6'>
          <SearchInput
            placeholder='Search for travel plans, posts, or people...'
            fullWidth={true}
          />
        </div>

        <HeaderTabs
          tabs={[
            { label: 'For you', value: 'for-you', to: '/' },
            { label: 'Following', value: 'following', to: '/following' },
          ]}
        />

        {user ? (
          <>
            <CreatePlanSection onCreatePlan={handleCreatePlan} />
            <FeedSection />
          </>
        ) : (
          <>
            <WelcomeSection onLogin={handleLogin} onRegister={handleRegister} />
            <PublicFeedPreview onRegister={handleRegister} />
          </>
        )}
      </div>
    </div>
  );
};

export default MainPage;
