import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthLayout = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Check token expiration
        const userData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (userData.exp < currentTime) {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        // Verify with backend
        const response = await axios.get('http://localhost:5000/verify-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.valid) {
          setIsAuthenticated(true);
          // Redirect based on role
          if (location.pathname === '/') {
            navigate(userData.role === 'admin' ? '/dashboardAdmin' : '/dashboard', { replace: true });
          }
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();

    // Handle navigation events
    const handleNavigation = () => {
      verifyAuth();
    };

    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [navigate, location.pathname]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthLayout;
