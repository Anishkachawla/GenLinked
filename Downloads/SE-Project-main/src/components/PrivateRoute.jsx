// src/components/PrivateRoute.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth(); // Get currentUser and loading state

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user...</p> {/* Or a proper loading spinner */}
      </div>
    );
  }

  // If not loading and there's a user, render the child routes
  // Otherwise, redirect to login
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;