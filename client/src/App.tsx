import RegisterPage from './route/register/page';
import LoginPage from './route/login/page';
import ForgotPasswordPage from './route/forgot-password/page';
import ResetPasswordPage from './route/reset-password/page';
import UserProfilePage from './route/UserProfilePage/page';
import OtherProfilePage from './route/OtherProfilePage/page';
import TripPlanningPage from './route/trip-planning/page';
import PlanEditorPage from './route/PlanEditorPage/page';
import ItineraryPage from './route/itinerary/page';
import MainPage from './route/main/page';
import NotFound from './utils/404';
import { Toaster } from 'react-hot-toast';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import FeedLayout from './components/SidebarLayout/FeedLayout';
import DiscoverPage from './route/DiscoverPage/page';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div>
          <Toaster />
        </div>

        <Routes>
          <Route path='/' element={<FeedLayout />}>
            {/* Public routes */}
            <Route index element={<MainPage />} />
            <Route path='register' element={<RegisterPage />} />
            <Route path='login' element={<LoginPage />} />
            <Route path='forgot-password' element={<ForgotPasswordPage />} />
            <Route path='reset-password' element={<ResetPasswordPage />} />
            <Route
              path='plans/:planId'
              element={<PlanEditorPage editMode={false} />}
            />
            <Route path='/explore' element={<DiscoverPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='profile' element={<UserProfilePage />}>
                <Route index element={<UserProfilePage />} />
                <Route path=':userId' element={<UserProfilePage />} />
              </Route>
              <Route
                path='other-profile/:userId'
                element={<OtherProfilePage />}
              />
              <Route path='plans/create' element={<TripPlanningPage />} />
              <Route
                path='plans/:planId/edit'
                element={<PlanEditorPage editMode={true} />}
              />
              <Route path='itinerary' element={<ItineraryPage />} />
              <Route path='test' element={<ItineraryPage />} />
            </Route>

            <Route path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
