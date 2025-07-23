import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react"; // Add this import for the X icon

type Privacy = 'public' | 'private';

interface FormState {
  title: string;
  content: string;
  coverImage?: string;
  images?: string[];
  privacy: Privacy;
}

interface FormErrors {
  title?: string;
  content?: string;
}

export default function PostEditor() {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    content: "",
    privacy: "public",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  
  // Refs for file inputs
  const coverImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formState.title || formState.title.length < 2) {
      newErrors.title = "Title must be at least 2 characters.";
    }
    
    if (!formState.content || formState.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState({
      ...formState,
      [field]: value
    });
    
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field]: undefined
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      toast.success("Your post has been saved.");
      console.log(formState);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImagePreview(result);
        setFormState({
          ...formState,
          coverImage: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: string[] = [];
      const urls: string[] = [];
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newPreviews.push(result);
          urls.push(result);
          
          if (newPreviews.length === files.length) {
            setImagesPreviews(newPreviews);
            setFormState({
              ...formState,
              images: urls
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      privacy: e.target.checked ? 'public' : 'private'
    });
  };

  // Add these new handler methods
  const handleRemoveCoverImage = () => {
    setCoverImagePreview(null);
    setFormState({
      ...formState,
      coverImage: undefined
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedPreviews = imagesPreviews.filter((_, index) => index !== indexToRemove);
    setImagesPreviews(updatedPreviews);
    
    const updatedImages = formState.images?.filter((_, index) => index !== indexToRemove);
    setFormState({
      ...formState,
      images: updatedImages
    });
  };

  return (
    <div className="max-w-6xl w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* TITLE */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">Title</label>
          <div className="mt-1">
            <Input 
              id="title"
              className="focus-visible:ring-black"
              placeholder="My amazing journey..." 
              value={formState.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Create a catchy title for your travel post.
          </p>
          {errors.title && <p className="text-xs text-gray-900">{errors.title}</p>}
        </div>
        
        {/* CONTENT */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium">Content</label>
          <div className="mt-1">
            <Textarea 
              id="content"
              className="min-h-32 focus-visible:ring-black"
              placeholder="Tell us about your adventure..." 
              value={formState.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Describe your travel experience in detail.
          </p>
          {errors.content && <p className="text-xs text-gray-900">{errors.content}</p>}
        </div>
        
        {/* COVER IMAGE */}
        <div className="space-y-2">
          <label htmlFor="coverImage" className="block text-sm font-medium">Cover Image</label>
          <div className="mt-1">
            <div className="flex flex-col gap-2">
              {/* Hidden file input */}
              <Input 
                ref={coverImageRef}
                id="coverImage"
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageChange}
              />
              {/* Custom file input button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-gray-300 hover:bg-gray-50"
                onClick={() => coverImageRef.current?.click()}
              >
                {coverImagePreview ? "Change cover image" : "Select cover image"}
              </Button>
              {coverImagePreview && (
                <div className="mt-2 relative">
                  <img 
                    src={coverImagePreview} 
                    alt="Cover preview" 
                    className="max-h-40 rounded-md object-cover w-full"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70 transition-all"
                    onClick={handleRemoveCoverImage}
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Choose a beautiful cover image for your post.
          </p>
        </div>

        {/* ADDITIONAL IMAGES */}
        <div className="space-y-2">
          <label htmlFor="images" className="block text-sm font-medium">Additional Images</label>
          <div className="mt-1">
            <div className="flex flex-col gap-2">
              {/* Hidden file input */}
              <Input 
                ref={imagesRef}
                id="images"
                type="file" 
                accept="image/*" 
                multiple
                className="hidden"
                onChange={handleImagesChange}
              />
              {/* Custom file input button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-gray-300 hover:bg-gray-50"
                onClick={() => imagesRef.current?.click()}
              >
                {imagesPreviews.length > 0 ? "Change images" : "Select additional images"}
              </Button>
              {imagesPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imagesPreviews.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`Preview ${idx}`} 
                        className="h-24 w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70 transition-all"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Add more photos from your trip (optional).
          </p>
        </div>

        {/* PUBLICITY TOGGLE - Compact Design */}
        <div className="flex flex-row items-center w-lg mx-auto space-x-4 rounded-lg border p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex-grow">
            <h3 className="text-base font-medium">
              {formState.privacy === 'public' ? 'Public Post' : 'Private Post'}
            </h3>
            <p className="text-xs text-gray-500">
              {formState.privacy === 'public' 
                ? "Visible to everyone" 
                : "Only visible to you"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              {formState.privacy === 'public' ? 'Public' : 'Private'}
            </span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                id="privacy"
                type="checkbox"
                className="sr-only"
                checked={formState.privacy === 'public'}
                onChange={(e) => handlePrivacyChange(e)}
              />
              <div className={`relative w-10 h-5 rounded-full transition-colors ${
                formState.privacy === 'public' ? 'bg-black' : 'bg-gray-400'
              }`}>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                  formState.privacy === 'public' ? 'translate-x-5' : ''
                }`}></div>
              </div>
            </label>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          Submit Post
        </Button>
      </form>
    </div>
  );
}

