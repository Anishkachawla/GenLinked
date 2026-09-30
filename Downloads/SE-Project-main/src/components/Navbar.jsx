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
    </nav>
  );
};

export default Navbar;