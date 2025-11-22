<<<<<<< HEAD
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Since we can't use useLocation, we'll check the current URL
  const currentPath = window.location.pathname;
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'fas fa-chart-bar' },
    { name: 'Articles', href: '/getArticles', icon: 'fas fa-file-alt' },
  ];

  const isActive = (path) => currentPath === path;

  const handleNavClick = (href) => {
    window.location.href = href;
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavClick('/')} 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">GenLinked</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleNavClick('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors duration-200"
            >
              {isOpen ? (
                <i className="fas fa-times text-xl"></i>
              ) : (
                <i className="fas fa-bars text-xl"></i>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${item.icon} text-base`}></i>
                  <span>{item.name}</span>
                </button>
              );
            })}
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={() => handleNavClick('/')}
                className="flex items-center justify-center w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
=======
// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Navbar = () => {
  const { currentUser, logout, loading } = useAuth(); // Get auth state and logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Don't render until auth state is known
  if (loading) {
    return null; // Or a loading spinner/skeleton for Navbar
  }

  return (
    <nav className="navbar bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2 text-lg font-bold text-gray-800">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-file-alt text-white text-md"></i> {/* Assuming Font Awesome */}
        </div>
        <span>GenLinked</span>
      </Link>

      <div className="nav-links flex space-x-4">
        {/* These links could also be conditionally rendered or point to protected routes */}
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center">
          <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
        </Link>
        <Link to="/getArticles" className="text-gray-600 hover:text-blue-600 flex items-center">
          <i className="fas fa-newspaper mr-1"></i> Articles
        </Link>
      </div>

      <div className="auth-section">
        {currentUser ? (
          <button
            onClick={handleLogout}
            // --- COLOR CHANGED HERE ---
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            // --- MATCHED STYLING HERE ---
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Login
          </Link>
        )}
      </div>
>>>>>>> 6b7fac3d94f4d5d2ff3e45fb17a16b8e0cc0edc7
    </nav>
  );
};

export default Navbar;