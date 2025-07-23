import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Feed from '../../components/PlanCard';

interface PublicFeedPreviewProps {
  onRegister: () => void;
}

const PublicFeedPreview: React.FC<PublicFeedPreviewProps> = ({ onRegister }) => (
  <div className='space-y-4'>
    <div className='text-center mb-6'>
      <h2 className='text-xl font-semibold text-gray-800 mb-2'>
        Recent Travel Plans
      </h2>
      <p className='text-gray-600 text-sm'>
        Sign up to create your own travel plans and interact with the community
      </p>
    </div>
    <Feed feedType='guest' />
    <Card className='mt-6 shadow-sm border-dashed border-2 border-gray-300 bg-transparent'>
      <CardContent className='text-center py-8'>
        <p className='text-gray-600 mb-4'>
          Want to see more travel plans and create your own?
        </p>
        <Button
          onClick={onRegister}
          className='bg-gradient-to-br from-teal-500 to-blue-600 mb-4 shadow-lg shadow-blue-500/20 hover:from-teal-600 hover:to-blue-700 transition-all duration-300'
        >
          Sign Up Now
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default PublicFeedPreview; 