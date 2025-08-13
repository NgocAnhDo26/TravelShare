import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Lightbox from 'yet-another-react-lightbox'; // Direct import of Lightbox
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

// shadcn/ui components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Lock, Globe, ZoomIn } from "lucide-react";

// Splide carousel imports
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

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
  author?: {
    name: string;
    profilePicture?: string;
  };
}

function PostDetailsPage(): React.ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<IPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Splide carousel states
  const splideRef = useRef<Splide>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Image viewer states - using this directly with the Lightbox component
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Debug image loading
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Simulate API call with mock data
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch real data here when API is ready
        // For now, using mock data
        setPost(MOCK_POST);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post details');
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
      title: `${post.title} - Image ${index + 1}`
    }));
  };

  // Handle image load error
  const handleImageError = (imageUrl: string, index: number) => {
    console.error(`Failed to load image at index ${index}: ${imageUrl}`);
    setImageLoadErrors(prev => ({...prev, [imageUrl]: true}));
  };

  // Open lightbox when an image is clicked
  const handleImageClick = (index: number) => {
    console.log("Image clicked, opening lightbox at index:", index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Handler for Splide events
  const handleSplideMove = () => {
    if (splideRef.current) {
      const splideInstance = splideRef.current.splide;
      if (splideInstance) {
        const currentIndex = splideInstance.index;
        const totalSlides = splideInstance.length;
        setCurrentSlide(currentIndex);
        setProgress(((currentIndex) / (totalSlides - 1)) * 100);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-[300px] w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <Card className="max-w-2xl mx-auto my-8 border-red-200">
        <CardContent className="flex flex-col items-center pt-6 pb-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-muted-foreground">{error || 'Post not found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="border-none shadow-md">
        {/* Privacy badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge variant={post.privacy === 'private' ? "secondary" : "default"} className="gap-1">
            {post.privacy === 'private' ? 
              <><Lock className="h-3 w-3" /> Private</> : 
              <><Globe className="h-3 w-3" /> Public</>
            }
          </Badge>
        </div>

        {/* Cover image with error handling */}
        {post?.coverImageUrl && (
          <div className="w-full h-[300px] overflow-hidden rounded-t-lg bg-gray-100">
            <img 
              src={post.coverImageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover"
              onError={() => handleImageError(post.coverImageUrl || '', -1)}
            />
          </div>
        )}

        <CardContent className={`px-6 pt-8 pb-6 ${!post?.coverImageUrl ? 'pt-12' : ''}`}>
          {/* Post header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-6">{post.title}</h1>
            
            {/* Author info and dates */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={post.author?.profilePicture} alt={post.author?.name || 'Author'} />
                  <AvatarFallback>{post.author?.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.author?.name || 'Unknown Author'}</span>
              </div>
              
              <div className="text-muted-foreground text-sm">
                <span>
                  Published {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </span>
                {new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime() && (
                  <span className="ml-2">
                    • Updated {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post content */}
          <div className="prose prose-slate max-w-none my-8">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Images Gallery */}
          {post?.images && post.images.length > 0 && (
            <div className="my-10">
              <h3 className="text-xl font-semibold mb-4">Gallery</h3>
              
              {/* Splide Carousel with improved image handling */}
              <div className="relative">
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
                  aria-label="Post Images"
                >
                  <SplideTrack>
                    {post.images.map((image, index) => (
                      <SplideSlide key={index}>
                        <div 
                          className="relative h-full bg-gray-100 cursor-pointer flex items-center justify-center"
                          onClick={() => handleImageClick(index)}
                        >
                          <img
                            src={image}
                            alt={`${post.title} - Image ${index + 1}`}
                            className="max-h-full max-w-full object-contain"
                            onError={() => handleImageError(image, index)}
                          />
                          {/* More visible click indicator */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full">
                            <ZoomIn className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </SplideSlide>
                    ))}
                  </SplideTrack>
                </Splide>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Slide counter */}
                <div className="text-xs text-muted-foreground mt-2">
                  {currentSlide + 1} / {post.images.length}
                </div>
              </div>
            </div>
          )}

          {/* Engagement section */}
          <div className="border-t border-b py-4 my-6">
            <div className="flex gap-4">
              <Button variant="ghost" className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span>{post.likesCount}</span>
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>{post.commentsCount}</span>
              </Button>
            </div>
          </div>

          {/* Comments section placeholder */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Comments ({post.commentsCount})</h3>
            <div className="bg-muted rounded-lg p-6 text-center text-muted-foreground">
              {post.commentsCount > 0 ? 'Loading comments...' : 'No comments yet. Be the first to share your thoughts!'}
            </div>
          </div>
        </CardContent>
      </Card>
      
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
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-500 font-semibold">Some images failed to load:</p>
          <ul className="list-disc pl-5">
            {Object.keys(imageLoadErrors).map((url, i) => (
              <li key={i} className="text-red-400 text-sm truncate">{url}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Mock data for development and testing
const MOCK_POST: IPost = {
  _id: "60d21b4667d0d8992e610c85",
  authorID: "60d0fe4f5311236168a109ca",
  title: "Exploring the Hidden Beaches of Bali",
  content: `
    <h2>A Journey Off the Beaten Path</h2>
    <p>After months of planning, I finally made it to Bali - but I wasn't interested in the typical tourist spots. Instead, I embarked on a journey to discover the hidden gems that most travelers miss.</p>
    
    <p>The morning started early with a local guide who promised to show me beaches that weren't on any tourist map. We rode motorcycles along winding coastal roads, the warm breeze carrying the scent of salt and frangipani.</p>
    
    <h3>Pantai Rahasia (Secret Beach)</h3>
    <p>Our first stop was a small cove accessible only through a narrow path between two cliffs. The locals call it "Pantai Rahasia" or Secret Beach. The water was crystal clear with gentle waves lapping against pristine white sand.</p>
    
    <p>What made this place special wasn't just the absence of crowds, but the small community of local fishermen who still used traditional methods to catch their daily haul. They invited us to join them for a simple meal of grilled fish wrapped in banana leaves.</p>
    
    <h3>Sunset at Black Sand Beach</h3>
    <p>As the day progressed, we made our way to a volcanic black sand beach on the eastern coast. Unlike the popular beaches in Seminyak and Kuta, this stretch of shoreline was practically deserted.</p>
    
    <p>The contrast of black sand against the blue ocean created a dramatic landscape that was perfect for photography. As the sun began to set, the sky exploded in hues of orange and pink, reflecting off the wet sand in a display that felt almost otherworldly.</p>
    
    <p>This journey reminded me why I travel - not to check destinations off a list, but to find those quiet moments of connection with places most people never see.</p>
  `,
  coverImageUrl: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
  images: [
    "https://images.unsplash.com/photo-1502209524164-acea936639a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1468413253725-0d5181091126?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  ],
  privacy: 'public',
  likesCount: 243,
  commentsCount: 37,
  createdAt: new Date('2023-06-15T09:24:00'),
  updatedAt: new Date('2023-06-16T14:32:00'),
  author: {
    name: "Maya Traveler",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80"
  }
};

export default PostDetailsPage;
