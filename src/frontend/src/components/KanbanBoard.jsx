import React from 'react';

const KanbanBoard = ({ tasks, projectId, onStatusChange, userRole, users = [], onEditTask }) => {
    // Group tasks by status
    const columns = {
        'pendiente': tasks.filter(t => t.status === 'pendiente'),
        'en_progreso': tasks.filter(t => t.status === 'en_progreso'),
        'completada': tasks.filter(t => t.status === 'completada'), // Waiting for approval
        'aprobada': tasks.filter(t => t.status === 'aprobada')
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onStatusChange(taskId, newStatus);
        }
    };

    // Helper to get assigned user name
    const getAssignedName = (task) => {
        if (task.assigned_name) return task.assigned_name;
        if (task.assigned_to && (users || []).length > 0) {
            const user = users.find(u => u.id === task.assigned_to);
            return user ? user.username : 'Sin Asignar';
        }
        return 'Sin Asignar';
    };

    return (
        <div className="board-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', paddingBottom: '1rem', overflowX: 'auto' }}>
            {Object.keys(columns).map(status => (
                <div
                    key={status}
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    style={{
                        background: 'rgba(11, 30, 59, 0.3)', border: '1px dashed var(--color-glass-border)', borderRadius: '4px', padding: '1rem', minHeight: '400px'
                    }}
                >
                    <div className="column-header" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${getStatusColor(status)}`, marginBottom: '1rem', textTransform: 'uppercase', color: getStatusColor(status) }}>
                        {formatStatus(status)} ({columns[status].length})
                    </div>

                    {columns[status].map(task => (
                        <div
                            key={task.id}
                            className="task-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            style={{
                                background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', cursor: 'grab',
                                borderLeft: `3px solid ${getStatusColor(status)}`
                            }}
                        >
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{task.description}</div>
                            <div className="task-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                                <span>#{task.id}</span>
                                <span>{getAssignedName(task)}</span>
                            </div>

                            {/* Action Buttons - Combined Row */}
                            <div className="task-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {status === 'pendiente' && (
                                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.65rem', flex: '1' }} onClick={() => onStatusChange(task.id, 'en_progreso')}>INICIAR →</button>
                                )}
                                {status === 'en_progreso' && (
                                    <button className="btn" style={{ padding: '4px 8px', fontSize: '0.65rem', flex: '1', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', background: 'transparent' }} onClick={() => onStatusChange(task.id, 'completada')}>COMPLETAR ✔</button>
                                )}
                                {status === 'completada' && (userRole === 'admin' || userRole === 'manager') && (
                                    <button className="btn" style={{ padding: '4px 8px', fontSize: '0.65rem', flex: '1', border: '1px solid #10B981', color: '#10B981', background: 'transparent' }} onClick={() => onStatusChange(task.id, 'aprobada')}>APROBAR ⭐</button>
                                )}
                                {/* Edit Button - Only for Admin/Manager */}
                                {(userRole === 'admin' || userRole === 'manager') && onEditTask && (
                                    <button
                                        className="btn btn-sm"
                                        style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
                                        onClick={() => onEditTask(task)}
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const formatStatus = (status) => status.replace('_', ' ');

const getStatusColor = (status) => {
    switch (status) {
        case 'pendiente': return '#64748B';
        case 'en_progreso': return '#00F0FF';
        case 'completada': return '#F59E0B'; // Warning color (needs approval)
        case 'aprobada': return '#10B981';
        default: return '#64748B';
    }
};

export default KanbanBoard;
