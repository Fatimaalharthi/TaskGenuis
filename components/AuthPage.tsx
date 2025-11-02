import React, { useState } from 'react';
import { User } from '../types';
import { LogoIcon } from './icons';

interface AuthPageProps {
  onLogin: (email: string) => string | null;
  onSignUp: (name: string, email: string) => void;
  users: User[];
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, users }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLoginView) {
      const loginError = onLogin(email);
      if (loginError) {
        setError(loginError);
      }
    } else {
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError("An account with this email already exists.");
        return;
      }
      onSignUp(name, email);
    }
  };
  
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-brand-primary via-brand-accent to-purple-800 bg-[length:200%_200%] animate-animatedGradient font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
          <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <LogoIcon className="w-10 h-10 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-800">
                  {isLoginView ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                  to continue to <span className="font-semibold text-primary">TaskGenius</span>
              </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLoginView && (
              <div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-4 py-3 bg-gray-100 text-brand-text border-b-2 border-gray-300 focus:border-primary placeholder-gray-500 focus:outline-none transition-colors"
                  />
              </div>
          )}

          <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 bg-gray-100 text-brand-text border-b-2 border-gray-300 focus:border-primary placeholder-gray-500 focus:outline-none transition-colors"
              />
          </div>

          <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-100 text-brand-text border-b-2 border-gray-300 focus:border-primary placeholder-gray-500 focus:outline-none transition-colors"
              />
          </div>
          
          {error && (
              <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md text-center">{error}</p>
          )}

          <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
              >
              {isLoginView ? 'Sign in' : 'Create Account'}
              </button>
          </div>
          </form>

          <p className="text-sm text-center text-gray-500">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={toggleView} className="font-medium text-primary hover:underline">
              {isLoginView ? 'Sign up' : 'Sign in'}
          </button>
          </p>
      </div>
    </div>
  );
};

export default AuthPage;