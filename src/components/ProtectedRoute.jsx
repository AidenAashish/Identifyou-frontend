import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@stackframe/react';

const ProtectedRoute = ({ children }) => {
  const user = useUser({ or: 'return-null' });
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

export default ProtectedRoute;