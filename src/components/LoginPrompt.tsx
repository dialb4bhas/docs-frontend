import { signInWithRedirect } from '@aws-amplify/auth';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  if (!isOpen) return null;

  const handleLogin = () => {
    signInWithRedirect({ provider: 'Google' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm mx-4">
        <h3 className="text-white text-lg font-semibold mb-4">Login Required</h3>
        <p className="text-gray-300 mb-6">Please sign in to view your purchases and summaries.</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleLogin}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}