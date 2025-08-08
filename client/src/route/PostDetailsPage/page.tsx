import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
// import axios from 'axios';
import { format } from 'date-fns';

// shadcn/ui components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Lock, Globe } from "lucide-react";

// Splide carousel
import { Splide, SplideSlide } from '@splidejs/react-splide';
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

// Create a second mock for testing different scenarios
const MOCK_PRIVATE_POST: IPost = {
  _id: "60d21b4667d0d8992e610c86",
  authorID: "60d0fe4f5311236168a109ca",
  title: "My Personal Travel Journal: Tokyo Adventures",
  content: `
    <h2>First Impressions of Tokyo</h2>
    <p>This is a private journal entry about my first day exploring Tokyo. The city is a fascinating blend of ancient traditions and cutting-edge technology.</p>
    
    <p>I started my day at the Tsukiji Outer Market, sampling some of the freshest sushi I've ever tasted. The vendors were incredibly friendly despite the language barrier.</p>
    
    <h3>Navigating the Metro</h3>
    <p>Tokyo's metro system is impressively efficient but initially overwhelming. After a few wrong turns, I finally got the hang of it. The trains run with incredible punctuality!</p>
    
    <p>I've noted some personal observations about cultural differences and customs that I found surprising, which I'd like to remember for future trips.</p>
  `,
  privacy: 'private',
  likesCount: 5,
  commentsCount: 0,
  createdAt: new Date('2023-08-01T15:42:00'),
  updatedAt: new Date('2023-08-01T15:42:00'),
  author: {
    name: "Maya Traveler",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80"
  }
};

export default function PostDetailsPage(): React.ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<IPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [progress, setProgress] = useState(0);
  
  const splideRef = useRef<any>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use different mock based on postId to test different scenarios
        if (postId === "private") {
          setPost(MOCK_PRIVATE_POST);
        } else {
          // Default to MOCK_POST if postId is undefined or any other value
          setPost(MOCK_POST);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post details');
      } finally {
        setLoading(false);
      }
    };

    // Always fetch post details, even if postId is undefined
    fetchPostDetails();
    
  }, [postId]);

  // Handle Splide carousel events
  const handleSplideMove = (splide: any) => {
    const index = splide.index;
    const totalSlides = splide.length;
    const newProgress = totalSlides > 1 ? ((index) / (totalSlides - 1)) * 100 : 0;
    
    setCurrentSlide(index + 1);
    setProgress(newProgress);
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
    <div className="w-7xl mx-auto px-4 py-8">
      {/* Post container */}
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

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="w-full h-[300px] overflow-hidden rounded-t-lg">
            <img 
              src={post.coverImageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        <CardContent className={`px-6 pt-8 pb-6 ${!post.coverImageUrl ? 'pt-12' : ''}`}>
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

          {/* Updated Image gallery with proper progress tracking */}
          {post?.images && post.images.length > 0 && (
            <div className="my-10">
              <h3 className="text-xl font-semibold mb-4">Gallery</h3>
              
              <div className="splide-container relative">
                <Splide
                  ref={splideRef}
                  options={{
                    type: 'slide',
                    perPage: 1,
                    gap: '1rem',
                    pagination: false,
                    arrows: true,
                    autoplay: false,
                    pauseOnHover: true,
                    rewind: true,
                    height: '400px',
                    breakpoints: {
                      640: {
                        height: '300px',
                      },
                    },
                  }}
                  onMove={(splide) => handleSplideMove(splide)}
                  onMounted={(splide) => handleSplideMove(splide)}
                >
                  {post.images.map((image, index) => (
                    <SplideSlide key={index}>
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 rounded-md overflow-hidden p-2 shadow-inner">
                        <div className="relative w-full h-full rounded overflow-hidden transition-all duration-300 group hover:shadow-md">
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 shadow-inner pointer-events-none border border-slate-200 rounded"></div>
                        </div>
                      </div>
                    </SplideSlide>
                  ))}
                </Splide>
                
                {/* Custom Progress Bar - Now React controlled */}
                <div className="mt-4">
                  <div className="custom-progress-container h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      <span>{currentSlide}</span>
                      <span> / {post.images.length}</span>
                    </span>
                  </div>
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
    </div>
  );
}
