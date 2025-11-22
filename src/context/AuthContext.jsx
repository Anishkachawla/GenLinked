// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Path to your firebase.js

// 1. Create the Context
const AuthContext = createContext();

// 2. Create a custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Stores the logged-in user object
  const [loading, setLoading] = useState(true); // To indicate if auth state is still loading

  // Listen for auth state changes from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Set the user object (null if logged out)
      setLoading(false);   // Auth state has been determined
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Function to handle logout
  const logout = () => {
    return signOut(auth);
  };

  // Provide the current user, loading state, and logout function to children
  const value = {
    currentUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Only render children once loading is complete */}
    </AuthContext.Provider>
  );
};