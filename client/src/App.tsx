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
// import FavoritesPage from './route/favorites/page'; // Remove static import
import NotFound from './utils/404';
import { Toaster } from 'react-hot-toast';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlobalNavigation from './components/navigation';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import React from 'react';

// Lazy import FavoritesPage
const FavoritesPage = React.lazy(() => import('./route/favorites/page'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalNavigation />
        <div>
          <Toaster />
        </div>

        <Routes>
          {/* Public routes */}
          <Route path='/' element={<MainPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path='/profile' element={<UserProfilePage />}>
              <Route index element={<UserProfilePage />} />
              <Route path=':userId' element={<UserProfilePage />} />
            </Route>
            <Route path='/favorites' element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <FavoritesPage />
              </React.Suspense>
            } />
            <Route
              path='/other-profile/:userId'
              element={<OtherProfilePage />}
            />
            <Route path='/plans/create' element={<TripPlanningPage />} />
            <Route
              path='/plans/:planId'
              element={<PlanEditorPage editMode={false} />}
            />
            <Route
              path='/plans/:planId/edit'
              element={<PlanEditorPage editMode={true} />}
            />
            <Route path='/itinerary' element={<ItineraryPage />} />
            <Route path='/test' element={<ItineraryPage />} />
          </Route>

          <Route path='*' element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
