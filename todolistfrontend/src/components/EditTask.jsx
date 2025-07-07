import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditTask = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [expenseFields, setExpenseFields] = useState(false);
    const [categories, setCategories] = useState([]);

    const EXPENSE_CATEGORY_ID = '1310203f-a74e-4c9e-8086-44e87e9e9fed';

    const [task, setTask] = useState({
        title: '',
        description: '',
        dueDate: new Date().toISOString().slice(0, 16),
        categoryId: '',
        statusId: ''
    });

    const [expense, setExpense] = useState({
        id: null,
        amount: 0,
        currency: 'RUB',
        spentAt: new Date().toISOString().slice(0, 16)
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            setError('Вы не авторизованы');
            return;
        }

        const fetchTaskAndCategories = async () => {
            try {
                const categoryResponse = await fetch(`https://localhost:44335/api/category/getAll`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!categoryResponse.ok) throw new Error('Ошибка при загрузке категорий');

                const categoriesData = await categoryResponse.json();
                setCategories(categoriesData);

                const taskResponse = await fetch(`https://localhost:44335/api/task/getById/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!taskResponse.ok) {
                    throw new Error('Не удалось загрузить данные задачи');
                }

                const data = await taskResponse.json();

                setTask(prev => ({
                    ...prev,
                    title: data.title || '',
                    description: data.description || '',
                    dueDate: new Date(data.dueDate).toISOString().slice(0, 16),
                    categoryId: data.categoryId || '',
                    statusId: data.statusId || ''
                }));

                const isExpense = data.categoryId === EXPENSE_CATEGORY_ID;
                setExpenseFields(isExpense);

                if (isExpense) {
                    const expenseResponse = await fetch(`https://localhost:44335/api/expense/getByTaskId/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (expenseResponse.ok) {
                        const expenseData = await expenseResponse.json();
                        setExpense({
                            id: expenseData.id || expenseData.Id,
                            amount: expenseData.amount || 0,
                            currency: expenseData.currency || 'RUB',
                            spentAt: new Date(expenseData.spentAt).toISOString().slice(0, 16)
                        });
                    }
                }
            } catch (err) {
                setError(err.message || 'Ошибка при загрузке данных');
            }
        };

        fetchTaskAndCategories();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        if (name === 'categoryId') {
            const isExpenseCategory = value === EXPENSE_CATEGORY_ID;
            setExpenseFields(isExpenseCategory);
        }

        if (expenseFields && name in expense) {
            setExpense(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
        } else {
            setTask(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const token = localStorage.getItem('auth_token');

        if (!token) {
            setError('Вы не авторизованы');
            return;
        }

        try {
            const userId = localStorage.getItem('user_id');

            const taskResponse = await fetch(`https://localhost:44335/api/task/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Title: task.title,
                    Description: task.description,
                    DueDate: new Date(task.dueDate).toISOString(),
                    CategoryId: task.categoryId,
                    StatusId: task.statusId,
                    UserId: userId
                })
            });

            if (!taskResponse.ok) {
                throw new Error('Не удалось обновить задачу');
            }

            if (expenseFields && expense.id) {
                const expenseResponse = await fetch(`https://localhost:44335/api/expense/update/${expense.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        Amount: expense.amount,
                        Currency: expense.currency,
                        SpentAt: new Date(expense.spentAt).toISOString()
                    })
                });

                if (!expenseResponse.ok) {
                    throw new Error('Не удалось обновить информацию о расходе');
                }
            }

            setSuccess('Задача успешно обновлена!');
            setTimeout(() => navigate('/tasks'), 1500);
        } catch (err) {
            setError(err.message || 'Произошла ошибка при обновлении задачи');
        }
    };

    const handleDelete = async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            alert('Вы не авторизованы');
            return;
        }

        const confirmDelete = window.confirm('Вы уверены, что хотите удалить эту задачу?');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`https://localhost:44335/api/task/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить задачу');
            }

            setSuccess('Задача успешно удалена!');
            setTimeout(() => navigate('/tasks'), 1500);
        } catch (err) {
            setError(err.message || 'Ошибка при удалении задачи');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Редактировать задачу</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Заголовок</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        value={task.title}
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
                        value={task.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="dueDate" className="form-label">Срок выполнения</label>
                    <input
                        type="datetime-local"
                        id="dueDate"
                        name="dueDate"
                        className="form-control"
                        value={task.dueDate}
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
                        value={task.categoryId}
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
                        value={task.statusId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Выберите статус</option>
                        <option value="7f3fe6fd-5bc1-4167-9b6c-6b5320fe729c">В процессе</option>
                        <option value="e3453112-6a24-4bee-87c7-cc38121ee6d9">Выполнено</option>
                    </select>
                </div>

                {expenseFields && (
                    <>
                        <hr />
                        <h5>Дополнительно: Расход</h5>

                        <div className="mb-3">
                            <label htmlFor="amount" className="form-label">Сумма</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                className="form-control"
                                value={expense.amount}
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
                                value={expense.currency}
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
                                value={expense.spentAt}
                                onChange={handleChange}
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary w-100 mb-2"> 
                    Сохранить изменения
                </button>

                <button
                    type="button"
                    className="btn btn-outline-danger w-100 mb-2"
                    onClick={handleDelete}
                >
                    <i className="bi bi-trash"></i> Удалить задачу
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

export default EditTask;