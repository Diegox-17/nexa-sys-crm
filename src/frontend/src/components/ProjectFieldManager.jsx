import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';

/**
 * ProjectFieldManager - Component for managing custom fields for projects
 * BUG #026: Admin interface for project_field_definitions
 */
const ProjectFieldManager = ({ show, onClose }) => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all'
    const [isEditingField, setIsEditingField] = useState(false);
    const [fieldData, setFieldData] = useState({
        id: null,
        name: '',
        label: '',
        type: 'text',
        category: 'General',
        is_required: false,
        sort_order: 0,
        options: [],
        active: true
    });

    const fetchFields = async () => {
        try {
            const data = activeTab === 'all' 
                ? await projectsAPI.getAllFields()
                : await projectsAPI.getFields();
            setFields(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            fetchFields();
        }
    }, [show, activeTab]);

    const validateFieldForm = (data) => {
        const errors = [];
        
        if (!data.label?.trim()) {
            errors.push('La etiqueta del campo es obligatoria');
        }
        
        if (!data.name?.trim()) {
            errors.push('El identificador del campo es obligatorio');
        }
        
        // Validar formato del nombre
        if (data.name && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
            errors.push('El identificador debe comenzar con una letra y contener solo letras, números y guiones bajos');
        }
        
        // Validar que el nombre no exista
        const existingField = fields.find(f => f.name === data.name && f.id !== data.id);
        if (existingField) {
            errors.push('Ya existe un campo con este identificador');
        }
        
        // Validar opciones para select/multiselect
        if ((data.type === 'select' || data.type === 'multiselect') && (!data.options || data.options.length === 0)) {
            errors.push('Los campos de tipo selección requieren al menos una opción');
        }
        
        // Validar sort_order
        if (data.sort_order && (isNaN(data.sort_order) || parseInt(data.sort_order) < 0)) {
            errors.push('El orden de presentación debe ser un número positivo');
        }

        return errors;
    };

    const handleSaveField = async (e) => {
        e.preventDefault();

        const validationErrors = validateFieldForm(fieldData);
        if (validationErrors.length > 0) {
            alert('Por favor corrija los siguientes errores:\n\n' + validationErrors.join('\n'));
            return;
        }

        try {
            if (isEditingField) {
                await projectsAPI.updateField(fieldData.id, fieldData);
            } else {
                await projectsAPI.createField(fieldData);
            }
            resetFieldForm();
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

    const handleDeleteField = async (fieldId) => {
        if (!window.confirm('¿Está seguro de eliminar este campo?')) return;
        
        try {
            await projectsAPI.deleteField(fieldId);
            fetchFields();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar campo');
        }
    };

    const resetFieldForm = () => {
        setFieldData({ 
            id: null, 
            name: '', 
            label: '', 
            type: 'text', 
            category: 'General', 
            is_required: false, 
            sort_order: 0, 
            options: [], 
            active: true 
        });
        setIsEditingField(false);
    };

    const handleNewField = () => {
        resetFieldForm();
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex' }}>
            <div className="card modal-card" style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
                    <h3>Administrador de Campos - Proyectos</h3>
                    <button className="btn btn-sm" onClick={handleNewField}>+ Nuevo Campo</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                    <button
                        className={`btn ${activeTab === 'active' ? 'active' : ''}`}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'active' ? 'var(--color-secondary)' : 'var(--color-accent)',
                            borderBottom: `2px solid ${activeTab === 'active' ? 'var(--color-secondary)' : 'transparent'}`,
                            padding: '0.75rem 1.5rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase'
                        }}
                        onClick={() => setActiveTab('active')}
                    >
                        Campos Activos ({fields.filter(f => f.active).length})
                    </button>
                    <button
                        className={`btn ${activeTab === 'all' ? 'active' : ''}`}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'all' ? 'var(--color-secondary)' : 'var(--color-accent)',
                            borderBottom: `2px solid ${activeTab === 'all' ? 'var(--color-secondary)' : 'transparent'}`,
                            padding: '0.75rem 1.5rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase'
                        }}
                        onClick={() => setActiveTab('all')}
                    >
                        Todos los Campos
                    </button>
                </div>

                {/* List of Fields */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-accent)', padding: '1rem' }}>Cargando campos...</div>
                    ) : fields.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-accent)', padding: '1rem' }}>No hay campos configurados</div>
                    ) : (
                        fields.map(f => (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                <div style={{ opacity: f.active ? 1 : 0.5 }}>
                                    <span style={{ fontWeight: '600', display: 'block' }}>
                                        {f.label} <span style={{ fontSize: '0.7em', color: 'var(--color-secondary)' }}>({f.category})</span>
                                    </span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        ID: {f.name} | {f.type.toUpperCase()} {!f.active && '| INACTIVO'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" onClick={() => handleEditField(f)} title="Editar">✏️</button>
                                    {activeTab === 'all' && (
                                        <button className="icon-btn" onClick={() => handleDeleteField(f.id)} title="Eliminar">🗑️</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
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
                                        name: isEditingField ? prev.name : val.toLowerCase().replace(/\s+/g, '_')
                                    }));
                                }} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">IDENTIFICADOR (ID)</label>
                            <input type="text" className="form-input" value={fieldData.name} disabled style={{ opacity: 0.5 }} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">CATEGORÍA</label>
                            <input type="text" className="form-input" list="project-categories"
                                value={fieldData.category} onChange={e => setFieldData({ ...fieldData, category: e.target.value })} />
                            <datalist id="project-categories">
                                <option value="General" />
                                <option value="Técnico" />
                                <option value="Gestión" />
                                <option value="Agile" />
                                <option value="Financiero" />
                            </datalist>
                        </div>
                        <div className="input-group">
                            <label className="input-label">TIPO DE DATO</label>
                            <select className="form-input" style={{ background: 'var(--color-primary)' }} disabled={isEditingField}
                                value={fieldData.type} onChange={e => setFieldData({ ...fieldData, type: e.target.value })}>
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="date">Fecha</option>
                                <option value="url">URL</option>
                                <option value="email">Email</option>
                                <option value="select">Lista Desplegable</option>
                                <option value="multiselect">Multi-selección</option>
                                <option value="checkbox">Casilla de verificación</option>
                                <option value="textarea">Texto Largo</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">VALORES (Para select/multiselect)</label>
                            <input type="text" className="form-input" placeholder="React; Vue; Angular; Node.js"
                                value={fieldData.options?.join('; ') || ''}
                                onChange={e => setFieldData({ ...fieldData, options: e.target.value.split(';').map(s => s.trim()).filter(Boolean) })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">ORDEN DE PRESENTACIÓN</label>
                            <input type="number" className="form-input" value={fieldData.sort_order} min="1"
                                onChange={e => setFieldData({ ...fieldData, sort_order: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">REQUERIDO</label>
                            <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={fieldData.is_required} onChange={e => setFieldData({ ...fieldData, is_required: e.target.checked })} style={{ marginRight: '8px' }} />
                                    Campo obligatorio
                                </label>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">ESTADO</label>
                            <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={fieldData.active} onChange={e => setFieldData({ ...fieldData, active: e.target.checked })} style={{ marginRight: '8px' }} />
                                    Activo
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn" onClick={onClose}>CERRAR</button>
                        {isEditingField && activeTab === 'all' && (
                            <button type="button" className="btn" onClick={() => handleDeleteField(fieldData.id)}>ELIMINAR CAMPO</button>
                        )}
                        <button type="submit" className="btn btn-primary">{isEditingField ? 'ACTUALIZAR' : 'CREAR'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectFieldManager;