import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddTask = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: new Date().toISOString().slice(0, 16),
        categoryId: '',
        statusId: '',
        withExpense: false,
        amount: 0,
        currency: 'RUB',
        spentAt: new Date().toISOString().slice(0, 16)
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);

    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('auth_token');

    useEffect(() => {
        const fetchCategories = async () => {
            const token = localStorage.getItem('auth_token');
            try {
                const response = await fetch(`https://localhost:44335/api/category/getAll`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Ошибка при загрузке категорий');

                const data = await response.json();
                setCategories(data);
            } catch (err) {
                console.error('Ошибка загрузки категорий:', err);
            }
        };

        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!userId) {
            setError('Вы не авторизованы');
            return;
        }

        try {
            const dueDateUTC = new Date(formData.dueDate).toISOString();

            const response = await fetch(`https://localhost:44335/api/task/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    dueDate: dueDateUTC,
                    categoryId: formData.categoryId,
                    statusId: formData.statusId,
                    userId
                })
            });

            if (!response.ok) {
                throw new Error('Не удалось создать задачу');
            }

            const taskData = await response.json();

            if (formData.withExpense) {
                const expenseResponse = await fetch(`https://localhost:44335/api/expense/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        Amount: formData.amount,
                        Currency: formData.currency,
                        SpentAt: new Date(formData.spentAt).toISOString(),
                        TaskId: taskData.id || taskData.Id
                    })
                });

                if (!expenseResponse.ok) {
                    throw new Error('Не удалось создать расход');
                }
            }

            setSuccess('Задача успешно создана!');
            setFormData({
                title: '',
                description: '',
                dueDate: new Date().toISOString().slice(0, 16),
                categoryId: '',
                statusId: ''
            });

            setTimeout(() => navigate('/tasks'), 1500);
        } catch (err) {
            setError(err.message || 'Ошибка при создании задачи');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Создать новую задачу</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Заголовок задачи</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Описание</label>
                    <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="dueDate" className="form-label">Дата и время завершения</label>
                    <input
                        type="datetime-local"
                        id="dueDate"
                        name="dueDate"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="categoryId" className="form-label">Категория</label>
                    <select
                        id="categoryId"
                        name="categoryId"
                        className="form-select"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Выберите категорию</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="statusId" className="form-label">Статус</label>
                    <select
                        id="statusId"
                        name="statusId"
                        className="form-select"
                        value={formData.statusId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Выберите статус</option>
                        <option value="7f3fe6fd-5bc1-4167-9b6c-6b5320fe729c">В процессе</option>
                        <option value="e3453112-6a24-4bee-87c7-cc38121ee6d9">Выполнено</option>
                    </select>
                </div>

                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        id="withExpense"
                        name="withExpense"
                        className="form-check-input"
                        checked={formData.withExpense}
                        onChange={handleChange}
                    />
                    <label htmlFor="withExpense" className="form-check-label">
                        Добавить расход
                    </label>
                </div>

                {formData.withExpense && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="amount" className="form-label">Сумма</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                className="form-control"
                                value={formData.amount}
                                onChange={handleChange}
                                min="0"
                                step="any"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="currency" className="form-label">Валюта</label>
                            <select
                                id="currency"
                                name="currency"
                                className="form-select"
                                value={formData.currency}
                                onChange={handleChange}
                            >
                                <option value="RUB">RUB</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="spentAt" className="form-label">Дата расхода</label>
                            <input
                                type="datetime-local"
                                id="spentAt"
                                name="spentAt"
                                className="form-control"
                                value={formData.spentAt}
                                onChange={handleChange}
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary w-100 mb-3">
                    Создать задачу
                </button>

                <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left"></i> Назад
                </button>
            </form>
        </div>
    );
};

export default AddTask;