
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './icons/LoadingSpinner';

const Auth: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email);
      setIsModalOpen(false);
      setEmail('');
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
        <div className="bg-[#111111] border border-gray-800 px-4 py-2 rounded-lg w-28 h-10 flex items-center justify-center">
            <LoadingSpinner className="w-5 h-5 text-gray-500" />
        </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-right hidden sm:block">
            <p className="text-white font-medium">{user.email}</p>
            <p className="text-gray-500 text-xs">Signed In</p>
        </div>
        <button
          onClick={() => logout()}
          className="bg-gray-800 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
      >
        Login
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-8 shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-2">Login to Your Account</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email to sign in (demo purposes).</p>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 mb-4 focus:ring-2 focus:ring-white focus:outline-none transition-shadow text-white"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoggingIn ? <LoadingSpinner className="w-5 h-5" /> : 'Sign In'}
              </button>
            </form>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full text-center text-gray-500 mt-4 text-sm hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;
