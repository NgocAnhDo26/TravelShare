import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface RelatedPost {
  postId: string;
  title: string;
  author: string;
  likesCount: number;
  commentsCount: number;
}

interface RelatedPostsSectionProps {
  relatedPosts: RelatedPost[];
  relatedLoading: boolean;
}

const RelatedPostsSection: React.FC<RelatedPostsSectionProps> = ({
  relatedPosts,
  relatedLoading,
}) => {
  const navigate = useNavigate();

  return (
    <Card className='mt-8'>
      <div className='p-4 border-b'>
        <h2 className='text-2xl font-bold text-left mb-4 ml-6 pl-4'>
          Related Posts
        </h2>
      </div>
      <div className='p-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-br p-2 rounded-lg'>
          {relatedLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className='h-20 w-full' />
            ))
          ) : relatedPosts.length === 0 ? (
            <div className='col-span-full text-center text-gray-400 py-8'>
              No related posts found
            </div>
          ) : (
            relatedPosts.map((post) => (
              <div
                key={post.postId}
                className='rounded-lg p-4 shadow-sm hover:shadow-lg hover:bg-gray-50 transition cursor-pointer flex flex-col bg-transparent border border-gray-200'
                onClick={() => navigate(`/posts/${post.postId}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/posts/${post.postId}`);
                  }
                }}
                aria-label={`View post: ${post.title}`}
              >
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-base'>{post.title}</span>
                  <span className='ml-2 text-xs text-gray-400'>
                    by {post.author}
                  </span>
                </div>
                <div className='flex gap-4 mt-2 text-xs text-gray-500'>
                  <span>
                    {post.likesCount} like{post.likesCount === 1 ? '' : 's'}
                  </span>
                  <span>
                    {post.commentsCount} comment
                    {post.commentsCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default RelatedPostsSection;
