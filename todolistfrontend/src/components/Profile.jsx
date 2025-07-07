import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const loadUser = async () => {
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');

        if (!token || !userId) {
            setError('Вы не авторизованы');
            return;
        }

        try {
            const response = await fetch(`https://localhost:44335/api/user/getById/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении данных пользователя');
            }

            const userData = await response.json();
            setFormData(prev => ({
                ...prev,
                username: userData.username,
                email: userData.email
            }));
        } catch (err) {
            setError(err.message || 'Не удалось загрузить данные');
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');

        if (!token || !userId) {
            setError('Токен или ID пользователя отсутствует');
            return;
        }

        try {
            const response = await fetch(`https://localhost:44335/api/user/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось обновить профиль');
            }

            setSuccess('Данные успешно обновлены!');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: ''
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container mt-5">

            <h2 className="mb-4">Редактирование профиля</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Имя пользователя</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-control"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">Текущий пароль</label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        className="form-control"
                        value={formData.currentPassword}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">Новый пароль</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        className="form-control"
                        value={formData.newPassword}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-4">
                    <button type="submit" className="btn btn-primary w-100 mb-2">
                        Сохранить изменения
                    </button>

                    <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left"></i> Назад
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;