import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

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
            setError("Пароль содержит недопустимые символы");
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
        <div className="login-container">
            <div className="login-form">
                <h1>Вход в систему</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        <label htmlFor="username">Email</label>
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

                    <button type="submit" className="btn btn-custom w-100">Войти</button>

                    <div className="text-center mt-3">
                        <p>Нет аккаунта? <a href="/auth/register" className="text-primary">Зарегистрироваться</a></p>
                    </div>

                    {error && <div className="text-danger text-center mt-2">{errorMessage}</div>}
                </form>
            </div>
        </div>
    );
};

export default Login;