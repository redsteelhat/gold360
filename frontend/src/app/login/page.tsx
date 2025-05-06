'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // This is a placeholder, we'll implement actual login functionality later
      console.log('Login attempt with:', { email, password });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard after successful login
      // Implement the actual login logic here
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-primary mb-2">Gold360</h1>
          <h2 className="text-2xl font-semibold text-secondary mb-1">Welcome Back</h2>
          <p className="text-gray-500">Log in to your account to continue</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-error p-4 mb-6 rounded-md">
              <p className="text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Your email address"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:text-primary-600">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 