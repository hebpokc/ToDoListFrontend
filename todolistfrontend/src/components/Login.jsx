import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import AnimatedBackground from './AnimatedBackground';

const Login = () => {
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(false);
        setErrorMessage('');

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const hasCyrillic = /[а-яёА-ЯЁ]/.test(password);

        if (hasCyrillic) {
            setError(true);
            setErrorMessage('Пароль содержит недопустимые символы');
            return;
        }

        try {
            const result = await loginUser(email, password);
            console.log('Вход успешен', result);
            navigate('/tasks');
        } catch (err) {
            setError(true);
            setErrorMessage(err.message || 'Произошла ошибка');
        }
    };

    return (
        <>
            <AnimatedBackground />
            <div className="auth-page">
                <div className="auth-layout">
                    <div className="auth-hero">
                        <span className="hero-logo">📋</span>
                        <h1><span className="shimmer-text">TaskFlow</span></h1>
                        <p className="hero-desc">
                            Ваш персональный планировщик задач. Ставьте цели, следите за сроками,
                            группируйте дела по категориям и контролируйте расходы — всё в одном месте.
                            Напоминания о дедлайнах придут прямо на почту.
                        </p>
                        <div className="auth-features">
                            <span className="feature-chip"><i className="bi bi-list-check"></i> Задачи и дедлайны</span>
                            <span className="feature-chip"><i className="bi bi-tags"></i> Свои категории</span>
                            <span className="feature-chip"><i className="bi bi-cash-coin"></i> Учёт расходов</span>
                            <span className="feature-chip"><i className="bi bi-envelope-paper"></i> Email-напоминания</span>
                        </div>
                    </div>

                    <div className="auth-form">
                        <span className="auth-icon">🔐</span>
                        <h2><span className="shimmer-text">Вход в систему</span></h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="Введите ваш email"
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

                            <button type="submit" className="btn btn-primary w-100 py-2">Войти</button>

                            <div className="text-center mt-3">
                                <p className="mb-0">Нет аккаунта? <a href="/auth/register">Зарегистрироваться</a></p>
                            </div>

                            {error && <div className="text-danger text-center mt-2">{errorMessage}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
