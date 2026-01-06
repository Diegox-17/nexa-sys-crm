import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { clientsAPI, projectsAPI } from '../../services/api';
import './ClientManagement.css';

const ClientManagement = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingField, setIsEditingField] = useState(false);

    // Form State for Client
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        contact_name: '',
        industry: '',
        email: '',
        phone: '',
        notes: '',
        active: true,
        custom_data: {}
    });

    // Form State for Field
    const [fieldData, setFieldData] = useState({
        id: null,
        name: '',
        label: '',
        type: 'text',
        category: 'General',
        active: true
    });

    // BUG-041 FIX: Memorizar funciones fetch con useCallback
    const fetchClients = useCallback(async () => {
        try {
            const data = await clientsAPI.getAll();
            setClients(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            const data = await projectsAPI.getAll();
            setProjects(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchFields = useCallback(async () => {
        try {
            const data = await clientsAPI.getFields();
            setFields(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchClients();
        fetchProjects();
        fetchFields();
    }, [fetchClients, fetchProjects, fetchFields]);

    // Helper function to get projects for a client
    const getClientProjects = (clientId) => {
        return projects.filter(p => p.client_id == clientId);
    };

    // Helper function to get project names
    const getProjectNames = (clientId) => {
        const clientProjects = getClientProjects(clientId);
        return clientProjects.map(p => p.name);
    };

    const handleSaveClient = async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                await clientsAPI.update(formData.id, formData);
            } else {
                await clientsAPI.create(formData);
            }
            setShowModal(false);
            fetchClients();
            setFormData({ id: null, name: '', contact_name: '', industry: '', email: '', phone: '', notes: '', active: true, custom_data: {} });
        } catch (err) {
            console.error(err);
            alert('Error al guardar cliente');
        }
    };

    const toggleVisibility = async (client) => {
        if (!window.confirm(`¿${client.active ? 'Ocultar' : 'Mostrar'} cliente?`)) return;
        try {
            await clientsAPI.update(client.id, { ...client, active: !client.active });
            await fetchClients();
        } catch (err) {
            console.error('Failed to toggle visibility', err);
        }
    };

    const openEdit = (client) => {
        setFormData({
            ...client,
            custom_data: client.custom_data || {}
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const openNew = () => {
        setFormData({ id: null, name: '', contact_name: '', industry: '', email: '', phone: '', notes: '', active: true, custom_data: {} });
        setIsEditing(false);
        setShowModal(true);
    };


    // ================= FIELDS LOGIC =================

    const handleSaveField = async (e) => {
        e.preventDefault();

        try {
            if (isEditingField) {
                await clientsAPI.updateField(fieldData.id, fieldData);
            } else {
                await clientsAPI.createField(fieldData);
            }
            setFieldData({ id: null, name: '', label: '', type: 'text', category: 'General', active: true });
            setIsEditingField(false);
            fetchFields();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error al guardar campo');
        }
    };

    const handleEditField = (field) => {
        setFieldData({ ...field });
        setIsEditingField(true);
    };

    const handleNewField = () => {
        setFieldData({ id: null, name: '', label: '', type: 'text', category: 'General', active: true });
        setIsEditingField(false);
    };

    // Group fields by category for the Client Form
    const groupedFields = (fields || []).reduce((acc, field) => {
        if (!field.active) return acc; // Skip inactive fields
        const cat = field.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(field);
        return acc;
    }, {});


    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src="/assets/Logo Dark Sin Fondo.png" alt="Nexa-Sys" />
                </div>
                <nav style={{ flex: 1 }}>
                    <Link to="/dashboard" className="nav-item">Panel</Link>
                    <Link to="/clients" className="nav-item active">Clientes</Link>
                    <Link to="/projects" className="nav-item">Proyectos</Link>
                    {(user?.role === 'admin' || user?.role === 'manager') &&
                        <Link to="/users" className="nav-item">Gestión de Usuarios</Link>
                    }
                </nav>
                <div className="sidebar-footer">
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem' }}>SALIR</button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>
                        ROLE: {user?.role.toUpperCase()}<br />
                        SEC_LEVEL: 1
                    </div>
                </div>
            </aside>

            <header className="topbar">
                <div className="breadcrumbs">SISTEMA / CLIENTES</div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            <main className="main-content animate-fade-in">
                <div className="page-header">
                    <div>
                        <h1>Cartera de Clientes</h1>
                        <p className="text-slate" style={{ fontSize: '0.875rem' }}>Administración centralizada de cuentas.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {user?.role === 'admin' && (
                            <button className="btn" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={() => { handleNewField(); setShowFieldModal(true); }}>
                                ⚙️ CAMPOS
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={openNew}>
                            + NUEVO CLIENTE
                        </button>
                    </div>
                </div>

                <div className="search-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text" className="form-input"
                        placeholder="Buscar por empresa o mail..."
                        style={{ maxWidth: '400px' }}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>CLIENTE</th>
                                <th>GIRO</th>
                                <th>CONTACTO</th>
                                <th>PROYECTOS</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{c.email}</div>
                                    </td>
                                    <td>{c.industry}</td>
                                    <td>
                                        <div>{c.contact_name}</div>
                                        <div className="text-slate" style={{ fontSize: '0.8rem' }}>{c.phone}</div>
                                    </td>
                                    <td>
                                        {(() => {
                                            const clientProjects = getClientProjects(c.id);
                                            return clientProjects.length > 0 ? (
                                                clientProjects.map((p, i) => (
                                                    <Link key={p.id} to={`/projects/${p.id}`} className="project-tag" title="Ver proyecto">
                                                        {p.name}
                                                    </Link>
                                                ))
                                            ) : (
                                                <span className="text-slate" style={{ fontSize: '0.8rem' }}>Sin proyectos</span>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <span className={`status-dot ${c.active ? 'status-active' : 'status-inactive'}`}></span>
                                        {c.active ? 'Activo' : 'Inactivo'}
                                    </td>
                                    <td>
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                            <>
                                                <button className="icon-btn" title="Editar" onClick={() => openEdit(c)}>✏️</button>
                                                <button className="icon-btn" title="Visibilidad" onClick={() => toggleVisibility(c)}>
                                                    {c.active ? '👁️' : '🚫'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Client Modal */}
            {showModal && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="card modal-card" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                            {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                        </h3>
                        <form onSubmit={handleSaveClient}>
                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="client-name" className="input-label">NOMBRE DE LA EMPRESA</label>
                                    <input id="client-name" type="text" className="form-input" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="client-industry" className="input-label">INDUSTRIA</label>
                                    <input id="client-industry" type="text" className="form-input" required
                                        value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label htmlFor="client-contact" className="input-label">PERSONA DE CONTACTO</label>
                                <input id="client-contact" type="text" className="form-input" required
                                    value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="client-email" className="input-label">EMAIL</label>
                                    <input id="client-email" type="email" className="form-input" required
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="client-phone" className="input-label">TELÉFONO</label>
                                    <input id="client-phone" type="text" className="form-input"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>

                            {/* Dynamic Fields - Categorized */}
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
                                                        <input
                                                            type={field.type}
                                                            className="form-input"
                                                            value={formData.custom_data[field.name] || ''}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                custom_data: { ...formData.custom_data, [field.name]: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">GUARDAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Field Manager Modal */}
            {showFieldModal && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="card modal-card" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                            <h3>Administrador de Campos</h3>
                            <button className="btn btn-sm" onClick={() => handleNewField()}>+ Nuevo</button>
                        </div>

                        {/* List of Fields */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                            {fields.map(f => (
                                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    <div style={{ opacity: f.active ? 1 : 0.5 }}>
                                        <span style={{ fontWeight: '600', display: 'block' }}>{f.label} <span style={{ fontSize: '0.7em', color: 'var(--color-accent)' }}>({f.category})</span></span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>ID: {f.name} | {f.type.toUpperCase()}</span>
                                    </div>
                                    <button className="icon-btn" onClick={() => handleEditField(f)}>✏️</button>
                                </div>
                            ))}
                        </div>

                        {/* Edit/Create Form */}
                        <form onSubmit={handleSaveField} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '4px' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--color-accent)' }}>
                                {isEditingField ? 'Editar Campo' : 'Nuevo Campo'}
                            </h4>
                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">ETIQUETA (LABEL)</label>
                                    <input type="text" className="form-input" required
                                        value={fieldData.label} onChange={e => {
                                            const val = e.target.value;
                                            setFieldData(prev => ({
                                                ...prev,
                                                label: val,
                                                name: isEditingField ? prev.name : val // Only update internal name if new
                                            }));
                                        }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">CATEGORÍA</label>
                                    <input type="text" className="form-input" list="categories"
                                        value={fieldData.category} onChange={e => setFieldData({ ...fieldData, category: e.target.value })} />
                                    <datalist id="categories">
                                        <option value="General" />
                                        <option value="Datos Fiscales" />
                                        <option value="Operaciones" />
                                    </datalist>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">TIPO</label>
                                    <select className="form-input" style={{ background: 'var(--color-primary)' }} disabled={isEditingField}
                                        value={fieldData.type} onChange={e => setFieldData({ ...fieldData, type: e.target.value })}>
                                        <option value="text">Texto</option>
                                        <option value="number">Número</option>
                                        <option value="date">Fecha</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">ESTADO</label>
                                    <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={fieldData.active} onChange={e => setFieldData({ ...fieldData, active: e.target.checked })} style={{ marginRight: '8px' }} />
                                            Activo
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowFieldModal(false)}>CERRAR</button>
                                <button type="submit" className="btn btn-primary">{isEditingField ? 'ACTUALIZAR' : 'CREAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
