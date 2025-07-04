import React, { useState, useEffect } from 'react';
import { AuthContext, type User } from './AuthContext';
import API from '@/utils/axiosInstance';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setUser(null);
    // You might want to call a logout API endpoint here
    // API.post('/auth/logout');
  };

  // This effect runs only once when the component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // The browser automatically sends the HttpOnly cookie
        const response = await API.post('/auth/verify-token');

        if (response.status === 200) {
          const data = response.data;
          console.log('Auth verification successful:', data);
          // The server returns user data directly, not nested under a 'user' property
          setUser({
            userId: data.userId,
            username: data.username,
            avatarUrl: data.avatarUrl
          });
        } else {
          // The API returned an error (e.g., 401), so user is not logged in
          setUser(null);
        }
      } catch (error) {
        // Network error or other issues
        console.error("Failed to fetch auth status:", error);
        setUser(null);
      } finally {
        // We are done checking, so set loading to false
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // The empty dependency array ensures this runs only once on mount

  const value = { user, isLoading, logout };
  
  // Debug log when user state changes
  console.log('AuthProvider state:', { user, isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};