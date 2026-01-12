import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import './Dashboard.css';
import '../../components/Sidebar.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total_cl: 0,
        pending_tasks: 0,
        tasks_to_approve: 0
    });
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

    return (
        <div className={`layout ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            <header className="topbar">
                <div className="breadcrumbs">SISTEMA / USUARIO / DASHBOARD</div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username?.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            <main className="main-content animate-fade-in">
                <div className="profile-header">
                    <div className="profile-avatar-lg">{user?.username.substring(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                        <h1>{user?.username}</h1>
                        <p className="text-cyan">Rol: {
                            (user?.role || 'user') === 'admin' ? 'Administrador del Sistema' :
                                (user?.role || 'user') === 'manager' ? 'Manager' :
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
