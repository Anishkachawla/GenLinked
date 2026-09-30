// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase'; // Correct path to firebase.js

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between Sign In and Sign Up forms
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); // State to display Firebase auth errors
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  // --- Auth State Listener (runs once on mount) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        console.log('User is already logged in:', user.email);
        navigate('/dashboard');
      } else {
        // No user is signed in
        console.log('No user logged in.');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);

  // --- Firebase Google Login ---
  const handleGoogleLogin = async () => {
    setError(''); // Clear previous errors
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log('Google Sign-In Successful!');
      navigate('/dashboard'); // Redirect on success
    } catch (err) {
      // Detailed error handling for Google OAuth
      let errorMessage = "An unknown error occurred during Google sign-in.";
      if (err.code) {
        switch (err.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-in popup closed. Please try again.";
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = "Sign-in already in progress. Please wait.";
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = "An account with this email already exists using a different sign-in method.";
            break;
          case 'auth/unauthorized-domain':
            errorMessage = "This domain is not authorized for Google sign-in. Check Firebase settings.";
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
      console.error('Google Sign-In Error:', err.message);
    }
  };

  // --- Firebase Email/Password Login or Sign Up ---
  const handleEmailAuth = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors

    try {
      if (isSignUp) {
        // --- Sign Up ---
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Email/Password Sign-Up Successful!');
      } else {
        // --- Sign In ---
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Email/Password Sign-In Successful!');
      }
      navigate('/dashboard'); // Redirect on success for both sign-in and sign-up
    } catch (err) {
      // Detailed error handling for Email/Password
      let errorMessage = "An unknown error occurred.";
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email is already registered.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password should be at least 6 characters.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = "Invalid email or password.";
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
      console.error('Email/Password Auth Error:', err.message);
    }
  };

  // --- LinkedIn Login (Placeholder for Custom Auth) ---
  const handleLinkedInLogin = () => {
    setError('LinkedIn authentication requires a custom backend setup and is not yet implemented.');
    console.log('LinkedIn login clicked (custom auth needed)');
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
              <i className="fas fa-file-alt text-white text-2xl"></i> {/* Font Awesome icon */}
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
          {/* Error Message Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 hover:shadow-md"
            >
              <i className="fab fa-google text-red-500 text-lg mr-3"></i> {/* Font Awesome icon */}
              Continue with Google
            </button>

            <button
              onClick={handleLinkedInLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 hover:shadow-md"
            >
              <i className="fab fa-linkedin text-white text-lg mr-3"></i> {/* Font Awesome icon */}
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
          <form onSubmit={handleEmailAuth}> {/* Form now handles both Sign In and Sign Up */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email-address" // Use a unique ID for better accessibility
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                  <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i> {/* Font Awesome icon */}
                </div>
              </div>

              <div>
                <label htmlFor="password-field" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password-field" // Use a unique ID
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter your password"
                  />
                  <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i> {/* Font Awesome icon */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i> {/* Font Awesome icon */}
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
                type="submit" // This button now submits the form, triggering handleEmailAuth
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-2`}></i> {/* Font Awesome icon */}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={(e) => {
                    e.preventDefault(); // Prevent default if button is inside a form
                    setIsSignUp(!isSignUp);
                    setError(''); // Clear errors when toggling mode
                }}
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