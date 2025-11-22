<<<<<<< HEAD
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ScrapArticles from './components/ScrapArticles'
import Home from './components/Home'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/getArticles" element={<ScrapArticles />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
=======
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'; // Your global CSS file

// Import your components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ScrapArticles from './components/ScrapArticles';
import Home from './components/Home';

// Import AuthProvider and PrivateRoute components
// Make sure you have created these files as instructed previously:
// - src/context/AuthContext.jsx
// - src/components/PrivateRoute.jsx
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    // Wrap the entire application with AuthProvider
    // This makes authentication status available to all components inside
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar is rendered outside of Routes so it's always visible */}
        {/* It will dynamically show Login/Logout based on AuthContext */}
        <Navbar />
        
        {/* Define your application routes */}
        <Routes>
          {/* Public Routes - accessible to everyone */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - only accessible to authenticated users */}
          {/* We use a parent <Route element={<PrivateRoute />} /> to protect nested routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/getArticles" element={<ScrapArticles />} />
            {/* Add any other routes that require authentication here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
>>>>>>> 6b7fac3d94f4d5d2ff3e45fb17a16b8e0cc0edc7
