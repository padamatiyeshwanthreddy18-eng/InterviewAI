import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

/**
 * Open ProtectedRoute — Authentication barrier removed per user directive.
 * Direct access to interview room, track selection, dashboard, and reports.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return children;
};
