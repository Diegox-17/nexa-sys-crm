import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();

    console.log('[ProtectedRoute] Loading:', loading);
    console.log('[ProtectedRoute] User:', user);
    console.log('[ProtectedRoute] User keys:', user ? Object.keys(user) : 'N/A');
    console.log('[ProtectedRoute] User.role:', user?.role);
    console.log('[ProtectedRoute] User.role_id:', user?.role_id);
    console.log('[ProtectedRoute] AllowedRoles:', allowedRoles);
    console.log('[ProtectedRoute] Children provided:', !!children);

    if (loading) {
        console.log('[ProtectedRoute] Still loading, showing loading...');
        return <div>Cargando...</div>;
    }

    if (!user) {
        console.warn('[ProtectedRoute] No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn(`[ProtectedRoute] Access denied. User role: ${user.role}, Allowed: ${allowedRoles}`);
        return <Navigate to="/dashboard" replace />;
    }

    // Support both Wrapper pattern (children) and Layout pattern (Outlet)
    console.log('[ProtectedRoute] Access granted, rendering children/Outlet');
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
