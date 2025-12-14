import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname === '/signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    
    try {
      // Need withCredentials for cookies (Flask-Login)
      await axios.post(`${endpoint}`, { username, password }, { withCredentials: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">♟️</span>
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignup ? 'Create an Account' : 'Welcome Back'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-transform active:scale-95"
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <Link 
            to={isSignup ? '/login' : '/signup'} 
            className="text-blue-600 font-semibold ml-1 hover:underline"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </div>
        <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;