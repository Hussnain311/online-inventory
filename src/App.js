import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import createAppTheme from './theme';
import RequireAuth from './RequireAuth';
import Login from './Login';
import Signup from './Signup';
import Inventory from './Inventory';
import ForgotPassword from './ForgotPassword';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleThemeChange = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const theme = createAppTheme(isDarkMode ? 'dark' : 'light');

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/inventory" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/inventory" replace /> : <Signup />} 
          />
          <Route 
            path="/forgot-password" 
            element={user ? <Navigate to="/inventory" replace /> : <ForgotPassword />} 
          />
          <Route 
            path="/inventory" 
            element={
              <RequireAuth>
                <Inventory isDarkMode={isDarkMode} onThemeChange={handleThemeChange} />
              </RequireAuth>
            } 
          />
          <Route path="/" element={<Navigate to="/inventory" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;