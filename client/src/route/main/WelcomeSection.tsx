import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Globe, Users } from 'lucide-react';

interface WelcomeSectionProps {
  onLogin: () => void;
  onRegister: () => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onLogin, onRegister }) => (
  <Card className='mb-8 bg-gradient-to-r from-white to-blue-50/50 border-0 shadow-lg shadow-blue-500/10'>
    <CardHeader>
      <CardTitle className='text-2xl font-bold text-gray-800 text-center'>
        Welcome to TravelShare
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className='text-center space-y-4'>
        <p className='text-gray-600 text-lg'>
          Discover amazing travel plans and share your adventures with the world
        </p>
        <div className='flex items-center justify-center gap-6 text-sm text-gray-500'>
          <div className='flex items-center gap-2'>
            <Globe className='w-4 h-4' />
            <span>Explore destinations</span>
          </div>
          <div className='flex items-center gap-2'>
            <Users className='w-4 h-4' />
            <span>Connect with travelers</span>
          </div>
        </div>
        <div className='flex gap-3 justify-center pt-4'>
          <Button
            onClick={onLogin}
            variant='outline'
            className='border-blue-300 text-blue-600 hover:bg-blue-50'
          >
            Sign In
          </Button>
          <Button
            onClick={onRegister}
            className='bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mb-4 hover:from-teal-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/20'
          >
            Join TravelShare
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default WelcomeSection; 