import { useState, useEffect } from 'react';
import { getCurrentUser } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();

    const hubListener = Hub.listen('auth', ({ payload: { event } }) => {
      if (event === 'signedIn' || event === 'signedOut') {
        checkAuth();
      }
    });

    return () => hubListener();
  }, []);

  return isAuthenticated;
}