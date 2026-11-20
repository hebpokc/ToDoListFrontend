import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

const Register = () => {
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(false);
        setErrorMessage('');

        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        const hasCyrillic = /[а-яёА-ЯЁ]/.test(password);

        if (hasCyrillic) {
            setError(true);
            setErrorMessage('Пароль содержит недопустимые символы');
            return;
        }

        try {
            await registerUser(username, email, password);
            navigate('/auth/login');
        } catch (err) {
            setError(true);
            setErrorMessage(err.message || 'Ошибка регистрации');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <span className="auth-logo">📝</span>
                <h1>Регистрация пользователя</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        <label htmlFor="username">Логин</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="form-control"
                            placeholder="Введите ваш логин"
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="email">Почта</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            placeholder="Введите вашу почту"
                            required
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-control"
                            placeholder="Введите ваш пароль"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-2">Регистрация</button>

                    <div className="text-center mt-3">
                        <p className="mb-0">Уже есть аккаунт? <a href="/auth/login">Войти</a></p>
                    </div>

                    {error && <div className="text-danger text-center mt-2">{errorMessage}</div>}
                </form>
            </div>
        </div>
    );
};

export default Register;
