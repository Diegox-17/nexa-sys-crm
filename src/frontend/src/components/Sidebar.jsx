import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ onToggle, isCollapsed }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
    const closeMobile = () => setIsMobileOpen(false);

    const navItems = [
        { path: '/dashboard', label: 'Panel', icon: '◆' },
        { path: '/clients', label: 'Clientes', icon: '●' },
        { path: '/projects', label: 'Proyectos', icon: '◎' },
    ];

    // Agregar Gestión de Usuarios solo para admin/manager
    if (user?.role === 'admin' || user?.role === 'manager') {
        navItems.push({ path: '/users', label: 'Usuarios', icon: '◉' });
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={`mobile-toggle ${isMobileOpen ? 'active' : ''}`}
                onClick={toggleMobile}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

            {/* Sidebar */}
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Header Section */}
                <div className="sidebar-header">
                    <div className="sidebar-brand-container">
                        {/* Full logo when expanded */}
                        {!isCollapsed && (
                            <div className="sidebar-logo-full">
                                <img
                                    src="/assets/Logo Dark Sin Fondo.png"
                                    alt="Nexa-Sys"
                                    className="sidebar-logo-img"
                                />
                            </div>
                        )}
                        {/* Small icon logo when collapsed */}
                        {isCollapsed && (
                            <div className="sidebar-logo-collapsed">
                                <img
                                    src="/assets/Favicon Vectorizado.svg"
                                    alt="N"
                                    className="sidebar-icon-img"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Toggle Button - Outside the header, positioned correctly */}
                {!isMobileOpen && (
                    <button
                        className="sidebar-toggle-btn"
                        onClick={onToggle}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={isCollapsed ? 'Expandir' : 'Contraer'}
                    >
                        <span className="toggle-icon">{isCollapsed ? '→' : '←'}</span>
                    </button>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={closeMobile}
                            title={item.label}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* User Info - visible only when expanded */}
                    {!isCollapsed && (
                        <div className="sidebar-user">
                            <div className="user-avatar">
                                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.username || 'Usuario'}</span>
                                <span className="user-role">{(user?.role || 'user').toUpperCase()}</span>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        className="nav-item logout-btn"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                    >
                        <span className="nav-icon">✕</span>
                        {!isCollapsed && <span className="nav-label">SALIR</span>}
                    </button>

                    {/* System Info - visible only when expanded */}
                    {!isCollapsed && (
                        <div className="sidebar-meta">
                            SEC_LEVEL: 1
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
