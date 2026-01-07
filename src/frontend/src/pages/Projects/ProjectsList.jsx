import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI, clientsAPI, usersAPI } from '../../services/api';
import ProjectFieldManager from '../../components/ProjectFieldManager';
import Sidebar from '../../components/Sidebar';
import './ProjectsList.css';

/**
 * ProjectsList Component - Gestión de Proyectos CRM
 *
 * Componente principal para listar, crear y editar proyectos.
 * Incluye KPIs de progreso, filtrado por estado y gestión de campos personalizados.
 *
 * @component
 * @requires useAuth - Contexto de autenticación
 * @requires projectsAPI - API de proyectos
 * @requires clientsAPI - API de clientes
 * @requires usersAPI - API de usuarios
 *
 * @features
 * - Lista interactiva de proyectos con KPIs en tiempo real
 * - Creación y edición de proyectos con formulario validado
 * - Eliminación lógica (soft-delete) vía API
 * - Búsqueda filtrada por estado
 * - Gestión de campos personalizados (BUG #026)
 * - Cálculo automático de progreso basado en tareas
 *
 * @bugs-fixes
 * - BUG-032: Avance sincronizado con tasks
 * - BUG-034: Presupuesto y Avance se almacenan correctamente
 * - BUG-041: useCallback implementado para optimizar calls al backend
 *
 * @example
 * ```jsx
 * import ProjectsList from './pages/Projects/ProjectsList';
 *
 * function App() {
 *   return <ProjectsList />;
 * }
 * ```
 */
const ProjectsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [fieldData, setFieldData] = useState({ id: null, name: '', label: '', type: 'text', category: 'General', is_required: false, sort_order: 0, options: [], active: true });
    const [isEditingField, setIsEditingField] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Form State for Project
    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        description: '',
        status: 'prospectado',
        start_date: '',
        end_date: '',
        responsible_id: '',
        budget: '',
        priority: 'medium',
        progress_percentage: 0,
        custom_data: {}
    });

    // BUG-041 FIX: Memorizar funciones fetch con useCallback para evitar re-creación en cada render
    const fetchProjects = useCallback(async () => {
        try {
            const data = await projectsAPI.getAll();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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

    const fetchUsers = useCallback(async () => {
        try {
            const data = await usersAPI.getAll();
            setUsers(data);
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
        fetchProjects();
        fetchClients();
        fetchUsers();
        fetchFields();
    }, [fetchProjects, fetchClients, fetchUsers, fetchFields]);

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name || '',
            client_id: project.client_id || '',
            description: project.description || '',
            status: project.status || 'prospectado',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            responsible_id: project.responsible_id || '',
            budget: project.budget || '',
            priority: project.priority || 'medium',
            progress_percentage: project.progress_percentage || 0,
            custom_data: project.custom_data || {}
        });
        setShowModal(true);
    };

    const validateProjectForm = (data) => {
        const errors = [];

        // Validaciones básicas
        if (!data.name?.trim()) {
            errors.push('El nombre del proyecto es obligatorio');
        }
        if (!data.client_id) {
            errors.push('Debe seleccionar un cliente');
        }

        // Validaciones de metadatos de negocio (BUG #025)
        if (data.budget && (isNaN(data.budget) || parseFloat(data.budget) < 0)) {
            errors.push('El presupuesto debe ser un número positivo');
        }

        if (data.progress_percentage && (isNaN(data.progress_percentage) || data.progress_percentage < 0 || data.progress_percentage > 100)) {
            errors.push('El porcentaje de avance debe estar entre 0 y 100');
        }

        // Validaciones de fechas
        if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
            errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
        }

        // Validaciones de campos personalizados requeridos
        fields.forEach(field => {
            if (field.active && field.is_required) {
                const value = data.custom_data?.[field.name];
                if (!value || (typeof value === 'string' && !value.trim())) {
                    errors.push(`El campo "${field.label}" es obligatorio`);
                }
            }
        });

        return errors;
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();

        // BUG-034 FIX: Prepare data with proper types
        const projectData = {
            ...formData,
            // Ensure budget is a number (not string) for proper database storage
            budget: formData.budget ? parseFloat(formData.budget) : null,
            // Ensure progress_percentage is a number
            progress_percentage: formData.progress_percentage || 0
        };

        // Validar formulario
        const validationErrors = validateProjectForm(projectData);
        if (validationErrors.length > 0) {
            alert('Por favor corrija los siguientes errores:\n\n' + validationErrors.join('\n'));
            return;
        }

        try {
            if (editingProject) {
                await projectsAPI.update(editingProject.id, projectData);
            } else {
                await projectsAPI.create(projectData);
            }
            setShowModal(false);
            setEditingProject(null);
            setFormData({
                name: '', client_id: '', description: '', status: 'prospectado', start_date: '', end_date: '', responsible_id: '', budget: '', priority: 'medium',
                progress_percentage: 0, custom_data: {}
            });
            fetchProjects();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error al guardar proyecto');
        }
    };

    const handleEditField = (field) => {
        setFieldData({ ...field });
        setIsEditingField(true);
    };

    const handleNewField = () => {
        setFieldData({ id: null, name: '', label: '', type: 'text', category: 'General', is_required: false, sort_order: 0, options: [], active: true });
        setIsEditingField(false);
    };

    const handleOpenFieldManager = () => {
        setShowFieldModal(true);
    };

    // Group fields by category for the Project Form
    const groupedFields = (fields || []).reduce((acc, field) => {
        if (!field.active) return acc; // Skip inactive fields
        const cat = field.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(field);
        return acc;
    }, {});

    // BUG-032 FIX: Use progress_percentage from DB with fallback to dynamic calculation
    // This ensures consistency between ProjectsList and ProjectDetail views
    const getProjectProgress = (project) => {
        // PRIORIDAD 1: Calcular dinámicamente si hay tareas
        if (project.tasks && project.tasks.length > 0) {
            const approvedTasks = project.tasks.filter(t => t.status === 'aprobada').length;
            return Math.round((approvedTasks / project.tasks.length) * 100);
        }

        // PRIORIDAD 2: Usar BD solo si no hay tareas
        return project.progress_percentage || 0;
    };

    // Filter projects based on status filter
    const filteredProjects = statusFilter === 'all'
        ? projects
        : projects.filter(p => p.status === statusFilter);

    // Helper functions for status and priority colors
    const getStatusColor = (status) => {
        const colors = {
            prospectado: '#A0AEC0',
            cotizado: '#4299E1',
            en_progreso: '#48BB78',
            pausado: '#ED8936',
            finalizado: '#9F7AEA'
        };
        return colors[status] || '#A0AEC0';
    };

    const getStatusBg = (status) => {
        const colors = {
            prospectado: 'rgba(160, 174, 192, 0.1)',
            cotizado: 'rgba(66, 153, 225, 0.1)',
            en_progreso: 'rgba(72, 187, 120, 0.1)',
            pausado: 'rgba(237, 137, 54, 0.1)',
            finalizado: 'rgba(159, 122, 234, 0.1)'
        };
        return colors[status] || 'rgba(160, 174, 192, 0.1)';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: '#FC8181',
            medium: '#F6E05E',
            low: '#68D391'
        };
        return colors[priority] || '#F6E05E';
    };

    const getPriorityBg = (priority) => {
        const colors = {
            high: 'rgba(252, 129, 129, 0.1)',
            medium: 'rgba(246, 224, 94, 0.1)',
            low: 'rgba(104, 211, 145, 0.1)'
        };
        return colors[priority] || 'rgba(246, 224, 94, 0.1)';
    };

    return (
        <div className="layout">
            {/* SIDEBAR */}
            <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            {/* TOPBAR - With links*/}
            <header className="topbar">
                <div className="breadcrumbs">
                    <Link to="/dashboard">SISTEMA</Link> / <Link to="/projects">PROYECTOS</Link> / LISTA
                </div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            {/* MAIN */}
            <main className="main-content animate-fade-in">
                <div className="page-header">
                    <div>
                        <h1>Gestión de Proyectos</h1>
                        <p className="text-slate" style={{ fontSize: '0.875rem' }}>Administración y seguimiento de proyectos vinculados.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {user?.role === 'admin' && (
                            <button className="btn" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={handleOpenFieldManager}>
                                ⚙️ CAMPOS
                            </button>
                        )}
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn btn-primary" onClick={() => { setEditingProject(null); setShowModal(true); }}>+ NUEVO PROYECTO</button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <select
                        className="form-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ maxWidth: '200px', background: 'var(--color-primary)' }}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="prospectado">Prospectado</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="finalizado">Finalizado</option>
                    </select>
                </div>

                {/* Table */}
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>PROYECTO</th>
                                <th>CLIENTE</th>
                                <th>ESTADO</th>
                                <th>PRIORIDAD</th>
                                <th>PRESUPUESTO</th>
                                <th>AVANCE</th>
                                <th>RESPONSABLE</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent)' }}>Cargando proyectos...</td></tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent)' }}>No se encontraron proyectos.</td></tr>
                            ) : (
                                filteredProjects.map(p => (
                                    <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                                        <td><span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>#{p.id}</span></td>
                                        <td><strong>{p.name}</strong></td>
                                        <td>
                                            {(() => {
                                                const client = clients.find(c => c.id == p.client_id);
                                                return client ? client.name : 'N/A';
                                            })()}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', border: '1px solid',
                                                borderColor: getStatusColor(p.status), color: getStatusColor(p.status), background: getStatusBg(p.status)
                                            }}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', border: '1px solid',
                                                borderColor: getPriorityColor(p.priority), color: getPriorityColor(p.priority), background: getPriorityBg(p.priority)
                                            }}>
                                                {(p.priority || 'medium').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                                                ${p.budget ? p.budget.toLocaleString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '4px',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${getProjectProgress(p)}%`,
                                                        height: '100%',
                                                        background: '#00F0FF',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                                                    {getProjectProgress(p)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {(() => {
                                                const responsible = (users || []).find(u => u.id === p.responsible_id);
                                                return responsible ? responsible.username : 'N/A';
                                            })()}
                                        </td>
                                        <td>
                                            <button
                                                className="btn"
                                                style={{ padding: '4px 8px', fontSize: '0.7rem', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', background: 'transparent' }}
                                                onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                                            >
                                                ✏️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* PROJECT MODAL (Create/Edit) */}
            {showModal && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="card modal-card" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                            {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                        </h3>
                        <form onSubmit={handleSaveProject}>
                            <div className="input-group">
                                <label htmlFor="project-name" className="input-label">NOMBRE DEL PROYECTO</label>
                                <input
                                    id="project-name"
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej. Migración Cloud"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="project-client" className="input-label">CLIENTE</label>
                                    <select
                                        id="project-client"
                                        className="form-input"
                                        style={{ background: 'var(--color-primary)' }}
                                        required
                                        value={formData.client_id}
                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="project-priority" className="input-label">PRIORIDAD</label>
                                    <select
                                        id="project-priority"
                                        className="form-input"
                                        style={{ background: 'var(--color-primary)' }}
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="high">ALTA</option>
                                        <option value="medium">MEDIA</option>
                                        <option value="low">BAJA</option>
                                    </select>
                                </div>
                            </div>

                            {/* Business Metadata - NEW SECTION (BUG #025) */}
                            <div style={{ margin: '1.5rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                                <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metadatos de Negocio</h4>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="project-budget" className="input-label">PRESUPUESTO ESTIMADO</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>$</span>
                                        <input
                                            id="project-budget"
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            style={{ paddingLeft: '28px' }}
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="project-responsible" className="input-label">RESPONSABLE</label>
                                    <select
                                        id="project-responsible"
                                        className="form-input"
                                        style={{ background: 'var(--color-primary)' }}
                                        value={formData.responsible_id}
                                        onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar responsable...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="project-start-date" className="input-label">FECHA INICIO</label>
                                    <input
                                        id="project-start-date"
                                        type="date"
                                        className="form-input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="project-end-date" className="input-label">FECHA FIN (ESTIMADA)</label>
                                    <input
                                        id="project-end-date"
                                        type="date"
                                        className="form-input"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="project-progress" className="input-label">PORCENTAJE AVANCE (%)</label>
                                    <input
                                        id="project-progress"
                                        type="number"
                                        disabled={true}  // ← Hacer no editable
                                        readOnly         // ← Solo lectura
                                        className="form-input"
                                        style={{ background: 'var(--color-disabled)', cursor: 'not-allowed' }}
                                        value={formData.progress_percentage || 0}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="project-status" className="input-label">ESTADO</label>
                                    <select
                                        id="project-status"
                                        className="form-input"
                                        style={{ background: 'var(--color-primary)' }}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="prospectado">Prospectado</option>
                                        <option value="cotizado">Cotizado</option>
                                        <option value="en_progreso">En Progreso</option>
                                        <option value="pausado">Pausado</option>
                                        <option value="finalizado">Finalizado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-description" className="input-label">DESCRIPCIÓN</label>
                                <textarea
                                    id="project-description"
                                    className="form-input"
                                    placeholder="Descripción del proyecto..."
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* Dynamic Custom Fields - Categorized (BUG #026) */}
                            {Object.keys(groupedFields).length > 0 && (
                                <div style={{ margin: '1.5rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                                    <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Campos Personalizados</h4>
                                </div>
                            )}

                            {Object.keys(groupedFields).length > 0 && (
                                <div className="custom-fields-section">
                                    {Object.entries(groupedFields).map(([category, catFields]) => (
                                        <div key={category} style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                {category}
                                            </h4>
                                            <div className="form-row" style={{ flexWrap: 'wrap' }}>
                                                {catFields.map(field => (
                                                    <div key={field.id} className="input-group" style={{ flex: '1 1 45%' }}>
                                                        <label className="input-label">{field.label}</label>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                className="form-input"
                                                                style={{ background: 'var(--color-primary)' }}
                                                                value={formData.custom_data[field.name] || ''}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    custom_data: { ...formData.custom_data, [field.name]: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">Seleccionar...</option>
                                                                {field.options?.map(option => (
                                                                    <option key={option} value={option}>{option}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'textarea' ? (
                                                            <textarea
                                                                className="form-input"
                                                                rows="2"
                                                                value={formData.custom_data[field.name] || ''}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    custom_data: { ...formData.custom_data, [field.name]: e.target.value }
                                                                })}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                className="form-input"
                                                                value={formData.custom_data[field.name] || ''}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    custom_data: { ...formData.custom_data, [field.name]: e.target.value }
                                                                })}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingProject(null); }}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProject ? 'GUARDAR CAMBIOS' : 'CREAR PROYECTO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Field Manager Modal (BUG #026) */}
            <ProjectFieldManager
                show={showFieldModal}
                onClose={() => {
                    setShowFieldModal(false);
                    fetchFields(); // Refresh fields after closing
                }}
            />
        </div>
    );
};

export default ProjectsList;
