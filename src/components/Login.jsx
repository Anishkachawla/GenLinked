import { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = (e) => {
    e.preventDefault();
    // Handle email/password login logic here
    console.log('Email login:', { email, password, isSignUp });
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  const handleGoogleLogin = () => {
    // Handle Google OAuth login
    console.log('Google login clicked');
    // Redirect to dashboard after successful auth
    window.location.href = '/dashboard';
  };

  const handleLinkedInLogin = () => {
    // Handle LinkedIn OAuth login
    console.log('LinkedIn login clicked');
    // Redirect to dashboard after successful auth
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-file-alt text-white text-2xl"></i>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GenLinked</span>
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 hover:shadow-md"
            >
              <i className="fab fa-google text-red-500 text-lg mr-3"></i>
              Continue with Google
            </button>
            
            <button
              onClick={handleLinkedInLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 hover:shadow-md"
            >
              <i className="fab fa-linkedin text-white text-lg mr-3"></i>
              Continue with LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter your email"
                />
                <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              onClick={handleEmailLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-2`}></i>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;