import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../admin/auth';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/bobs/admin/login" replace />;
  }

  return element;
};

export default ProtectedRoute;
