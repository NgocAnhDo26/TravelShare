import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { X } from 'lucide-react';
import API from '@/utils/axiosInstance';

type Privacy = 'public' | 'private';

interface FormState {
  title: string;
  content: string;
  privacy: Privacy;
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
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  // Add new state variables to store actual file objects
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Refs for file inputs
  const coverImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);


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

  // Improved submit handler with better error messages
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create validation errors directly to avoid state timing issues
    const validationErrors: FormErrors = {};
    
    // Check title length
    if (!formState.title) {
      validationErrors.title = 'Please enter a title for your post.';
    } else if (formState.title.length < 5) {
      validationErrors.title = 'Title must be at least 5 characters long.';
    }
    
    // Check content length - strip HTML tags for accurate character count
    const textContent = formState.content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      validationErrors.content = 'Please add some content to your post.';
    } else if (textContent.length < 10) {
      validationErrors.content = 'Content must be at least 10 characters long.';
    }
    
    // Update the errors state
    setErrors(validationErrors);
    
    // Show toast notifications for validation errors
    if (Object.keys(validationErrors).length > 0) {
      // If multiple errors, show a summary toast
      if (validationErrors.title && validationErrors.content) {
        toast.error('Please fix the errors in your post before publishing.', {
          duration: 4000,
        });
      } 
      // Show specific toasts for each type of error
      else if (validationErrors.title) {
        toast.error(validationErrors.title, {
          icon: '📝',
          duration: 3000,
        });
      } 
      else if (validationErrors.content) {
        toast.error(validationErrors.content, {
          icon: '📄',
          duration: 3000,
        });
      }
      return; // Stop form submission
    }
    
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
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      // Show a loading toast while submitting
      const loadingToast = toast.loading('Creating your post...');

      API.post('/posts/create', formData)
        .then((response) => {
          // Dismiss the loading toast
          toast.dismiss(loadingToast);
          toast.success('Post created successfully! 🎉', {
            duration: 4000,
            icon: '✅'
          });
          console.log('Post created:', response.data);
          // Reset all form state
          setFormState({
            title: '',
            content: '<p></p>', // Reset to empty HTML paragraph
            privacy: 'public',
          });
          setCoverImagePreview(null);
          setImagesPreviews([]);
          setCoverImageFile(null);
          setImageFiles([]);
        })
        .catch((error) => {
          // Dismiss the loading toast
          toast.dismiss(loadingToast);
          if (error.response?.data?.error) {
            toast.error(`Error: ${error.response.data.error}`, {
              duration: 4000,
            });
          } else {
            toast.error('Failed to create post. Please try again.', {
              duration: 4000,
            });
          }
          console.error('Error creating post:', error);
        });
    } catch (error) {
      toast.error('Something went wrong. Please try again.', {
        duration: 4000,
      });
      console.error('Error in handleSubmit:', error);
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
      
      // Keep track of loaded images to update state only once all are loaded
      let loadedCount = 0;
      
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newPreviews.push(result);
          loadedCount++;
          
          // When all previews are ready, update the state
          if (loadedCount === filesArray.length) {
            setImagesPreviews([...newPreviews]);
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
  };

  // Fixed to remove image from both previews and files arrays
  const handleRemoveImage = (indexToRemove: number) => {
    // Remove from previews
    const updatedPreviews = imagesPreviews.filter(
      (_, index) => index !== indexToRemove,
    );
    setImagesPreviews(updatedPreviews);

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
          Publish Post
        </Button>
      </form>
    </div>
  );
}
