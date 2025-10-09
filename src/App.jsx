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