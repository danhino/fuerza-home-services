import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { identifier, password });
            const { token, user } = response.data;

            if (user.role !== 'ADMIN') {
                setError('Access denied. Admin only.');
                return;
            }

            login(token, user);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Fuerza Admin</h1>
                <p className="login-subtitle">Sign in to manage your platform</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Email or Phone"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
