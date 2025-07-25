import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canEditPlan } from '@/utils/planPermissions'; // Ensure this utility is correctly implemented

import {
  Calendar,
  Heart,
  MessageCircle,
  Pencil,
  Repeat,
  UserPlusIcon,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  Camera,
  Upload,
  X,
  TrashIcon,
} from 'lucide-react';
import type { Trip } from '@/types/trip';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// Add a type for the user profile
interface AuthorProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface TripHeaderProps {
  trip: Trip;
  editMode?: boolean;
  onTripUpdate?: (updatedTrip: Trip) => void;
}

/**
 * Renders the header section of the trip plan.
 */
const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  editMode = false,
  onTripUpdate,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(trip.title);
  const [isLoading, setIsLoading] = useState(false); // Used for title save
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);
  const [editedVisibility, setEditedVisibility] = useState<'public' | 'private'>(trip.privacy);
  const [isVisibilityLoading, setIsVisibilityLoading] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCoverImageLoading, setIsCoverImageLoading] = useState(false); // Used for cover image upload
  // Add state for author profile
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [authorLoading, setAuthorLoading] = useState(true);
  const [authorError, setAuthorError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Helper to get initials for AvatarFallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    setAuthorLoading(true);
    setAuthorError(null);
    API.get(`/users/${trip.author}/profile`)
      .then((res) => {
        if (isMounted) {
          setAuthorProfile(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAuthorError('Failed to load author');
          console.error(err);
        }
      })
      .finally(() => {
        if (isMounted) setAuthorLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [trip.author]);

  // Sync editedTitle and editedVisibility with trip prop when trip changes
  useEffect(() => {
    setEditedTitle(trip.title);
    setEditedVisibility(trip.privacy);
  }, [trip.title, trip.privacy]);

  const handleEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(trip.title);
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() === '') {
      toast.error('Title cannot be empty');
      return;
    }

    if (editedTitle.trim() === trip.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsLoading(true);
    try {
      await API.put(`/plans/${trip._id}/title`, {
        title: editedTitle.trim(),
      });

      // Update the local trip data
      const updatedTrip = { ...trip, title: editedTitle.trim() };
      
      // Call the parent component's update function if provided
      if (onTripUpdate) {
        onTripUpdate(updatedTrip);
      }

      setIsEditingTitle(false);
      toast.success('Title updated successfully!');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle(trip.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleEditVisibility = () => {
    setIsEditingVisibility(true);
    setEditedVisibility(trip.privacy);
  };

  const handleSaveVisibility = async (newPrivacy: 'public' | 'private') => {
    if (newPrivacy === trip.privacy) {
      setIsEditingVisibility(false);
      return;
    }

    setIsVisibilityLoading(true);
    try {
      await API.put(`/plans/${trip._id}/privacy`, {
        privacy: newPrivacy,
      });

      // Update the local trip data
      const updatedTrip = { ...trip, privacy: newPrivacy };
      
      // Call the parent component's update function if provided
      if (onTripUpdate) {
        onTripUpdate(updatedTrip);
      }

      setIsEditingVisibility(false);
      toast.success(`Trip visibility changed to ${newPrivacy}!`);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility. Please try again.');
    } finally {
      setIsVisibilityLoading(false);
    }
  };

  const handleCancelVisibilityEdit = () => {
    setIsEditingVisibility(false);
    setEditedVisibility(trip.privacy);
  };

  const handleCoverImageEdit = () => {
    setIsCoverImageModalOpen(true);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageSave = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to upload');
      return;
    }

    setIsCoverImageLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Uploading cover image...');
    
    try {
      // Single step: Upload file and update travel plan in one request
      const formData = new FormData();
      formData.append('coverImage', selectedImage);

      const response = await API.put(`/plans/${trip._id}/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the local trip data with the response
      const updatedTrip = response.data;
      
      // Call the parent component's update function if provided
      if (onTripUpdate) {
        onTripUpdate(updatedTrip);
      }

      setIsCoverImageModalOpen(false);
      setSelectedImage(null);
      setPreviewUrl(null);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Cover image updated successfully!');
    } catch (error) {
      console.error('Error updating cover image:', error);
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error('Failed to update cover image. Please try again.');
    } finally {
      setIsCoverImageLoading(false);
    }
  };

  const handleCoverImageCancel = () => {
    setIsCoverImageModalOpen(false);
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleEditPlan = () => {
    navigate(`/plans/${trip._id}/edit`);
  };

  const handleViewPlan = () => {
    navigate(`/plans/${trip._id}`);
  };

  const handleDeletePlan = async () => {
    try {
      await API.delete(`/plans/${trip._id}`);
      toast.success('Plan deleted successfully');
      navigate(`/users/${user?.userId}/profile`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete plan');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className='relative w-full'> {/* Container for the cover image */}
        <img
          src={trip.coverImageUrl}
          alt='Trip cover image'
          className='w-full max-h-48 sm:max-h-72 object-cover' // Adjusted max-height for responsiveness
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              'https://placehold.co/1200x400/cccccc/ffffff?text=Image+Not+Found'; // Fallback image
          }}
        />
        {editMode && ( // Show edit cover image button only in edit mode
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='secondary'
                size='icon'
                className='absolute top-2 right-2 size-8 sm:top-4 sm:right-4 sm:size-10 bg-white/90 hover:bg-white' // Responsive size and position
                onClick={handleCoverImageEdit}
                disabled={isCoverImageLoading}
              >
                <Camera className='w-4 h-4 sm:w-5 sm:h-5' /> {/* Responsive icon size */}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit cover image</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {/* Main content area of the header, acting as a card */}
      <Card className='relative mx-4 sm:mx-10 lg:mx-16 bg-white px-4 pt-6 shadow-lg -mt-20 sm:-mt-28 rounded-md sm:px-6 sm:pt-8 pb-4'> {/* Added pb-4 for bottom padding */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0'> {/* Flex container for title/edit and action buttons */}
          {/* Title and its edit buttons */}
          <div className='flex items-center flex-1 flex-wrap gap-2'>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className='text-gray-800 flex-1 min-w-0'
                autoFocus
                disabled={isLoading}
              />
            ) : (
              <h1 className='text-2xl sm:text-4xl font-bold text-gray-800 text-left flex-1 min-w-0'>
                {trip.title}
              </h1>
            )}
            {editMode && ( // Show edit title button only in edit mode
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    size='icon'
                    className='size-7 sm:size-8'
                    onClick={isEditingTitle ? handleSaveTitle : handleEditTitle}
                    disabled={isLoading}
                  >
                    {isEditingTitle ? <Save className='w-4 h-4' /> : <Pencil className='w-4 h-4' />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditingTitle ? 'Save title' : 'Edit plan\'s title'}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isEditingTitle && ( // Show cancel title edit button when editing title
              <Button
                variant='outline'
                size='sm'
                className='ml-2 h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm'
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
          
          {/* Top-right action button: Edit Plan (only in view mode for author) */}
          <div className="flex items-center justify-end"> {/* Container for the single top-right button */}
            {!editMode && canEditPlan(trip, user) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline' 
                    size='sm'
                    onClick={handleEditPlan}
                    className='flex items-center gap-2 px-3 h-8' // Standard desktop size
                  >
                    <Pencil className='w-4 h-4' />
                    Edit Plan
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to edit mode</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Visibility Section - Only show in edit mode */}
        {editMode && (
          <div className='flex flex-col sm:flex-row items-start sm:items-center mt-4 gap-2'>
            <div className='flex items-center text-gray-600 text-sm'>
              {trip.privacy === 'public' ? (
                <Eye className='w-4 h-4 mr-1' />
              ) : (
                <EyeOff className='w-4 h-4 mr-1' />
              )}
              <span>Visibility: </span>
              {isEditingVisibility ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='ml-1 h-6 px-2 text-xs'
                      disabled={isVisibilityLoading}
                    >
                      {editedVisibility === 'public' ? 'Public' : 'Private'}
                      <ChevronDown className='w-3 h-3 ml-1' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    <DropdownMenuItem
                      onClick={() => handleSaveVisibility('public')}
                      disabled={isVisibilityLoading}
                    >
                      <Eye className='w-4 h-4 mr-2' />
                      Public
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSaveVisibility('private')}
                      disabled={isVisibilityLoading}
                    >
                      <EyeOff className='w-4 h-4 mr-2' />
                      Private
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className='font-medium capitalize ml-1'>{trip.privacy}</span>
              )}
            </div>
            {!isEditingVisibility && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    size='icon'
                    className='size-7 ml-2'
                    onClick={handleEditVisibility}
                    disabled={isVisibilityLoading}
                  >
                    <Pencil className='w-3 h-3' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit visibility</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isEditingVisibility && (
              <Button
                variant='outline'
                size='sm'
                className='ml-2 h-6 px-2 text-xs'
                onClick={handleCancelVisibilityEdit}
                disabled={isVisibilityLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
        
        <p className='text-gray-600 text-left text-sm mt-4'>
          {trip.destination.name}
        </p>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4 pb-4'> {/* Added pb-4 for spacing before bottom buttons */}
          <div className='flex items-center text-gray-500'>
            <Calendar className='w-5 h-5 mr-2' />
            <span className='text-sm font-medium'>
              {trip.startDate && new Date(trip.startDate).toLocaleDateString()}
              {trip.startDate && trip.endDate && ' - '}
              {trip.endDate && new Date(trip.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            {editMode ? (
              <>
                {authorLoading ? (
                  <div className='w-9 h-9 rounded-full bg-gray-200 animate-pulse border-2 border-white' />
                ) : authorProfile ? (
                  <Avatar className='w-9 h-9 border-2 border-white'>
                    <AvatarImage
                      src={authorProfile.avatarUrl}
                      alt={`${authorProfile.displayName || authorProfile.username}'s avatar`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=U';
                      }}
                    />
                    <AvatarFallback>
                      {(authorProfile.displayName || authorProfile.username || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className='w-9 h-9 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm border-2 border-white'>
                    {authorError ? '?' : 'U'}
                  </div>
                )}
                <button className='w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors border-2 border-white'>
                  <UserPlusIcon className='w-5 h-5' />
                </button>
              </>
            ) : (
              <div className='flex flex-wrap justify-end gap-2'>
                <Button variant='ghost' className="px-2 py-1 h-auto">
                  <Heart className='w-4 h-4 mr-1' />
                  <span className="text-sm">{trip.likesCount ?? 0}</span>
                </Button>
                <Button variant='ghost' className="px-2 py-1 h-auto">
                  <MessageCircle className='w-4 h-4 mr-1' />
                  <span className="text-sm">{trip.commentsCount ?? 0}</span>
                </Button>
                <Button className='ml-2 px-3 py-1 h-auto text-sm'>
                  <Repeat className='w-4 h-4 mr-1' />
                  Remix
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* NEW: Bottom action buttons (View Plan and Delete) - only visible in edit mode */}
        {editMode && (
            <div className='flex flex-col sm:flex-row justify-end gap-2 mt-4 pt-4 border-t border-gray-200'> {/* Added border-t for separation */}
                <Button 
                    variant='outline' 
                    size='sm'
                    onClick={handleViewPlan}
                    className='flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2' // Full width on mobile, auto on desktop
                >
                    <Eye className='w-4 h-4' />
                    View Plan
                </Button>
                {canEditPlan(trip, user) && (
                    <>
                        <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => setDeleteDialogOpen(true)}
                            className='flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2' // Full width on mobile, auto on desktop
                        >
                            <TrashIcon className='w-4 h-4' />
                            Delete
                        </Button>
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Delete Plan</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this plan? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <DialogClose asChild>
                                        <Button variant='outline' className="w-full sm:w-auto">Cancel</Button>
                                    </DialogClose>
                                    <Button variant='destructive' onClick={handleDeletePlan} autoFocus className="w-full sm:w-auto">
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>
        )}
      </Card>

      {/* Cover Image Edit Modal */}
      <Dialog open={isCoverImageModalOpen} onOpenChange={setIsCoverImageModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Cover Image</DialogTitle>
          </DialogHeader>
          
          <div className='space-y-4'>
            {/* Current Image Preview */}
            <div className='space-y-2 grid'>
              <label className='text-sm font-medium'>Current Image</label>
              <div className='relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden'>
                <img
                  src={trip.coverImageUrl}
                  alt='Current cover'
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src =
                      'https://placehold.co/400x150/cccccc/ffffff?text=Current+Image';
                  }}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className='space-y-2 grid'>
              <label className='text-sm font-medium'>Select New Image</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='file'
                  accept='image/*'
                  onChange={handleImageSelect}
                  disabled={isCoverImageLoading}
                  className='flex-1'
                  ref={fileInputRef}
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCoverImageLoading}
                >
                  <Upload className='w-4 h-4' />
                </Button>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className='space-y-2 grid'>
                <label className='text-sm font-medium'>Preview</label>
                <div className='relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden'>
                  <img
                  src={previewUrl}
                  alt='Preview'
                  className='w-full h-full object-cover'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-2 right-2 size-6 bg-white/90 hover:bg-white'
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className='w-3 h-3' />
                  </Button>
              </div>
            </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant='outline'
              onClick={handleCoverImageCancel}
              disabled={isCoverImageLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCoverImageSave}
              disabled={isCoverImageLoading || !selectedImage}
              className="w-full sm:w-auto"
            >
              {isCoverImageLoading ? 'Uploading...' : 'Save Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripHeader;