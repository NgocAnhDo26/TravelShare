import RegisterPage from './route/register/page';
import LoginPage from './route/login/page';
import ForgotPasswordPage from './route/forgot-password/page';
import ResetPasswordPage from './route/reset-password/page';
import UserProfilePage from './route/UserProfilePage/page';
import OtherProfilePage from './route/OtherProfilePage/page';
import TripPlanningPage from './route/trip-planning/page';
import PlanEditorPage from './route/PlanEditorPage/page';
import ItineraryPage from './route/itinerary/page';
import AddItineraryPage from './route/add-itinerary/page';
import EditItineraryPage from './route/edit-itinerary/page';
import NotFound from './utils/404';
import { Toaster } from 'react-hot-toast';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlobalNavigation from './components/navigation';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <GlobalNavigation />
          <div>
            <Toaster />
          </div>

          <Routes>
            {/* Public routes */}
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/' element={<ItineraryPage />} />
              <Route path='/profile' element={<UserProfilePage />}>
                <Route index element={<UserProfilePage />} />
                <Route path=':userId' element={<UserProfilePage />} />
              </Route>
              <Route
                path='/other-profile/:userId'
                element={<OtherProfilePage />}
              />
              <Route
                path='/plans/:id'
                element={<PlanEditorPage editMode={false} />}
              />
              <Route path='/plan/create' element={<TripPlanningPage />} />
              <Route path='/itinerary' element={<ItineraryPage />} />
              <Route path='/itinerary/add' element={<AddItineraryPage />} />
              <Route path='/itinerary/edit' element={<EditItineraryPage />} />
              <Route path='/test' element={<ItineraryPage />} />
            </Route>

            <Route path='*' element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;