import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
        const data = await authAPI.login(username, password);
            console.log('[LOGIN DEBUG] Login response:', data);
            console.log('[LOGIN DEBUG] user_info received:', data.user_info);
            console.log('[LOGIN DEBUG] user_info.role:', data.user_info?.role);
            console.log('[LOGIN DEBUG] user_info keys:', Object.keys(data.user_info || {}));
            login(data.user_info, data.token);
            console.log('[LOGIN DEBUG] After login - localStorage user:', localStorage.getItem('user'));
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        }
    };

    return (
        <div className="login-layout container">
            <div className="grid-bg">
                <div className="scan-line"></div>
            </div>
            <div className="login-card animate-fade-in">
                <div className="brand-logo">
                    <img src="/assets/Logo Dark Sin Fondo.png" alt="Nexa-Sys Logo" />
                    <p className="brand-tagline">Laboratorio de Ingeniería de Negocios</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username" className="input-label">ID DE ACCESO</label>
                            <input
                                id="username"
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="usr_88291..."
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password" className="input-label">CLAVE DE SEGURIDAD</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div style={{ marginTop: '2rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Iniciar Sesión
                            </button>
                        </div>
                    </form>
                </div>
                <div className="login-footer">
                    <p>CONEXIÓN SEGURA // ENCRIPTADO: AES-256</p>
                    <p>NEXA-SYS v1.0.2</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
