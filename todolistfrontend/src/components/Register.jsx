import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import AnimatedBackground from './AnimatedBackground';

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
        <>
            <AnimatedBackground />
            <div className="auth-page">
                <div className="auth-layout">
                    <div className="auth-hero">
                        <span className="hero-logo">🚀</span>
                        <h1><span className="shimmer-text">Начните сегодня</span></h1>
                        <p className="hero-desc">
                            Создайте аккаунт за минуту и получите порядок в делах:
                            задачи с дедлайнами, категории, учёт расходов
                            и напоминания на почту — ничего не забудется.
                        </p>
                        <div className="auth-features">
                            <span className="feature-chip"><i className="bi bi-lightning-charge"></i> Быстрый старт</span>
                            <span className="feature-chip"><i className="bi bi-shield-lock"></i> Безопасный вход</span>
                            <span className="feature-chip"><i className="bi bi-graph-up-arrow"></i> Прогресс задач</span>
                        </div>
                    </div>

                    <div className="auth-form">
                        <span className="auth-icon">📝</span>
                        <h2><span className="shimmer-text">Регистрация</span></h2>

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

                            <button type="submit" className="btn btn-primary w-100 py-2">Создать аккаунт</button>

                            <div className="text-center mt-3">
                                <p className="mb-0">Уже есть аккаунт? <a href="/auth/login">Войти</a></p>
                            </div>

                            {error && <div className="text-danger text-center mt-2">{errorMessage}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
