import RegisterPage from './route/register/page';
import LoginPage from './route/login/page';
import ForgotPasswordPage from './route/forgot-password/page';
import ResetPasswordPage from './route/reset-password/page';
import UserProfilePage from './route/UserProfilePage/page';
import TripPlanningPage from './route/trip-planning/page';
import PlanEditorPage from './route/PlanEditorPage/page';
import ItineraryPage from './route/itinerary/page';
import MainPage from './route/main/page';
import SearchPage from './route/search/page';
import NotFound from './utils/404';
import { Toaster } from 'react-hot-toast';
import { BookmarkProvider } from './context/BookmarkContext';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { SocketProvider } from './context/SocketProvider';
import ProtectedRoute from './components/ProtectedRoute';
import FeedLayout from './components/SidebarLayout/FeedLayout';
import PostEditor from './components/PostEditor';
import DiscoverPage from './route/DiscoverPage/page';
import PostDetailsPage from './route/PostDetailsPage/page';
import NotificationPage from './route/notifications/page';
import BookmarksPage from './route/BookmarksPage/page';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <BookmarkProvider>
            <div>
              <Toaster />
            </div>

            <Routes>
              <Route path='/' element={<FeedLayout />}>
                {/* Public routes */}
                <Route index element={<MainPage />} />
                <Route path='register' element={<RegisterPage />} />
                <Route path='login' element={<LoginPage />} />
                <Route
                  path='forgot-password'
                  element={<ForgotPasswordPage />}
                />
                <Route path='reset-password' element={<ResetPasswordPage />} />
                <Route
                  path='plans/:planId'
                  element={<PlanEditorPage editMode={false} />}
                />
                <Route path='/explore' element={<DiscoverPage />} />
                <Route path='/search' element={<SearchPage />} />
                <Route path='/posts/:postId' element={<PostDetailsPage />} />
                <Route path='/profile/:userId' element={<UserProfilePage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path='profile/:userId' element={<UserProfilePage />} />
                  <Route path='plans/create' element={<TripPlanningPage />} />
                  <Route path='profile' element={<UserProfilePage />} />
                  <Route
                    path='plans/:planId/edit'
                    element={<PlanEditorPage editMode={true} />}
                  />
                  <Route path='notifications' element={<NotificationPage />} />
                  <Route path='itinerary' element={<ItineraryPage />} />
                  <Route path='/posts/create' element={<PostEditor />} />
                  <Route
                    path='/posts/:postId/edit'
                    element={<PostEditor editMode={true} />}
                  />
                  <Route path='test' element={<PostDetailsPage />} />
                  <Route path='bookmarks' element={<BookmarksPage />} />
                </Route>

                <Route path='*' element={<NotFound />} />
              </Route>
            </Routes>
          </BookmarkProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
