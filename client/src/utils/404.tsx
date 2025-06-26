import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="bg-white border-black border-2 shadow-none p-8 text-center max-w-md w-full">
        <div className="space-y-6">
          <h1 className="text-8xl font-bold text-black tracking-tighter">
            404
          </h1>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-black">
              Page Not Found
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center items-center">
            <Button
              onClick={handleGoBack}
              className="bg-black text-white hover:bg-gray-800 cursor-pointer" 
            >
              Go Back
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white cursor-pointer"
            >
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;