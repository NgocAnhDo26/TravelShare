import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canEditPlan } from '@/utils/planPermissions';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);
  const [editedVisibility, setEditedVisibility] = useState<
    'public' | 'private'
  >(trip.privacy);
  const [isVisibilityLoading, setIsVisibilityLoading] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCoverImageLoading, setIsCoverImageLoading] = useState(false);
  // Add state for author profile
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(
    null,
  );
  const [authorLoading, setAuthorLoading] = useState(true);
  const [authorError, setAuthorError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

      const response = await API.put(
        `/plans/${trip._id}/cover-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'error' in err.response.data &&
        typeof err.response.data.error === 'string'
          ? err.response.data.error
          : 'Failed to delete plan';
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className='relative'>
        <img
          src={trip.coverImageUrl}
          alt='Trip cover image'
          className='w-full max-h-72 object-cover'
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              'https://placehold.co/1200x400/cccccc/ffffff?text=Image+Not+Found';
          }}
        />
        {editMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='secondary'
                size='icon'
                className='absolute top-4 right-4 size-10 bg-white/90 hover:bg-white'
                onClick={handleCoverImageEdit}
                disabled={isCoverImageLoading}
              >
                <Camera className='w-5 h-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit cover image</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Card className='relative lg:mx-16 mx-10 bg-white px-6 pt-8 shadow-lg -mt-28 rounded-md'>
        <div className='flex items-center'>
          <div className='flex items-center flex-1'>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className='text-gray-800 mr-2'
                autoFocus
                disabled={isLoading}
              />
            ) : (
              <h1 className='text-4xl font-bold text-gray-800 text-left'>
                {trip.title}
              </h1>
            )}
            {editMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='secondary'
                    size='icon'
                    className='size-8 ml-4'
                    onClick={isEditingTitle ? handleSaveTitle : handleEditTitle}
                    disabled={isLoading}
                  >
                    {isEditingTitle ? <Save /> : <Pencil />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditingTitle ? 'Save title' : "Edit plan's title"}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isEditingTitle && (
              <Button
                variant='outline'
                size='sm'
                className='ml-2'
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Show edit button in header for plan authors in view mode */}
          {!editMode && canEditPlan(trip, user) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleEditPlan}
                  className='flex items-center gap-2'
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

          {/* Show view button in header when in edit mode */}
          {editMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleViewPlan}
                  className='flex items-center gap-2'
                >
                  <Eye className='w-4 h-4' />
                  View Plan
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to view mode</p>
              </TooltipContent>
            </Tooltip>
          )}
          {/* Delete Plan button for author, only in edit mode */}
          {editMode && canEditPlan(trip, user) && (
            <>
              <Button
                variant='destructive'
                size='sm'
                className='flex items-center gap-2 ml-2'
                onClick={() => setDeleteDialogOpen(true)}
              >
                <TrashIcon className='w-4 h-4' />
                Delete
              </Button>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Plan</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this plan? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant='outline'>Cancel</Button>
                    </DialogClose>
                    <Button
                      variant='destructive'
                      onClick={handleDeletePlan}
                      autoFocus
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Visibility Section - Only show in edit mode */}
        {editMode && (
          <div className='flex items-center'>
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
                <span className='font-medium capitalize ml-1'>
                  {trip.privacy}
                </span>
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

        <p className='text-gray-600 text-left text-sm'>
          {trip.destination.name}
        </p>
        <div className='flex justify-between items-center mt-4'>
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
                        target.src =
                          'https://placehold.co/40x40/cccccc/ffffff?text=U';
                      }}
                    />
                    <AvatarFallback>
                      {(
                        authorProfile.displayName ||
                        authorProfile.username ||
                        'U'
                      )
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
              <>
                <div className='flex items-center'>
                  <Button variant='ghost'>
                    <Heart />
                    {trip.likesCount ?? 0}
                  </Button>
                  <Button variant='ghost'>
                    <MessageCircle />
                    {trip.commentsCount ?? 0}
                  </Button>
                  <Button className='ml-2'>
                    <Repeat />
                    Remix
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Cover Image Edit Modal */}
      <Dialog
        open={isCoverImageModalOpen}
        onOpenChange={setIsCoverImageModalOpen}
      >
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

          <DialogFooter>
            <Button
              variant='outline'
              onClick={handleCoverImageCancel}
              disabled={isCoverImageLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCoverImageSave}
              disabled={isCoverImageLoading || !selectedImage}
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
