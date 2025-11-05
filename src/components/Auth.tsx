import { useState, useEffect } from 'react';
import { fetchUserAttributes, signInWithRedirect, signOut, fetchAuthSession } from '@aws-amplify/auth';
import { useAuth } from '../hooks/useAuth';
import GoogleButton from './GoogleButton';

export default function AuthComponent() {
  const isAuthenticated = useAuth();
  const [userName, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      if (isAuthenticated) {
        try {
          const session = await fetchAuthSession();
          if (session.tokens) {
            const userAttributes = await fetchUserAttributes();
            setUserEmail(userAttributes.given_name || 'User');
          } else {
            setUserEmail('User');
          }
        } catch (error) {
          console.log('Error fetching user info:', error);
          setUserEmail('User');
        }
      } else {
        setUserEmail(null);
      }
    };
    getUserInfo();
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div className="bg-gray-900 flex flex-col items-center gap-1">
          <span className="text-sm text-gray-300">Hi {userName}!</span>
          <button 
            onClick={() => signOut({ global: true })}
            className="text-xs text-gray-400 hover:text-gray-300 underline"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <GoogleButton onClick={() => signInWithRedirect({ provider: 'Google' })} />
        </div>
      )}
    </div>
  );
}