import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import { useTheme } from './context/ThemeContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateSnippet from './pages/CreateSnippet';
import EditSnippet from './pages/EditSnippet';
import SnippetDetail from './pages/SnippetDetail';

import './App.css';

function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: isDark ? '#1a1a2e' : '#ffffff',
                color: isDark ? '#e4e4e7' : '#1a1a2e',
                border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
                borderRadius: '10px',
                fontSize: '0.875rem',
                boxShadow: isDark
                  ? '0 4px 16px rgba(0,0,0,0.4)'
                  : '0 4px 16px rgba(0,0,0,0.08)',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: isDark ? '#1a1a2e' : '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: isDark ? '#1a1a2e' : '#fff' },
              },
            }}
          />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/snippet/:id" element={<SnippetDetail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateSnippet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditSnippet />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;