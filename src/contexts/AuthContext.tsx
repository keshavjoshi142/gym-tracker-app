import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { StorageService } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth called, context:', context);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider - context is undefined');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider rendering...');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect called');
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔑 Checking authentication state...');
      
      // First check if we have a stored token
      const ApiService = (await import('@/utils/api')).default;
      const hasToken = await ApiService.hasAuthToken();
      
      if (!hasToken) {
        console.log('❌ No auth token found, user not authenticated');
        // Clear any stored user data if no token exists
        await StorageService.logoutUser();
        setUser(null);
        return;
      }
      
      console.log('🔑 Token found, checking user data...');
      const currentUser = await StorageService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ User found in storage:', currentUser.username);
        // Verify token is still valid by making an API call
        try {
          const userProfile = await ApiService.getCurrentUser();
          if (userProfile.user) {
            console.log('✅ Token is valid, user authenticated');
            setUser(currentUser);
          } else {
            console.log('⚠️ Token invalid, clearing user');
            await StorageService.logoutUser();
            setUser(null);
          }
        } catch (error) {
          console.log('⚠️ Failed to verify token, clearing authentication:', error.message);
          // If token verification fails, logout the user
          await StorageService.logoutUser();
          setUser(null);
        }
      } else {
        console.log('❌ No user found in storage despite having token, clearing token');
        await ApiService.clearAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔑 Attempting login for:', username);
      const user = await StorageService.loginUser(username, password);
      if (user) {
        console.log('✅ Login successful:', user.username);
        setUser(user);
        return true;
      }
      console.log('❌ Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, email?: string): Promise<boolean> => {
    console.log('🔑 Attempting registration for:', username);
    try {
      setLoading(true);
      const user = await StorageService.registerUser(username, password, email);
      if (user) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout process...');
      setLoading(true);
      await StorageService.logoutUser();
      setUser(null);
      console.log('✅ Logout successful, user state cleared');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: user !== null,
  };

  console.log('AuthProvider providing value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};