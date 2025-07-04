import RegisterPage from './route/register/page';
import LoginPage from './route/login/page';
import ForgotPasswordPage from './route/forgot-password/page';
import ResetPasswordPage from './route/reset-password/page';
import UserProfilePage from './route/UserProfilePage/page';
import OtherProfilePage from './route/OtherProfilePage/page';
import { Toaster } from 'react-hot-toast';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlobalNavigation from './components/navigation';
import { AuthProvider } from './context/AuthProvider';

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
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route
              path='/reset-password'
              element={<ResetPasswordPage />}
            ></Route>
            <Route path='/profile' element={<UserProfilePage />}>
              <Route index element={<UserProfilePage />} />
              <Route path=':userId' element={<UserProfilePage />} />
            </Route>
            <Route
              path='/other-profile/:userId'
              element={<OtherProfilePage />}
            />
            <Route path='/' element={<LoginPage />} />
            <Route path='*' element={<div>404 Not Found</div>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
