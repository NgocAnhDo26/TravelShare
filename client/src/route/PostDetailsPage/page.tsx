import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Lightbox from 'yet-another-react-lightbox'; // Direct import of Lightbox
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

// shadcn/ui components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Globe, ZoomIn } from 'lucide-react';

// Splide carousel imports
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// Import SocialSection and useLikeToggle
import SocialSection from '@/components/SocialSection';
import { useLikeToggle } from '@/hooks/useLikeToggle';
import { useAuth } from '@/context/AuthContext';
import API from '@/utils/axiosInstance';

// Post interface based on your provided structure
interface IPost {
  _id: string;
  authorID: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  images?: string[];
  privacy: 'public' | 'private';
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean; // Add this property for like state
  author?: {
    name: string;
    profilePicture?: string;
  };
}

function PostDetailsPage(): React.ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<IPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Splide carousel states
  const splideRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  // Image viewer states - using this directly with the Lightbox component
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Debug image loading
  const [imageLoadErrors, setImageLoadErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Function to convert JSON content to HTML if needed
  const convertContentToHTML = (content: string): string => {
    try {
      // Check if content is JSON
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
        // This is TipTap JSON content, convert to HTML
        return convertTipTapToHTML(parsed);
      }
    } catch (e) {
      // Content is not JSON, return as-is (HTML)
      return content;
    }
    return content;
  };

  // Convert TipTap JSON to HTML
  const convertTipTapToHTML = (doc: any): string => {
    if (!doc.content) return '';

    let html = '';

    doc.content.forEach((node: any) => {
      if (node.type === 'paragraph') {
        const attrs = node.attrs || {};
        const style = attrs.textAlign
          ? ` style="text-align: ${attrs.textAlign}"`
          : '';
        html += `<p${style}>`;

        if (node.content) {
          node.content.forEach((textNode: any) => {
            if (textNode.type === 'text') {
              let text = textNode.text;
              if (textNode.marks) {
                textNode.marks.forEach((mark: any) => {
                  switch (mark.type) {
                    case 'bold':
                      text = `<strong>${text}</strong>`;
                      break;
                    case 'italic':
                      text = `<em>${text}</em>`;
                      break;
                    case 'underline':
                      text = `<u>${text}</u>`;
                      break;
                    case 'textStyle':
                      if (mark.attrs?.color) {
                        text = `<span style="color: ${mark.attrs.color}">${text}</span>`;
                      }
                      break;
                    case 'highlight':
                      text = `<mark>${text}</mark>`;
                      break;
                  }
                });
              }
              html += text;
            }
          });
        }

        html += '</p>';
      } else if (node.type === 'blockquote') {
        html += '<blockquote>';
        if (node.content) {
          html += convertTipTapToHTML({ content: node.content });
        }
        html += '</blockquote>';
      } else if (node.type === 'orderedList') {
        const attrs = node.attrs || {};
        const start = attrs.start || 1;
        html += `<ol start="${start}">`;
        if (node.content) {
          node.content.forEach((listItem: any) => {
            if (listItem.type === 'listItem') {
              html += '<li>';
              if (listItem.content) {
                html += convertTipTapToHTML({ content: listItem.content });
              }
              html += '</li>';
            }
          });
        }
        html += '</ol>';
      } else if (node.type === 'bulletList') {
        html += '<ul>';
        if (node.content) {
          node.content.forEach((listItem: any) => {
            if (listItem.type === 'listItem') {
              html += '<li>';
              if (listItem.content) {
                html += convertTipTapToHTML({ content: listItem.content });
              }
              html += '</li>';
            }
          });
        }
        html += '</ul>';
      }
    });

    return html;
  };

  // This hook is now the single source of truth for the like state.
  const { isLiked, likesCount, handleToggleLike } = useLikeToggle({
    targetId: post?._id ?? '',
    initialIsLiked: post?.isLiked ?? false,
    initialLikesCount: post?.likesCount ?? 0,
    apiPath: '/posts',
    onModel: 'Post',
  });

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await API.get(`/posts/${postId}`);
        const postData = response.data.data;

        // Transform the API response to match our interface
        const transformedPost: IPost = {
          _id: postData._id,
          authorID: postData.author._id,
          title: postData.title,
          content: postData.content,
          coverImageUrl: postData.coverImageUrl,
          images: postData.images || [],
          privacy: postData.privacy,
          likesCount: postData.likesCount,
          commentsCount: postData.commentsCount,
          isLiked: postData.isLiked,
          createdAt: new Date(postData.createdAt),
          updatedAt: new Date(postData.updatedAt),
          author: {
            name: postData.author.name,
            profilePicture: postData.author.profilePicture,
          },
        };

        setPost(transformedPost);
      } catch (err: any) {
        console.error('Error fetching post details:', err);

        if (err.response?.status === 404) {
          setError('Post not found');
        } else if (err.response?.status === 403) {
          setError('Access denied. This post is private.');
        } else if (err.response?.status === 401) {
          setError('Please log in to view this post');
        } else {
          setError('Failed to load post details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  // Format post images for the lightbox
  const formatPostImages = () => {
    if (!post?.images || post.images.length === 0) return [];

    return post.images.map((image, index) => ({
      src: image,
      alt: `${post.title} - Image ${index + 1}`,
      title: `${post.title} - Image ${index + 1}`,
    }));
  };

  // Handle image load error
  const handleImageError = (imageUrl: string, index: number) => {
    console.error(`Failed to load image at index ${index}: ${imageUrl}`);
    setImageLoadErrors((prev) => ({ ...prev, [imageUrl]: true }));
  };

  // Open lightbox when an image is clicked
  const handleImageClick = (index: number) => {
    console.log('Image clicked, opening lightbox at index:', index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Handler for Splide events
  const handleSplideMove = () => {
    if (splideRef.current && splideRef.current.splide) {
      const splideInstance = splideRef.current.splide;
      const currentIndex = splideInstance.index;
      const totalSlides = splideInstance.length;
      setCurrentSlide(currentIndex);
      setProgress((currentIndex / (totalSlides - 1)) * 100);
    }
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16 space-y-4'>
        <div className='space-y-3'>
          <Skeleton className='h-8 w-[250px]' />
          <Skeleton className='h-4 w-[200px]' />
          <Skeleton className='h-[300px] w-full rounded-md' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>
        <p className='text-muted-foreground'>Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <Card className='max-w-2xl mx-auto my-8 border-red-200'>
        <CardContent className='flex flex-col items-center pt-6 pb-8 text-center'>
          <h2 className='text-2xl font-bold text-red-500 mb-2'>Error</h2>
          <p className='text-muted-foreground'>{error || 'Post not found'}</p>
          {error === 'Please log in to view this post' && (
            <Button
              className='mt-4'
              onClick={() => (window.location.href = '/login')}
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentUserForSocialSection = user
    ? {
        ...user,
        _id: user.userId,
      }
    : null;

  return (
    <div className='max-w-5xl mx-auto px-4 py-8'>
      <Card className='border-none shadow-md py-0 text-left'>
        {/* Privacy badge */}
        <div className='absolute top-4 right-4 z-10'>
          <Badge
            variant={post.privacy === 'private' ? 'secondary' : 'default'}
            className='gap-1'
          >
            {post.privacy === 'private' ? (
              <>
                <Lock className='h-3 w-3' /> Private
              </>
            ) : (
              <>
                <Globe className='h-3 w-3' /> Public
              </>
            )}
          </Badge>
        </div>

        {/* Cover image with error handling */}
        {post?.coverImageUrl && (
          <div className='w-full h-[300px] overflow-hidden rounded-t-lg bg-gray-100'>
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className='w-full h-full object-cover'
              onError={() => handleImageError(post.coverImageUrl || '', -1)}
            />
          </div>
        )}

        <CardContent
          className={`px-6 pt-8 pb-6 ${!post?.coverImageUrl ? 'pt-12' : ''}`}
        >
          {/* Post header */}
          <div className='mb-8'>
            <h1 className='text-4xl font-bold tracking-tight mb-6'>
              {post.title}
            </h1>

            {/* Author info and dates */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
              <div className='flex items-center'>
                <Avatar className='h-10 w-10 mr-3'>
                  <AvatarImage
                    src={post.author?.profilePicture}
                    alt={post.author?.name || 'Author'}
                  />
                  <AvatarFallback>
                    {post.author?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className='font-medium'>
                  {post.author?.name || 'Unknown Author'}
                </span>
              </div>

              <div className='text-muted-foreground text-sm'>
                <span>
                  Published {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </span>
                {new Date(post.updatedAt).getTime() >
                  new Date(post.createdAt).getTime() && (
                  <span className='ml-2'>
                    • Updated {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post content */}
          <div className='prose prose-slate max-w-none my-8'>
            <div
              dangerouslySetInnerHTML={{
                __html: convertContentToHTML(post.content),
              }}
            />
          </div>

          {/* Images Gallery */}
          {post?.images && post.images.length > 0 && (
            <div className='mt-10'>
              <h3 className='text-xl font-semibold mb-4'>Gallery</h3>

              {/* Splide Carousel with improved image handling */}
              <div className='relative'>
                <Splide
                  ref={splideRef}
                  onMove={handleSplideMove}
                  options={{
                    perPage: 1,
                    gap: '1rem',
                    pagination: false,
                    arrows: true,
                    height: '400px',
                  }}
                  hasTrack={false}
                  aria-label='Post Images'
                >
                  <SplideTrack>
                    {post.images.map((image, index) => (
                      <SplideSlide key={index}>
                        <div
                          className='relative h-full bg-gray-100 cursor-pointer flex items-center justify-center'
                          onClick={() => handleImageClick(index)}
                        >
                          <img
                            src={image}
                            alt={`${post.title} - Image ${index + 1}`}
                            className='max-h-full max-w-full object-contain'
                            onError={() => handleImageError(image, index)}
                          />
                          {/* More visible click indicator */}
                          <div className='absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full'>
                            <ZoomIn className='h-5 w-5 text-white' />
                          </div>
                        </div>
                      </SplideSlide>
                    ))}
                  </SplideTrack>
                </Splide>

                {/* Progress bar */}
                <div className='w-full bg-gray-200 rounded-full h-1.5 mt-4'>
                  <div
                    className='bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out'
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Slide counter */}
                <div className='text-xs text-muted-foreground mt-2'>
                  {currentSlide + 1} / {post.images.length}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SocialSection for comments and likes */}
      {post && (
        <SocialSection
          targetId={post._id}
          onModel='Post'
          initialCommentsCount={post.commentsCount}
          currentUser={currentUserForSocialSection}
          likesCount={likesCount}
          isLiked={isLiked}
          onToggleLike={handleToggleLike}
        />
      )}

      {/* Direct usage of Lightbox component instead of ImageViewer */}
      {post?.images && post.images.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={formatPostImages()}
          plugins={[Captions, Fullscreen, Zoom]}
        />
      )}

      {/* Debug info - display any image load errors */}
      {Object.keys(imageLoadErrors).length > 0 && (
        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-red-500 font-semibold'>
            Some images failed to load:
          </p>
          <ul className='list-disc pl-5'>
            {Object.keys(imageLoadErrors).map((url, i) => (
              <li key={i} className='text-red-400 text-sm truncate'>
                {url}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PostDetailsPage;
