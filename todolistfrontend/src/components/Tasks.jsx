import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { parseJwt } from '../services/jwt';
import { useNavigate } from 'react-router-dom';

const modalStyle = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '90%'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    }
};

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryColors, setCategoryColors] = useState({});
    const navigate = useNavigate();
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

    const colorClasses = [
        'bg-primary-subtle',
        'bg-secondary-subtle',
        'bg-success-subtle',
        'bg-danger-subtle',
        'bg-warning-subtle',
        'bg-info-subtle',
        'bg-light',
        'bg-dark-subtle'
    ];

    const fixedCategoryIds = [
        'e5230e63-e0ad-4d3a-bcff-4c42d0cfb668',
        'b69e50ba-1fa5-4895-842c-f1b3ecd85016',
        '1310203f-a74e-4c9e-8086-44e87e9e9fed'
    ];

    const EXPENSE_CATEGORY_ID = '1310203f-a74e-4c9e-8086-44e87e9e9fed';
    const STATUS_IN_PROGRESS = '7f3fe6fd-5bc1-4167-9b6c-6b5320fe729c';
    const STATUS_COMPLETED = 'e3453112-6a24-4bee-87c7-cc38121ee6d9';

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('auth_token');

            const decodedToken = parseJwt(token);
            const userId = decodedToken.userId || decodedToken.sub;

            localStorage.setItem('user_id', userId);

            try {
                const tasksResponse = await fetch(`https://localhost:44335/api/task/getByUserId/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!tasksResponse.ok) {
                    throw new Error('Ошибка при получении задач');
                }

                const tasksData = await tasksResponse.json();
                setAllTasks(tasksData);
                setTasks((tasksData || []).filter(task => task.statusId !== STATUS_COMPLETED));

                const userResponse = await fetch(`https://localhost:44335/api/user/getById/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUsername(userData.username);
                } else {
                    setUsername('Пользователь');
                }
            } catch (err) {
                setError(err.message || 'Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`https://localhost:44335/api/category/getAll`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);

                const colors = {};
                data.forEach((cat, idx) => {
                    colors[cat.id] = colorClasses[idx % colorClasses.length];
                });

                setCategoryColors(colors);
            }
        };

        fetchCategories();
    }, []);

    const handleFilterChange = (e) => {
        const categoryId = e.target.value;

        if (categoryId === 'completed') {
            setTasks(allTasks.filter(task => task.statusId === STATUS_COMPLETED));
        } else if (!categoryId) {
            setTasks(allTasks.filter(task => task.statusId !== STATUS_COMPLETED));
        } else {
            setTasks(allTasks.filter(
                task => task.categoryId === categoryId && task.statusId !== STATUS_COMPLETED
            ));
        }

        setSelectedCategory(categoryId);
    };

    if (loading) return <p>Загрузка задач...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    const showExpenseDetails = async (taskId) => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            alert('Вы не авторизованы');
            return;
        }

        try {
            const response = await fetch(`https://localhost:44335/api/expense/getByTaskId/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось получить информацию о расходе');
            }

            const expense = await response.json();
            setSelectedExpense(expense);
            setIsExpenseModalOpen(true);
        } catch (err) {
            alert(err.message || 'Не удалось загрузить данные о расходе');
        }
    };

    const closeModal = () => {
        setIsExpenseModalOpen(false);
        setSelectedExpense(null);
    };

    const markAsCompleted = async (taskId) => {
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`https://localhost:44335/api/task/markAsCompleted/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось обновить статус задачи');
            }

            setTasks(prev => prev.filter(t => t.id !== taskId));
            setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true } : t));
        } catch (err) {
            alert(err.message || 'Ошибка при обновлении статуса');
        }
    };

    const handleAddCategory = async () => {
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`https://localhost:44335/api/category/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCategoryName })
            });

            if (!response.ok) throw new Error('Ошибка при создании категории');

            setNewCategoryName('');
            setIsAddCategoryModalOpen(false);

            const updated = await fetch(`https://localhost:44335/api/category/getAll`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await updated.json();
            setCategories(data);
            const colors = {};
            data.forEach((cat, idx) => {
                colors[cat.id] = colorClasses[idx % colorClasses.length];
            });
            setCategoryColors(colors);
        } catch (err) {
            alert(err.message || 'Не удалось добавить категорию');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const token = localStorage.getItem('auth_token');

        if (fixedCategoryIds.includes(categoryId)) {
            alert('Эту категорию нельзя удалить.');
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить категорию?')) return;

        try {
            const response = await fetch(`https://localhost:44335/api/category/delete/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Ошибка при удалении категории');

            const updated = categories.filter(cat => cat.id !== categoryId);
            setCategories(updated);

            const colors = {};
            updated.forEach((cat, idx) => {
                colors[cat.id] = colorClasses[idx % colorClasses.length];
            });
            setCategoryColors(colors);
        } catch (err) {
            alert(err.message || 'Не удалось удалить категорию');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    if (tasks.length === 0) {
        return (
            <div className="container mt-5">
                <h3>Добро пожаловать, {username}</h3>
                <h2 className="mb-4">Ваши задачи</h2>
                <div className="d-flex justify-content-between mb-4">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/add-task')}
                    >
                        <i className="bi bi-plus-circle"></i> Добавить новую задачу
                    </button>
                    <div className="ms-auto d-flex gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/profile')}
                        >
                            <i className="bi bi-person-fill"></i> Редактировать профиль
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right"></i> Выйти
                        </button>
                    </div>
                </div>
                <button className="btn btn-sm btn-outline-primary mb-4" onClick={() => setIsAddCategoryModalOpen(true)}>
                    ➕ Добавить категорию
                </button>

                <div className="alert alert-info text-center">
                    <strong>У вас пока нет задач.</strong> Добавьте новую задачу, чтобы начать.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h3>Добро пожаловать, {username}</h3>
            <h2 className="mb-4">Ваши задачи</h2>

            <div className="d-flex justify-content-between mb-4">
                <button 
                className="btn btn-primary"
                    onClick={() => navigate('/add-task')}
                >
                    <i className="bi bi-plus-circle"></i> Добавить новую задачу
                </button>
                <div className="ms-auto d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/profile')}
                    >
                        <i className="bi bi-person-fill"></i> Редактировать профиль
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right"></i> Выйти
                    </button>
                </div>
            </div>
            <button className="btn btn-sm btn-outline-primary mb-4" onClick={() => setIsAddCategoryModalOpen(true)}>
                ➕ Добавить категорию
            </button>

            <div className="d-flex align-items-center gap-2 mb-2">
                <h6 className="fs-5 m-0">Цветовая легенда по категориям:</h6>
                <ul className="list-unstyled d-flex flex-wrap gap-3 fs-5">
                    {categories.map(cat => (
                        <li key={cat.id} className="d-flex align-items-center gap-2">
                            <span
                                className={`badge ${categoryColors[cat.id] || 'bg-light'} text-dark`}
                                style={{ width: '100px', textAlign: 'center', position: 'relative' }}
                            >
                                {cat.name}
                            </span>
                            {!fixedCategoryIds.includes(cat.id) && (
                                <button
                                    className="btn btn-sm btn-outline-danger p-1"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    title="Удалить категорию"
                                >
                                    ✕
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="w-25 mt-3 mb-4">
                <label htmlFor="categoryFilter" className="form-label">Фильтр по категории</label>
                <select
                    id="categoryFilter"
                    className="form-select"
                    value={selectedCategory}
                    onChange={handleFilterChange}
                >
                    <option value="">Все категории</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                    <option value="completed">Выполненные</option>
                </select>
            </div>

            <div className="row g-4">
                {tasks.map((task) => {
                    const isOverdue = new Date(task.dueDate) < new Date() && task.statusId !== STATUS_COMPLETED;
                    return (
                        <div key={task.id} className="col-md-6 col-lg-4">
                            <div className={`card shadow-sm h-100 position-relative ${categoryColors[task.categoryId] || 'bg-light'}`}>
                                {isOverdue && (
                                    <div className="position-absolute top-0 end-0 m-2 text-danger fw-bold">
                                        ⏰ Просрочено
                                    </div>
                                )}
                                <div className={`card-body d-flex flex-column pt-5 ${task.statusId === STATUS_COMPLETED ? 'text-decoration-line-through text-muted' : ''}`}
                                    style={{ paddingTop: isOverdue ? '3rem' : '1rem' }}
                                >
                                    <h5 className="card-title">{task.title}</h5>
                                    <p className="card-text text-muted">{task.description || 'Описание отсутствует'}</p>

                                    <p className="card-text">
                                        <strong>Срок:</strong>{' '}
                                        {new Date(task.dueDate).toLocaleString('ru-RU', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>

                                    <p className="card-text">
                                        <strong>Статус:</strong>{' '}
                                        {task.statusId === STATUS_COMPLETED ? '✅ Выполнено' : '🕒 В процессе'}
                                    </p>

                                    <div className="mt-auto d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-sm btn-warning"
                                            onClick={() => navigate(`/edit-task/${task.id}`)}
                                        >
                                            <i className="bi bi-pencil-square"></i> Редактировать
                                        </button>

                                        {task.statusId !== STATUS_COMPLETED && (
                                            <button
                                                className="btn btn-sm btn-success text-white shadow-sm"
                                                onClick={() => markAsCompleted(task.id)}
                                            >
                                                <i className="bi bi-check2-circle"></i> Выполнено
                                            </button>
                                        )}

                                        {task.categoryId === EXPENSE_CATEGORY_ID && (
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => showExpenseDetails(task.id)}
                                            >
                                                <i className="bi bi-info-circle"></i> Подробнее
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                )})}
            </div>
            <Modal
                isOpen={isAddCategoryModalOpen}
                onRequestClose={() => setIsAddCategoryModalOpen(false)}
                style={modalStyle}
                ariaHideApp={false}
                shouldCloseOnOverlayClick={true}
                contentLabel="Добавить категорию"
            >
                <h4>Добавить новую категорию</h4>
                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Введите название"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="d-flex justify-content-end gap-2">
                    <button className="btn btn-secondary" onClick={() => setIsAddCategoryModalOpen(false)}>Отмена</button>
                    <button className="btn btn-primary" onClick={handleAddCategory}>Создать</button>
                </div>
            </Modal>

            <Modal
                isOpen={isExpenseModalOpen}
                onRequestClose={closeModal}
                style={modalStyle}
                ariaHideApp={false}
                shouldCloseOnOverlayClick={true}
                contentLabel="Информация о расходе"
            >
                <h4>Информация о расходе</h4>
                {selectedExpense ? (
                    <div>
                        <p><strong>Сумма:</strong> {selectedExpense.amount} {selectedExpense.currency}</p>
                        <p><strong>Дата:</strong> {new Date(selectedExpense.spentAt).toLocaleString('ru-RU')}</p>
                    </div>
                ) : (
                    <p>Нет данных о расходе</p>
                )}

                <div className="d-flex justify-content-end">
                    <button className="btn btn-secondary" onClick={closeModal}>
                        Закрыть
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
