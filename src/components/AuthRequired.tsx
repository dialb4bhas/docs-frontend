import { signInWithRedirect } from '@aws-amplify/auth';
import { useLocation } from 'react-router-dom';
import GoogleButton from './GoogleButton';

interface AuthRequiredProps {
  title: string;
  message: string;
}

export default function AuthRequired({ title, message }: AuthRequiredProps) {
  const location = useLocation();

  const handleSignIn = () => {
    sessionStorage.setItem('returnTo', location.pathname + location.search);
    signInWithRedirect({ provider: 'Google' });
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="mb-6">{message}</p>
        <GoogleButton onClick={handleSignIn} />
      </div>
    </div>
  );
}