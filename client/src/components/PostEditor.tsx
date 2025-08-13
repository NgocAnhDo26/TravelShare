import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
  X,
  Globe,
  Lock,
  Upload,
  Image as ImageIcon,
  Tag as TagIcon,
} from 'lucide-react';
import API from '@/utils/axiosInstance';
import TagPlanModal, { type PlanLite } from '@/components/TagPlanModal';

type Privacy = 'public' | 'private';

interface FormState {
  title: string;
  content: string;
  coverImage?: File; // Can be a file object or a base64 string
  images?: File[]; // Array of file objects
  privacy: Privacy;
  relatedPlan?: PlanLite | null;
}

interface FormErrors {
  title?: string;
  content?: string;
}

interface PostEditorProps {
  editMode?: boolean;
  postId?: string;
}

export default function PostEditor({ editMode = false, postId }: PostEditorProps) {
  const TITLE_MAX = 120;
  const navigate = useNavigate();
  const params = useParams();
  const [formState, setFormState] = useState<FormState>({
    title: '',
    content: '<p></p>',
    privacy: 'public',
    relatedPlan: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const coverImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  // Get postId from props or URL params
  const currentPostId = postId || params.postId;

  // Load existing post data if in edit mode
  useEffect(() => {
    if (editMode && currentPostId) {
      loadPostData();
    }
  }, [editMode, currentPostId]);

  const loadPostData = async () => {
    try {
      setIsLoading(true);
      const response = await API.get(`/posts/${currentPostId}`);
      const post = response.data.data;
      
      console.log('Loading post data:', post);
      console.log('Post content:', post.content);
      console.log('Post content type:', typeof post.content);
      
      setFormState({
        title: post.title,
        content: post.content,
        privacy: post.privacy,
        relatedPlan: post.relatedPlan ? {
          _id: post.relatedPlan._id,
          title: post.relatedPlan.title,
          author: { displayName: post.relatedPlan.author?.displayName || 'Anonymous' }
        } : null,
      });
      
      console.log('Form state after setting:', {
        title: post.title,
        content: post.content,
        privacy: post.privacy,
      });
      
      if (post.coverImageUrl) {
        setCoverImagePreview(post.coverImageUrl);
      }
      
      if (post.images && post.images.length > 0) {
        setImagesPreviews(post.images);
      }
    } catch (error) {
      console.error('Error loading post data:', error);
      toast.error('Failed to load post data');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formState.title || formState.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    }
    
    // Better content validation that handles HTML content
    const textContent = formState.content.replace(/<[^>]*>/g, '').trim();
    if (!textContent || textContent.length < 10) {
      newErrors.content = 'Content must be at least 10 characters (excluding HTML tags).';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    console.log(`Updating ${field}:`, value); // Debug logging
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if content is just placeholder text or empty
    const textContent = formState.content.replace(/<[^>]*>/g, '').trim();
    if (textContent === '' || textContent.length < 10) {
      toast.error('Please write meaningful content for your post (at least 10 characters).');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editMode && currentPostId) {
        // Edit mode - send PUT request
        const updateData = {
          title: formState.title,
          content: formState.content,
          privacy: formState.privacy,
          relatedPlan: formState.relatedPlan?._id || null,
        };

        API.put(`/posts/${currentPostId}`, updateData)
          .then(() => {
            toast.success('Post updated successfully!');
            setTimeout(() => {
              navigate(`/posts/${currentPostId}`);
            }, 1000);
          })
          .catch((error) => {
            console.error('Post update error:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update post. Please try again.';
            toast.error(errorMessage);
          })
          .finally(() => setIsLoading(false));
      } else {
        // Create mode - send POST request with FormData
        const formData = new FormData();
        formData.append('title', formState.title);
        formData.append('content', formState.content);
        formData.append('privacy', formState.privacy);
        if (coverImageFile) formData.append('coverImage', coverImageFile);
        if (imageFiles && imageFiles.length > 0) {
          imageFiles.forEach((file) => formData.append('images', file));
        }
        if (formState.relatedPlan?._id) {
          formData.append('relatedPlan', formState.relatedPlan._id);
        }

        // Debug: Log what's being sent
        console.log('Submitting form data:', {
          title: formState.title,
          content: formState.content,
          privacy: formState.privacy,
          hasCoverImage: !!coverImageFile,
          imageCount: imageFiles.length,
          relatedPlan: formState.relatedPlan?._id
        });

        API.post('/posts/create', formData)
          .then((response) => {
            toast.success('Post created successfully!');
            
            // Extract the post ID from the response and navigate to the post detail page
            const postId = response.data?.data?._id;
            if (postId) {
              // Small delay to ensure toast is visible before navigation
              setTimeout(() => {
                navigate(`/posts/${postId}`);
              }, 1000);
            } else {
              console.warn('Post ID not found in response:', response.data);
              // Fallback: navigate to the main feed if post ID is not available
              setTimeout(() => {
                navigate('/');
              }, 1000);
            }
          })
          .catch((error) => {
            console.error('Post creation error:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create post. Please try again.';
            toast.error(errorMessage);
          })
          .finally(() => setIsLoading(false));
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCoverImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setImageFiles(filesArray);
      const newPreviews: string[] = [];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          newPreviews.push(result);
          if (newPreviews.length === filesArray.length) {
            setImagesPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImagePreview(null);
    setCoverImageFile(null);
    setFormState((prev) => ({ ...prev, coverImage: undefined }));
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    setFormState((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== indexToRemove),
    }));
    setImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      privacy: e.target.checked ? 'public' : 'private',
    }));
  };

  return (
    <div className='mx-auto max-w-3xl p-6 text-left'>
      <div className='my-6'>
        <h2 className='text-3xl font-bold tracking-tight'>Create New Post</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Share your story with a title, photos, and rich content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Title */}
        <div className='rounded-xl border bg-white p-5 shadow-sm'>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-900'
          >
            Title
          </label>
          <div className='mt-2'>
            <Input
              id='title'
              className='h-11 text-base focus-visible:ring-black'
              placeholder='My amazing journey through the Alps'
              value={formState.title}
              maxLength={TITLE_MAX}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          <div className='mt-1 flex items-center justify-between'>
            <p className='text-xs text-gray-500'>
              Create a catchy, descriptive title.
            </p>
            <p className='text-xs text-gray-400'>
              {formState.title.length}/{TITLE_MAX}
            </p>
          </div>
          {errors.title && (
            <p className='mt-2 text-xs font-medium text-red-600'>
              {errors.title}
            </p>
          )}
        </div>

        {/* Tag Plan */}
        <div className='rounded-xl border bg-white p-5 shadow-sm'>
          <label className='block text-sm font-medium text-gray-900'>
            Tag Plan
          </label>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setTagModalOpen(true)}
              className='inline-flex items-center gap-2'
            >
              <TagIcon size={16} />{' '}
              {formState.relatedPlan ? 'Change plan' : 'Tag a plan'}
            </Button>
            {formState.relatedPlan && (
              <div className='flex items-center gap-2 rounded-full border px-3 py-1 text-sm'>
                <span className='font-medium'>
                  {formState.relatedPlan.title}
                </span>
                <span className='text-gray-500'>
                  · {formState.relatedPlan.author?.displayName || 'Anonymous'}
                </span>
                <button
                  type='button'
                  className='ml-1 rounded-full p-1 hover:bg-gray-100'
                  aria-label='Remove tagged plan'
                  onClick={() =>
                    setFormState({ ...formState, relatedPlan: null })
                  }
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            Link your post to an itinerary to add context.
          </p>
        </div>

        {/* Content */}
        <div className='rounded-xl border bg-white p-5 shadow-sm'>
          <label
            htmlFor='content'
            className='block text-sm font-medium text-gray-900'
          >
            Content
          </label>
          <div className='mt-2'>
            <RichTextEditor
              key={editMode ? `edit-${currentPostId}` : 'create'}
              content={formState.content}
              onChange={(content) => handleInputChange('content', content)}
              placeholder='Tell us about your adventure...'
              className='min-h-[280px] text-left'
            />
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            Describe your travel experience in detail.
          </p>
          {errors.content && (
            <p className='mt-2 text-xs font-medium text-red-600'>
              {errors.content}
            </p>
          )}
        </div>

        {/* Cover Image */}
        <div className='rounded-xl border bg-white p-5 shadow-sm'>
          <label
            htmlFor='coverImage'
            className='block text-sm font-medium text-gray-900'
          >
            Cover Image
          </label>
          <div className='mt-2'>
            <Input
              ref={coverImageRef}
              id='coverImage'
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleCoverImageChange}
            />
            <div
              role='button'
              tabIndex={0}
              onClick={() => coverImageRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  coverImageRef.current?.click();
              }}
              className='flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-600 hover:bg-gray-50'
            >
              <Upload size={18} />
              <span className='text-sm font-medium'>
                {coverImagePreview
                  ? 'Change cover image'
                  : 'Click to upload cover image'}
              </span>
              <span className='text-xs text-gray-500'>PNG, JPG up to ~5MB</span>
            </div>
            {coverImagePreview && (
              <div className='relative mt-3'>
                <img
                  src={coverImagePreview}
                  alt='Cover preview'
                  className='h-48 w-full rounded-md object-cover'
                />
                <button
                  type='button'
                  className='absolute right-2 top-2 rounded-full bg-black bg-opacity-60 p-1.5 text-white hover:bg-opacity-75'
                  onClick={handleRemoveCoverImage}
                  aria-label='Remove cover image'
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            Choose a striking image that represents your post.
          </p>
        </div>

        {/* Additional Images */}
        <div className='rounded-xl border bg-white p-5 shadow-sm'>
          <label
            htmlFor='images'
            className='block text-sm font-medium text-gray-900'
          >
            Additional Images
          </label>
          <div className='mt-2'>
            <Input
              ref={imagesRef}
              id='images'
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={handleImagesChange}
            />
            <div
              role='button'
              tabIndex={0}
              onClick={() => imagesRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  imagesRef.current?.click();
              }}
              className='flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-600 hover:bg-gray-50'
            >
              <ImageIcon size={18} />
              <span className='text-sm font-medium'>
                {imagesPreviews.length > 0
                  ? 'Change images'
                  : 'Click to upload images'}
              </span>
              <span className='text-xs text-gray-500'>
                Add more photos from your trip (optional)
              </span>
            </div>
            {imagesPreviews.length > 0 && (
              <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
                {imagesPreviews.map((img, idx) => (
                  <div key={idx} className='relative'>
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className='h-24 w-full rounded-md object-cover'
                    />
                    <button
                      type='button'
                      className='absolute right-1 top-1 rounded-full bg-black bg-opacity-50 p-1 text-white hover:bg-opacity-70'
                      onClick={() => handleRemoveImage(idx)}
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Privacy */}
        <div className='rounded-xl border bg-gray-50 p-5 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='flex items-center gap-2 text-base font-medium'>
                {formState.privacy === 'public' ? (
                  <>
                    <Globe size={16} /> Public Post
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Private Post
                  </>
                )}
              </h3>
              <p className='mt-1 text-xs text-gray-600'>
                {formState.privacy === 'public'
                  ? 'Visible to everyone'
                  : 'Only visible to you'}
              </p>
            </div>
            <label className='inline-flex cursor-pointer items-center'>
              <input
                id='privacy'
                type='checkbox'
                className='sr-only'
                checked={formState.privacy === 'public'}
                onChange={handlePrivacyChange}
              />
              <div
                className={`relative h-6 w-11 rounded-full transition-colors ${formState.privacy === 'public' ? 'bg-black' : 'bg-gray-400'}`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${formState.privacy === 'public' ? 'translate-x-5' : ''}`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className='sticky bottom-0 z-10 rounded-xl border bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-end gap-3'>
            <Button
              type='submit'
              className='bg-black text-white hover:bg-gray-800'
              disabled={isLoading}
            >
              {isLoading ? (
                'Saving...'
              ) : editMode ? (
                'Update Post'
              ) : (
                'Publish Post'
              )}
            </Button>
          </div>
        </div>
      </form>

      <TagPlanModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onSelect={(plan) => setFormState({ ...formState, relatedPlan: plan })}
      />
    </div>
  );
}
