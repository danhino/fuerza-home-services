import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash, Pencil, UserPlus, Users as UsersIcon, X } from 'lucide-react';

interface User {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    role: string;
    createdAt: string;
}

interface EditForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
}

interface AddForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
}

export default function Dashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ firstName: '', lastName: '', email: '', phone: '', role: 'CUSTOMER' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState<AddForm>({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
    const [error, setError] = useState('');
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    // ── DELETE ──────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    // ── EDIT ────────────────────────────────────────────────
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone,
            role: user.role,
        });
        setError('');
    };

    const handleEditSave = async () => {
        if (!editingUser) return;
        try {
            await api.put(`/admin/users/${editingUser.id}`, editForm);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
            setEditingUser(null);
        } catch (err) {
            setError('Failed to update user.');
        }
    };

    // ── ADD ─────────────────────────────────────────────────
    const openAddModal = () => {
        setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
        setShowAddModal(true);
        setError('');
    };

    const handleAddSave = async () => {
        if (!addForm.email || !addForm.phone || !addForm.password) {
            setError('Email, Phone, and Password are required.');
            return;
        }
        try {
            await api.post('/auth/register', {
                firstName: addForm.firstName,
                lastName: addForm.lastName,
                name: `${addForm.firstName} ${addForm.lastName}`.trim() || addForm.email.split('@')[0],
                email: addForm.email,
                phone: addForm.phone,
                password: addForm.password,
                role: addForm.role,
            });
            setShowAddModal(false);
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to create user. Email or phone may already exist.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1 className="header-title">
                        <UsersIcon className="header-icon" /> User Management
                    </h1>
                    <div className="header-actions">
                        <button onClick={openAddModal} className="add-user-button">
                            <UserPlus size={18} /> Add User
                        </button>
                        <button onClick={handleLogout} className="logout-button">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p>{users.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Technicians</h3>
                        <p>{users.filter(u => u.role === 'TECHNICIAN').length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Customers</h3>
                        <p>{users.filter(u => u.role === 'CUSTOMER').length}</p>
                    </div>
                </div>

                <div className="table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="font-medium">{user.firstName || ''}</td>
                                    <td className="font-medium">{user.lastName || ''}</td>
                                    <td>
                                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.email || '—'}</td>
                                    <td>{user.phone}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="action-button edit"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="action-button delete"
                                                title="Delete"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* ── Edit Modal ────────────────────────────────── */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit User</h2>
                            <button className="modal-close" onClick={() => setEditingUser(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="modal-body">
                            <label className="form-label">First Name</label>
                            <input
                                className="form-input"
                                value={editForm.firstName}
                                onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                            />
                            <label className="form-label">Last Name</label>
                            <input
                                className="form-input"
                                value={editForm.lastName}
                                onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                            />
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                            />
                            <label className="form-label">Phone</label>
                            <input
                                className="form-input"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                            <label className="form-label">Role</label>
                            <select
                                className="form-input"
                                value={editForm.role}
                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                            >
                                <option value="CUSTOMER">Customer</option>
                                <option value="TECHNICIAN">Technician</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleEditSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add User Modal ────────────────────────────── */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New User</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="modal-body">
                            <label className="form-label">First Name</label>
                            <input
                                className="form-input"
                                placeholder="First name"
                                value={addForm.firstName}
                                onChange={e => setAddForm({ ...addForm, firstName: e.target.value })}
                            />
                            <label className="form-label">Last Name</label>
                            <input
                                className="form-input"
                                placeholder="Last name"
                                value={addForm.lastName}
                                onChange={e => setAddForm({ ...addForm, lastName: e.target.value })}
                            />
                            <label className="form-label">Email *</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="user@example.com"
                                value={addForm.email}
                                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                            />
                            <label className="form-label">Phone *</label>
                            <input
                                className="form-input"
                                placeholder="1234567890"
                                value={addForm.phone}
                                onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                            />
                            <label className="form-label">Password *</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter password"
                                value={addForm.password}
                                onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                            />
                            <label className="form-label">Role</label>
                            <select
                                className="form-input"
                                value={addForm.role}
                                onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                            >
                                <option value="CUSTOMER">Customer</option>
                                <option value="TECHNICIAN">Technician</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddSave}>Create User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
