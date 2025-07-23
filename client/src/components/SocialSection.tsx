import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CommentItem from '@/components/CommentItem';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

const mockComments = [
  {
    name: 'Tina',
    message: 'Amazing itinerary! Thanks for sharing.',
    avatarUrl: 'https://github.com/shadcn.png',
    fallback: 'CN',
    timeAgo: '2 hours ago',
  },
  {
    name: 'Alex',
    message: "Can't wait to try this out!",
    avatarUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
    fallback: 'A',
    timeAgo: '1 minute ago',
  },
];

const SocialSection: React.FC = () => (
  <Card className='flex flex-col gap-2 mt-4 border py-3 overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left'>
    <div className='flex items-center gap-4 mx-4'>
      {/* Like Button */}
      <Button
        variant='ghost'
        aria-label='Like this trip'
        className='hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600'
        // Replace with real like handler
        onClick={() => {}}
      >
        <Heart /> Like
      </Button>

      <Separator orientation='vertical' />

      {/* Number of Likes */}
      <span className='text-sm text-gray-500'>12 likes</span>
      <span className='text-sm text-gray-500'>•</span>
      {/* Number of Comments */}
      <span className='text-sm text-gray-500'>3 comments</span>
    </div>

    <Separator />

    {/* User's Comments */}
    <div className='space-y-6 px-6 py-4'>
      {mockComments.map((comment, idx) => (
        <CommentItem key={idx} {...comment} />
      ))}
    </div>

    <Separator />

    {/* Add Comment Box */}
    <form className='flex gap-2 px-6 mt-4'>
      <Avatar>
        <AvatarImage src='https://github.com/shadcn.png' />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Input
        type='text'
        className='flex-1 ml-2'
        placeholder='Add a comment...'
      />
      <Button type='submit' className='text-sm font-medium mb-2'>
        Post
      </Button>
    </form>
  </Card>
);

export default SocialSection;
