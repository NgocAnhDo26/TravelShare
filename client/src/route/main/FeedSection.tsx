import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Heart } from 'lucide-react';
import Feed from '../../components/Feed';

const FeedSection: React.FC = () => (
  <div>
    <Separator className='my-6' />
    <h2 className='text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4'>
      <Heart className='w-6 h-6 text-red-500' />
      Your Feed
    </h2>
    <Feed feedType='user' />
  </div>
);

export default FeedSection;
