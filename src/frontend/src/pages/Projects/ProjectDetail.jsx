import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI, usersAPI, clientsAPI } from '../../services/api';
import KanbanBoard from '../../components/KanbanBoard';
import Sidebar from '../../components/Sidebar';
import './ProjectDetail.css';

const ProjectDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskFormData, setTaskFormData] = useState({
        description: '',
        assigned_to: ''
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // BUG-041 FIX: Memorizar funciones fetch con useCallback
    const fetchProject = useCallback(async () => {
        try {
            const data = await projectsAPI.getById(id);
            setProject(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await usersAPI.getAll();
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchClients = useCallback(async () => {
        try {
            const data = await clientsAPI.getAll();
            setClients(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchFields = useCallback(async () => {
        try {
            const data = await projectsAPI.getFields();
            setFields(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchProject();
        fetchUsers();
        fetchClients();
        fetchFields();
    }, [fetchProject, fetchUsers, fetchClients, fetchFields]);

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            await projectsAPI.updateTaskStatus(taskId, newStatus);
            fetchProject();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error al actualizar estado de tarea');
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await projectsAPI.updateTask(editingTask.id, {
                    description: taskFormData.description,
                    assigned_to: taskFormData.assigned_to
                });
            } else {
                await projectsAPI.createTask(id, {
                    description: taskFormData.description,
                    status: 'pendiente',
                    assigned_to: taskFormData.assigned_to
                });
            }
            setShowTaskModal(false);
            setEditingTask(null);
            setTaskFormData({ description: '', assigned_to: '' });
            fetchProject();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error al guardar tarea');
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Cargando...</div>;
    if (!project) return <div style={{ color: 'white', padding: '2rem' }}>Proyecto no encontrado</div>;

    // BUG-035 & BUG-040 FIX: Always calculate progress dynamically from tasks
    // This ensures the KPI updates in real-time when task statuses change
    // Solution: Calculate from tasks, don't rely on potentially stale DB value
    const progress = project.tasks && project.tasks.length > 0
        ? Math.round((project.tasks.filter(t => t.status === 'aprobada').length / project.tasks.length) * 100)
        : 0;

    // Group custom fields by category
    const groupedCustomFields = (fields || [])
        .filter(field => field.active)
        .reduce((acc, field) => {
            const category = field.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(field);
            return acc;
        }, {});

    return (
        <div className="layout">
            {/* SIDEBAR */}
            <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            {/* TOPBAR - Homologated - With links*/}
            <header className="topbar">
                <div className="breadcrumbs">
                    <Link to="/dashboard">SISTEMA</Link> / <Link to="/projects">PROYECTOS</Link> / DETALLE
                </div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            {/* MAIN EXHIBIT */}
            <main className="main-content animate-fade-in">
                <div className="page-header">
                    <div>
                        <Link to="/projects" className="back-link">&larr; VOLVER</Link>
                        <h1 className="project-title">{project.name}</h1>
                        <span className="status-badge" style={{
                            borderColor: '#00F0FF', color: '#00F0FF', background: 'rgba(0, 240, 255, 0.1)'
                        }}>
                            {project.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* KPIs */}
                <div className="kpi-grid">
                    <KpiCard title="PROGRESO" value={`${progress}%`} />
                    <KpiCard title="TAREAS" value={project.tasks?.length || 0} />
                    <KpiCard title="CLIENTE" value={(() => {
                        const client = (clients || []).find(c => c.id == project.client_id);
                        return client ? client.name : 'N/A';
                    })()} />
                    <KpiCard title="RESPONSABLE" value={(() => {
                        const responsible = (users || []).find(u => u.id == project.responsible_id);
                        return responsible ? responsible.username : 'N/A';
                    })()} />
                </div>

                {/* Project Details Section */}
                <div className="project-details-section">
                    <h3 className="section-title">DETALLES DEL PROYECTO</h3>
                    <div className="details-grid">
                        {/* Priority */}
                        <div className="detail-card">
                            <div className="detail-label">PRIORIDAD</div>
                            <div className={`priority-badge priority-${project.priority}`}>
                                {project.priority?.toUpperCase()}
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="detail-card">
                            <div className="detail-label">PRESUPUESTO</div>
                            <div className="detail-value">
                                {project.budget ? `$${Number(project.budget).toLocaleString('es-CL')}` : 'No definido'}
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="detail-card">
                            <div className="detail-label">FECHA INICIO</div>
                            <div className="detail-value">
                                {project.start_date ? new Date(project.start_date).toLocaleDateString('es-CL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                }) : 'No definida'}
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="detail-card">
                            <div className="detail-label">FECHA FIN (ESTIMADA)</div>
                            <div className="detail-value">
                                {project.end_date ? new Date(project.end_date).toLocaleDateString('es-CL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                }) : 'No definida'}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                        <div className="description-section">
                            <div className="detail-label">DESCRIPCIÓN</div>
                            <div className="description-text">{project.description}</div>
                        </div>
                    )}
                </div>

                {/* Task Actions - Above Kanban */}
                <div className="kanban-actions" style={{ marginBottom: '1.5rem' }}>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingTask(null);
                        setTaskFormData({ description: '', assigned_to: '' });
                        setShowTaskModal(true);
                    }}>
                        + NUEVA TAREA
                    </button>
                </div>

                {/* Kanban */}
                <KanbanBoard
                    tasks={project.tasks || []}
                    projectId={project.id}
                    onStatusChange={handleTaskStatusChange}
                    userRole={user?.role}
                    users={users}
                    onEditTask={(task) => {
                        setEditingTask(task);
                        setTaskFormData({
                            description: task.description,
                            assigned_to: task.assigned_to || ''
                        });
                        setShowTaskModal(true);
                    }}
                />

                {/* Custom Fields Section - Bottom of Page */}
                {Object.keys(groupedCustomFields).length > 0 && (
                    <div className="custom-fields-section-bottom">
                        <h3 className="section-title">CAMPOS PERSONALIZADOS</h3>
                        {Object.entries(groupedCustomFields).map(([category, catFields]) => (
                            <div key={category} className="custom-field-category-bottom">
                                <h4 className="custom-category-title">{category}</h4>
                                <div className="custom-fields-grid">
                                    {catFields.map(field => {
                                        const fieldValue = project.custom_data?.[field.name];
                                        return (
                                            <div key={field.id} className="custom-field-item">
                                                <div className="custom-field-label">{field.label}</div>
                                                <div className="custom-field-value">
                                                    {fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
                                                        ? fieldValue.toString()
                                                        : <span className="no-data">Sin datos</span>
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* TASK MODAL */}
            {showTaskModal && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="card modal-card" style={{ maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                            {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
                        </h3>
                        <form onSubmit={handleSaveTask}>
                            <div className="input-group">
                                <label htmlFor="task-description" className="input-label">DESCRIPCIÓN</label>
                                <textarea
                                    id="task-description"
                                    className="form-input"
                                    required
                                    rows="3"
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                    placeholder="¿Qué se debe hacer?"
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="task-assigned-to" className="input-label">ASIGNAR A</label>
                                <select
                                    id="task-assigned-to"
                                    className="form-input"
                                    style={{ background: 'var(--color-primary)' }}
                                    value={taskFormData.assigned_to}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                                >
                                    <option value="">Sin asignar</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => {
                                    setShowTaskModal(false);
                                    setEditingTask(null);
                                    setTaskFormData({ description: '', assigned_to: '' });
                                }}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTask ? 'GUARDAR CAMBIOS' : 'CREAR TAREA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiCard = ({ title, value }) => (
    <div className="kpi-card">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
    </div>
);

export default ProjectDetail;
