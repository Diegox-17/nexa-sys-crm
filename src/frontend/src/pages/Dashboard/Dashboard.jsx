import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        total_cl: 0,
        pending_tasks: 0,
        tasks_to_approve: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all projects to calculate task statistics
                const projects = await projectsAPI.getAll();

                let pendingTasks = 0;
                let tasksToApprove = 0;

                projects.forEach(project => {
                    if (project.tasks && Array.isArray(project.tasks)) {
                        project.tasks.forEach(task => {
                            // Count pending + in_progress tasks
                            if (task.status === 'pendiente' || task.status === 'en_progreso') {
                                pendingTasks++;
                            }
                            // Count tasks waiting for approval (completada status)
                            if (task.status === 'completada') {
                                tasksToApprove++;
                            }
                        });
                    }
                });

                // Get total clients from first project (or we could fetch separately)
                const totalClients = projects.reduce((acc, p) => {
                    // Count unique clients
                    if (!acc.includes(p.client_id)) {
                        acc.push(p.client_id);
                    }
                    return acc;
                }, []).length;

                setStats({
                    total_cl: totalClients,
                    pending_tasks: pendingTasks,
                    tasks_to_approve: tasksToApprove
                });
            } catch (err) {
                console.error("Error fetching stats", err);
                // Fallback to default values
                setStats({
                    total_cl: 0,
                    pending_tasks: 0,
                    tasks_to_approve: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src="/assets/Logo Dark Sin Fondo.png" alt="Nexa-Sys" />
                </div>
                <nav style={{ flex: 1 }}>
                    <Link to="/dashboard" className="nav-item active">Panel</Link>
                    <Link to="/clients" className="nav-item">Clientes</Link>
                    <Link to="/projects" className="nav-item">Proyectos</Link>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link to="/users" className="nav-item">Gestión de Usuarios</Link>
                    )}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem' }}>SALIR</button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>
                        ROLE: {user?.role.toUpperCase()}<br />
                        SEC_LEVEL: 1
                    </div>
                </div>
            </aside>

            <header className="topbar">
                <div className="breadcrumbs">SISTEMA / USUARIO / DASHBOARD</div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            <main className="main-content animate-fade-in">
                <div className="profile-header">
                    <div className="profile-avatar-lg">{user?.username.substring(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                        <h1>{user?.username}</h1>
                        <p className="text-cyan">Rol: {
                            user?.role === 'admin' ? 'Administrador del Sistema' :
                                user?.role === 'manager' ? 'Manager' :
                                    'Usuario Estándar'
                        }</p>
                    </div>
                </div>

                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-label">CLIENTES TOTALES</div>
                        <div className="stat-value">{stats.total_cl}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">TAREAS PENDIENTES</div>
                        <div className="stat-value">{stats.pending_tasks}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">POR APROBAR</div>
                        <div className="stat-value text-cyan">{stats.tasks_to_approve}</div>
                    </div>
                </div>

                <div className="card">
                    <h3>Actividad Reciente</h3>
                    <p style={{ color: 'var(--color-accent)', marginTop: '1rem' }}>No hay actividad reciente para mostrar.</p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
