import { createContext, useContext } from 'react';

// Define the shape of the user object
export interface User {
  userId: string;
  username: string;
  avatarUrl?: string;
}

// Define the shape of the context value
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true, // Start in a loading state
  logout: () => {},
});

// Custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};