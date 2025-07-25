import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MapPin, NotebookPen, ScrollText } from 'lucide-react';

interface CreatePlanSectionProps {
  onCreatePlan: () => void;
}

const CreatePlanSection: React.FC<CreatePlanSectionProps> = ({ onCreatePlan }) => (
  <Card className='mb-8 bg-gradient-to-r from-white to-blue-50/50 border-0 shadow-lg shadow-blue-500/10'>
    <CardContent className='p-4 text-center'>
      <div className='w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
        <MapPin className='w-8 h-8 text-white' />
      </div>
      <h2 className='text-2xl font-bold text-slate-800 mb-2'>
        Create a new Plan/Post
      </h2>
      <p className='text-slate-600 mb-6'>
        Share your travel adventures with the community
      </p>
      <div className='flex gap-4 items-center justify-center'>
        <Button
          onClick={onCreatePlan}
          className='bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30'
        >
          <NotebookPen />
          Create Plan
        </Button>
        <span>/</span>
        <Button
          onClick={onCreatePlan}
          className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30'
        >
          <ScrollText />
          Write Post
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default CreatePlanSection; 