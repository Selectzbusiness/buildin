import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { profile, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 