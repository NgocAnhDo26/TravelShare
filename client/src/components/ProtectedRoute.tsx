import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  // 1. While we're checking the auth status, show a loading indicator
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 2. If loading is finished and there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished and user exists, render the child route
  return <Outlet />;
};

export default ProtectedRoute;