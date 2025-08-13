import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import { Menu, Transition } from '@headlessui/react';
import { useBookmarks } from '@/context/BookmarkContext';

// --- Type Definitions ---
interface Author {
  _id: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
}
interface Trip {
  _id: string;
  title: string;
  destination: { name?: string };
  startDate?: string;
  endDate?: string;
  author: Author;
  coverImageUrl?: string;
}
interface Post {
  _id: string;
  content: string;
  imageUrl?: string;
  author: Author;
}
type BookmarkTarget = Trip | Post;
interface Bookmark {
  _id: string;
  onModel: 'TravelPlan' | 'Post';
  target: BookmarkTarget;
  createdAt: string;
}

// --- Component Prop Types ---
interface FeedPlanProps {
  plan: Trip;
  onRemove: (targetId: string) => void;
}
interface PostItemProps {
  post: Post;
  onRemove: (targetId: string) => void;
}
interface ItemMenuProps {
  onRemove: () => void;
}

const calculateDuration = (startDateStr?: string, endDateStr?: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

const ItemMenu = ({ onRemove }: ItemMenuProps) => (
    <Menu as="div" className="relative flex-shrink-0">
      <Menu.Button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
      </Menu.Button>
      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({ active }) => (
                <button onClick={onRemove} className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  Remove from saved
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
);

const FeedPlan = ({ plan, onRemove }: FeedPlanProps) => {
  const duration = calculateDuration(plan.startDate, plan.endDate);
  return (
    <div className="flex items-start gap-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
      <Link to={`/plans/${plan._id}`} className="flex-shrink-0">
        <div className="w-48 h-28 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            src={plan.coverImageUrl} 
            alt={plan.title} 
            className="w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0 text-left">
        <Link to={`/plans/${plan._id}`} className="block">
          <h3 className="text-md font-bold text-gray-900 dark:text-white truncate hover:underline">{plan.title}</h3>
        </Link>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span>By </span>
          <Link to={`/profile/${plan.author._id}`} className="font-medium hover:underline text-gray-700 dark:text-gray-300">{plan.author?.displayName || 'Anonymous'}</Link>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {duration > 0 ? `${duration} days` : ''}
        </div>
      </div>
      <ItemMenu onRemove={() => onRemove(plan._id)} />
    </div>
  );
};

const PostItem = ({ post, onRemove }: PostItemProps) => (
    <div className="flex items-start gap-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
      <Link to={`/posts/${post._id}`} className="flex-shrink-0">
        <div className="w-48 h-28 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0 text-left">
        <Link to={`/posts/${post._id}`} className="block">
            <p className="text-md font-bold text-gray-900 dark:text-white truncate hover:underline">{post.content}</p>
        </Link>
         <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span>By </span>
          <Link to={`/profile/${post.author._id}`} className="font-medium hover:underline text-gray-700 dark:text-gray-300">{post.author?.displayName || 'Anonymous'}</Link>
        </div>
      </div>
      <ItemMenu onRemove={() => onRemove(post._id)} />
    </div>
);

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'plans' | 'posts'>('all');
  
  const { bookmarkedIds, toggleBookmark, isLoading: isContextLoading } = useBookmarks();

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(`/bookmarks/me`);
      setBookmarks(response.data.bookmarks || []);
    } catch (err: unknown) {
      console.error("Failed to fetch bookmarks:", err);
      setError("An unknown error occurred while loading saved items.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRemoveBookmark = async (targetId: string) => {
    const bookmarkToRemove = bookmarks.find(b => b.target._id === targetId);
    if (!bookmarkToRemove) return;

    setBookmarks(prev => prev.filter(b => b.target._id !== targetId));
    
    await toggleBookmark(targetId, bookmarkToRemove.onModel);
  };
  
  const filteredBookmarks = !isContextLoading 
    ? bookmarks
        .filter(b => bookmarkedIds.has(b.target._id))
        .filter(b => {
          if (activeFilter === 'all') return true;
          if (activeFilter === 'plans') return b.onModel === 'TravelPlan';
          if (activeFilter === 'posts') return b.onModel === 'Post';
          return false;
        })
    : [];

  const Sidebar = () => (
    <aside className="w-full md:w-1/4 lg:w-1/5 xl:w-1/6">
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Saved Items</h2>
            <nav className="flex flex-col space-y-2">
                <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 text-left rounded-md transition-colors duration-200 ${activeFilter === 'all' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>All</button>
                <button onClick={() => setActiveFilter('plans')} className={`px-4 py-2 text-left rounded-md transition-colors duration-200 ${activeFilter === 'plans' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Plans</button>
                <button onClick={() => setActiveFilter('posts')} className={`px-4 py-2 text-left rounded-md transition-colors duration-200 ${activeFilter === 'posts' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Posts</button>
            </nav>
        </div>
    </aside>
  );

  const showLoading = isLoading || isContextLoading;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-8 md:items-start">
          <Sidebar />
          <main className="w-full md:w-3/4 lg:w-4/5 xl:w-5/6">
            <div className="flex flex-col gap-4">
              {showLoading ? (
                <div className='text-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div><p className='text-gray-500 dark:text-gray-400'>Loading Saved Items...</p></div>
              ) : error ? (
                <div className='text-center py-12 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg'><p className='text-red-600 dark:text-red-400 font-semibold'>{error}</p></div>
              ) : filteredBookmarks.length > 0 ? (
                filteredBookmarks.map(item => {
                  if (item.onModel === 'TravelPlan' && item.target) {
                    return <FeedPlan key={item._id} plan={item.target as Trip} onRemove={handleRemoveBookmark} />;
                  }
                  if (item.onModel === 'Post' && item.target) {
                    return <PostItem key={item._id} post={item.target as Post} onRemove={handleRemoveBookmark} />;
                  }
                  return null;
                })
              ) : (
                <div className='text-center py-12 bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg'><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Nothing here yet</h3><p className='text-gray-500 dark:text-gray-400 mt-2'>Start saving plans and posts to see them here.</p></div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BookmarksPage;
