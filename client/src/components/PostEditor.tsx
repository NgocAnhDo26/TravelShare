import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { X } from 'lucide-react';
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

export default function PostEditor() {
  const [formState, setFormState] = useState<FormState>({
    title: '',
    content: '<p></p>', // Initialize with empty HTML paragraph
    privacy: 'public',
    relatedPlan: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  // Add new state variables to store actual file objects
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Refs for file inputs
  const coverImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  // Updated validation function for rich text content
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.title || formState.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    }

    // Check if content is empty (accounting for HTML tags)
    const textContent = formState.content.replace(/<[^>]*>/g, '').trim();
    if (!formState.content || textContent.length < 10) {
      newErrors.content = 'Content must be at least 10 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Existing handleInputChange function remains unchanged
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState({
      ...formState,
      [field]: value,
    });

    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  // Updated submit handler with logging statements removed
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Create a FormData object for multipart/form-data submission
        const formData = new FormData();

        // Add text fields
        formData.append('title', formState.title);
        formData.append('content', formState.content);
        formData.append('privacy', formState.privacy);

        // Add the cover image file if it exists
        if (coverImageFile) {
          formData.append('coverImage', coverImageFile);
        }

        // Add all image files if they exist
        if (imageFiles && imageFiles.length > 0) {
          imageFiles.forEach((file) => {
            formData.append('images', file);
          });
        }

        // Add related plan if selected
        if (formState.relatedPlan?._id) {
          formData.append('relatedPlan', formState.relatedPlan._id);
        }

        API.post('/posts/create', formData)
          .then((response) => {
            toast.success('Post created successfully!');
            console.log('Post created:', response.data);
            // Reset all form state
            setFormState({
              title: '',
              content: '<p></p>', // Reset to empty HTML paragraph
              privacy: 'public',
              relatedPlan: null,
            });
            setCoverImagePreview(null);
            setImagesPreviews([]);
            setCoverImageFile(null);
            setImageFiles([]);
          })
          .catch((error) => {
            toast.error('Failed to create post. Please try again.');
            console.error('Error creating post:', error);
          });
      } catch (error) {
        toast.error('Something went wrong. Please try again.');
        console.error('Error in handleSubmit:', error);
      }
    } else {
      toast.error('Please fix the errors in the form.');
    }
  };

  // Updated handleCoverImageChange - Fix the state reference issue
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the actual file object
      setCoverImageFile(file);

      // Generate preview as before
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImagePreview(result);
        // Don't set file in formState, we already have coverImageFile state
      };
      reader.readAsDataURL(file);
    }
  };

  // Updated handleImagesChange - Fix the state handling
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Store the actual file objects
      const filesArray = Array.from(files);
      setImageFiles(filesArray);

      // Generate previews as before
      const newPreviews: string[] = [];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newPreviews.push(result);

          // When all previews are ready, update the state
          if (newPreviews.length === filesArray.length) {
            setImagesPreviews(newPreviews);
            // Don't set files in formState, we already have imageFiles state
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Updated to clear both file and preview
  const handleRemoveCoverImage = () => {
    setCoverImagePreview(null);
    setCoverImageFile(null);
    setFormState({
      ...formState,
      coverImage: undefined,
    });
  };

  // Updated to remove both file and preview
  const handleRemoveImage = (indexToRemove: number) => {
    // Remove from previews
    const updatedPreviews = imagesPreviews.filter(
      (_, index) => index !== indexToRemove,
    );
    setImagesPreviews(updatedPreviews);

    // Remove from form state
    const updatedImages = formState.images?.filter(
      (_, index) => index !== indexToRemove,
    );
    setFormState({
      ...formState,
      images: updatedImages,
    });

    // Remove from file objects array
    const updatedFiles = imageFiles.filter(
      (_, index) => index !== indexToRemove,
    );
    setImageFiles(updatedFiles);
  };

  // Existing handlePrivacyChange function remains unchanged
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      privacy: e.target.checked ? 'public' : 'private',
    });
  };

  return (
    <div className='max-w-6xl w-3xl mx-auto p-6 bg-white rounded-lg shadow'>
      <h2 className='text-2xl font-bold mb-6'>Create New Post</h2>
      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* TITLE */}
        <div className='space-y-2'>
          <label htmlFor='title' className='block text-sm font-medium'>
            Title
          </label>
          <div className='mt-1'>
            <Input
              id='title'
              className='focus-visible:ring-black'
              placeholder='My amazing journey...'
              value={formState.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          <p className='text-xs text-gray-500'>
            Create a catchy title for your travel post.
          </p>
          {errors.title && (
            <p className='text-xs text-gray-900'>{errors.title}</p>
          )}
        </div>

        {/* TAG PLAN */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium'>Gắn thẻ Kế hoạch</label>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setTagModalOpen(true)}
            >
              {formState.relatedPlan ? 'Đổi kế hoạch' : 'Gắn thẻ Kế hoạch'}
            </Button>
            {formState.relatedPlan && (
              <div className='flex items-center gap-2 rounded border px-2 py-1 text-sm'>
                <span className='font-medium'>
                  {formState.relatedPlan.title}
                </span>
                <span className='text-gray-500'>
                  · {formState.relatedPlan.author?.displayName || 'Ẩn danh'}
                </span>
                <button
                  type='button'
                  className='ml-2 hover:text-red-600'
                  onClick={() =>
                    setFormState({ ...formState, relatedPlan: null })
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <p className='text-xs text-gray-500'>
            Kết nối bài viết với một lịch trình để thêm ngữ cảnh.
          </p>
        </div>

        {/* CONTENT */}
        <div className='space-y-2'>
          <label htmlFor='content' className='block text-sm font-medium'>
            Content
          </label>
          <div className='mt-1'>
            <RichTextEditor
              content={formState.content}
              onChange={(content) => handleInputChange('content', content)}
              placeholder='Tell us about your adventure...'
              className='min-h-[200px]'
            />
          </div>
          <p className='text-xs text-gray-500'>
            Describe your travel experience in detail.
          </p>
          {errors.content && (
            <p className='text-xs text-gray-900'>{errors.content}</p>
          )}
        </div>

        {/* COVER IMAGE */}
        <div className='space-y-2'>
          <label htmlFor='coverImage' className='block text-sm font-medium'>
            Cover Image
          </label>
          <div className='mt-1'>
            <div className='flex flex-col gap-2'>
              {/* Hidden file input */}
              <Input
                ref={coverImageRef}
                id='coverImage'
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleCoverImageChange}
              />
              {/* Custom file input button */}
              <Button
                type='button'
                variant='outline'
                className='w-full border-dashed border-gray-300 hover:bg-gray-50'
                onClick={() => coverImageRef.current?.click()}
              >
                {coverImagePreview
                  ? 'Change cover image'
                  : 'Select cover image'}
              </Button>
              {coverImagePreview && (
                <div className='mt-2 relative'>
                  <img
                    src={coverImagePreview}
                    alt='Cover preview'
                    className='max-h-40 rounded-md object-cover w-full'
                  />
                  <button
                    type='button'
                    className='absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70 transition-all'
                    onClick={handleRemoveCoverImage}
                  >
                    <X size={16} className='text-white' />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className='text-xs text-gray-500'>
            Choose a beautiful cover image for your post.
          </p>
        </div>

        {/* ADDITIONAL IMAGES */}
        <div className='space-y-2'>
          <label htmlFor='images' className='block text-sm font-medium'>
            Additional Images
          </label>
          <div className='mt-1'>
            <div className='flex flex-col gap-2'>
              {/* Hidden file input */}
              <Input
                ref={imagesRef}
                id='images'
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={handleImagesChange}
              />
              {/* Custom file input button */}
              <Button
                type='button'
                variant='outline'
                className='w-full border-dashed border-gray-300 hover:bg-gray-50'
                onClick={() => imagesRef.current?.click()}
              >
                {imagesPreviews.length > 0
                  ? 'Change images'
                  : 'Select additional images'}
              </Button>
              {imagesPreviews.length > 0 && (
                <div className='grid grid-cols-4 gap-2 mt-2'>
                  {imagesPreviews.map((img, idx) => (
                    <div key={idx} className='relative'>
                      <img
                        src={img}
                        alt={`Preview ${idx}`}
                        className='h-24 w-full rounded-md object-cover'
                      />
                      <button
                        type='button'
                        className='absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70 transition-all'
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <X size={16} className='text-white' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className='text-xs text-gray-500'>
            Add more photos from your trip (optional).
          </p>
        </div>

        {/* PUBLICITY TOGGLE - Compact Design */}
        <div className='flex flex-row items-center w-lg mx-auto space-x-4 rounded-lg border p-4 bg-gray-50 hover:bg-gray-100 transition-colors'>
          <div className='flex-grow'>
            <h3 className='text-base font-medium'>
              {formState.privacy === 'public' ? 'Public Post' : 'Private Post'}
            </h3>
            <p className='text-xs text-gray-500'>
              {formState.privacy === 'public'
                ? 'Visible to everyone'
                : 'Only visible to you'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-medium text-gray-700'>
              {formState.privacy === 'public' ? 'Public' : 'Private'}
            </span>
            <label className='inline-flex items-center cursor-pointer'>
              <input
                id='privacy'
                type='checkbox'
                className='sr-only'
                checked={formState.privacy === 'public'}
                onChange={(e) => handlePrivacyChange(e)}
              />
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  formState.privacy === 'public' ? 'bg-black' : 'bg-gray-400'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                    formState.privacy === 'public' ? 'translate-x-5' : ''
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>

        <Button
          type='submit'
          className='w-full bg-black hover:bg-gray-800 text-white'
        >
          Submit Post
        </Button>
      </form>
      <TagPlanModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onSelect={(plan) => setFormState({ ...formState, relatedPlan: plan })}
      />
    </div>
  );
}
