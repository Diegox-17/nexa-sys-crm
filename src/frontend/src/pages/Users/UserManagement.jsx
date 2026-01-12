import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import './UserManagement.css';
import '../../components/Sidebar.css';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'user',
        password: ''
    });

    // BUG-041 FIX: Memorizar función fetch con useCallback
    const fetchUsers = useCallback(async () => {
        try {
            const data = await usersAPI.getAll();
            setUsers(data);
        } catch (err) {
            console.error("Error fetching users", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await usersAPI.toggleStatus(id, !currentStatus);
            fetchUsers();
        } catch (err) {
            console.error("Error toggling status", err);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await usersAPI.update(editingId, formData);
            } else {
                await usersAPI.create(formData);
            }
            setShowModal(false);
            setFormData({ username: '', email: '', role: 'user', password: '' });
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            console.error("Error saving user", err);
            alert(err.message || 'Error al guardar usuario');
        }
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username,
            email: user.email,
            role: user.role,
            password: '' // Leave empty to keep existing password
        });
        setEditingId(user.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await usersAPI.delete(id);
            fetchUsers();
        } catch (err) {
            console.error("Error deleting user", err);
            alert(err.message || 'Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className={`layout ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            <header className="topbar">
                <div className="breadcrumbs">SISTEMA / ADMIN / GESTIÓN_USUARIOS</div>
                <div className="user-menu">
                    <span>{user?.username}</span>
                    <div className="avatar">{user?.username.substring(0, 2).toUpperCase()}</div>
                </div>
            </header>

            <main className="main-content animate-fade-in">
                <div className="page-header">
                    <div>
                        <h1>Gestión de Usuarios</h1>
                        <p className="text-slate" style={{ fontSize: '0.875rem' }}>Administración de credenciales y permisos del sistema.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ username: '', email: '', role: 'user', password: '' });
                        setShowModal(true);
                    }}>+ NUEVO USUARIO</button>
                </div>

                <div className="search-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar por nombre o email..."
                        style={{ maxWidth: '400px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="form-input"
                        style={{ maxWidth: '200px', background: 'var(--color-primary)' }}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Todos los Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                    </select>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>IDENTIFICADOR</th>
                                <th>USUARIO</th>
                                <th>EMAIL CORPORATIVO</th>
                                <th>ROL</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u, idx) => (
                                <tr key={u.id}>
                                    <td><span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>#NX-{idx + 101}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                                                {u.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            {u.username}
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge badge-${u.role || 'user'}`}>{(u.role || 'user').toUpperCase()}</span></td>
                                    <td>
                                        <span className={`status-dot ${u.active ? 'status-active' : 'status-inactive'}`}></span>
                                        {u.active ? 'Activo' : 'Inactivo'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                onClick={() => handleToggleStatus(u.id, u.active)}
                                                title={u.active ? 'Desactivar' : 'Activar'}
                                            >
                                                {u.active ? '🚫' : '✅'}
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'var(--color-primary)' }}
                                                onClick={() => handleEdit(u)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                onClick={() => handleDelete(u.id)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="card modal-card">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                            {editingId ? 'Editar Usuario' : 'Registrar Nuevo Operador'}
                        </h3>
                        <form onSubmit={handleSaveUser}>
                            <div className="input-group">
                                <label htmlFor="user-username" className="input-label">NOMBRE DE USUARIO</label>
                                <input
                                    id="user-username"
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej. cruiz"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="user-email" className="input-label">EMAIL CORPORATIVO</label>
                                <input
                                    id="user-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="c.ruiz@nexa-sys.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="user-role" className="input-label">ASIGNAR ROL</label>
                                    <select
                                        id="user-role"
                                        className="form-input"
                                        style={{ background: 'var(--color-primary)' }}
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="user-password" className="input-label">CLAVE TEMPORAL</label>
                                    <input
                                        id="user-password"
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'GUARDAR CAMBIOS' : 'DAR DE ALTA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
