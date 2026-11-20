import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { parseJwt } from '../services/jwt';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://localhost:44335';

const CATEGORY_COLORS = [
    '#8b5cf6', // фиолетовый
    '#ec4899', // розовый
    '#06b6d4', // голубой
    '#10b981', // зелёный
    '#f59e0b', // янтарный
    '#3b82f6', // синий
    '#a855f7', // пурпурный
    '#f43f5e'  // красный
];

const fixedCategoryIds = [
    'e5230e63-e0ad-4d3a-bcff-4c42d0cfb668',
    'b69e50ba-1fa5-4895-842c-f1b3ecd85016',
    '1310203f-a74e-4c9e-8086-44e87e9e9fed'
];

const EXPENSE_CATEGORY_ID = '1310203f-a74e-4c9e-8086-44e87e9e9fed';
const STATUS_IN_PROGRESS = '7f3fe6fd-5bc1-4167-9b6c-6b5320fe729c';
const STATUS_COMPLETED = 'e3453112-6a24-4bee-87c7-cc38121ee6d9';

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

    const authHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('auth_token');

            const decodedToken = parseJwt(token);
            const userId = decodedToken.userId || decodedToken.sub;

            localStorage.setItem('user_id', userId);

            try {
                const tasksResponse = await fetch(`${API_URL}/api/task/getByUserId/${userId}`, {
                    method: 'GET',
                    headers: authHeaders()
                });

                if (!tasksResponse.ok) {
                    throw new Error('Ошибка при получении задач');
                }

                const tasksData = await tasksResponse.json();
                setAllTasks(tasksData);
                setTasks((tasksData || []).filter(task => task.statusId !== STATUS_COMPLETED));

                const userResponse = await fetch(`${API_URL}/api/user/getById/${userId}`, {
                    method: 'GET',
                    headers: authHeaders()
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
            const response = await fetch(`${API_URL}/api/category/getAll`, {
                headers: authHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
                applyCategoryColors(data);
            }
        };

        fetchCategories();
    }, []);

    const applyCategoryColors = (data) => {
        const colors = {};
        data.forEach((cat, idx) => {
            colors[cat.id] = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
        });
        setCategoryColors(colors);
    };

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

    if (loading) {
        return <div className="loading-spinner"></div>;
    }

    if (error) return <div className="container mt-5 fade-in"><div className="alert alert-danger">{error}</div></div>;

    const showExpenseDetails = async (taskId) => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            alert('Вы не авторизованы');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/expense/getByTaskId/${taskId}`, {
                method: 'GET',
                headers: authHeaders()
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
            const response = await fetch(`${API_URL}/api/task/markAsCompleted/${taskId}`, {
                method: 'PUT',
                headers: authHeaders()
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
            const response = await fetch(`${API_URL}/api/category/create`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name: newCategoryName })
            });

            if (!response.ok) throw new Error('Ошибка при создании категории');

            setNewCategoryName('');
            setIsAddCategoryModalOpen(false);

            const updated = await fetch(`${API_URL}/api/category/getAll`, {
                headers: authHeaders()
            });

            const data = await updated.json();
            setCategories(data);
            applyCategoryColors(data);
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
            const response = await fetch(`${API_URL}/api/category/delete/${categoryId}`, {
                method: 'DELETE',
                headers: authHeaders()
            });

            if (!response.ok) throw new Error('Ошибка при удалении категории');

            const updated = categories.filter(cat => cat.id !== categoryId);
            setCategories(updated);
            applyCategoryColors(updated);
        } catch (err) {
            alert(err.message || 'Не удалось удалить категорию');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/auth/login');
    };

    const pageHeader = (
        <>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 fade-in">
                <div>
                    <h2 className="page-title mb-1">Ваши задачи</h2>
                    <p className="welcome-sub mb-0">
                        <i className="bi bi-person-circle me-1"></i> Добро пожаловать, {username}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-light-glass"
                        onClick={() => navigate('/profile')}
                    >
                        <i className="bi bi-person-fill me-1"></i> Профиль
                    </button>
                    <button
                        className="btn btn-glass-danger"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right me-1"></i> Выйти
                    </button>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-3 align-items-center mb-4 fade-in">
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/add-task')}
                >
                    <i className="bi bi-plus-circle me-1"></i> Добавить задачу
                </button>
                <button
                    className="btn btn-outline-light-glass"
                    onClick={() => setIsAddCategoryModalOpen(true)}
                >
                    <i className="bi bi-tag me-1"></i> Новая категория
                </button>
                <select
                    className="form-select filter-select ms-auto"
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

            {categories.length > 0 && (
                <div className="d-flex flex-wrap gap-3 align-items-center mb-4 fade-in">
                    {categories.map(cat => (
                        <span key={cat.id} className="d-inline-flex align-items-center gap-1">
                            <span
                                className="cat-badge"
                                style={{ '--cat-color': categoryColors[cat.id] || '#8b5cf6' }}
                            >
                                {cat.name}
                            </span>
                            {!fixedCategoryIds.includes(cat.id) && (
                                <button
                                    className="cat-delete-btn"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    title="Удалить категорию"
                                >
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </>
    );

    if (tasks.length === 0) {
        return (
            <div className="container mt-5">
                {pageHeader}
                <div className="alert alert-glass-info text-center fade-in">
                    <strong>У вас пока нет задач.</strong> Добавьте новую задачу, чтобы начать.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 mb-5">
            {pageHeader}

            <div className="row g-4 stagger">
                {tasks.map((task) => {
                    const isCompleted = task.statusId === STATUS_COMPLETED;
                    const isOverdue = new Date(task.dueDate) < new Date() && !isCompleted;
                    return (
                        <div key={task.id} className="col-md-6 col-lg-4">
                            <div
                                className={`task-card ${isCompleted ? 'completed' : ''}`}
                                style={{ '--cat-color': categoryColors[task.categoryId] || '#8b5cf6' }}
                            >
                                {isOverdue && (
                                    <div className="overdue-badge">
                                        <i className="bi bi-alarm me-1"></i> Просрочено
                                    </div>
                                )}
                                <div className="card-body d-flex flex-column p-4">
                                    <h5 className="card-title">{task.title}</h5>
                                    <p className="card-text text-muted small">
                                        {task.description || 'Описание отсутствует'}
                                    </p>

                                    <p className="card-text mb-1 small">
                                        <i className="bi bi-calendar-event me-1"></i>
                                        <strong>Срок:</strong>{' '}
                                        {new Date(task.dueDate).toLocaleString('ru-RU', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>

                                    <p className="card-text small mb-3">
                                        <strong>Статус:</strong>{' '}
                                        {isCompleted
                                            ? <span style={{ color: '#6ee7b7' }}>✅ Выполнено</span>
                                            : <span style={{ color: '#fcd34d' }}>🕒 В процессе</span>}
                                    </p>

                                    <div className="mt-auto d-flex justify-content-end gap-2 flex-wrap">
                                        <button
                                            className="btn btn-sm btn-warning"
                                            onClick={() => navigate(`/edit-task/${task.id}`)}
                                        >
                                            <i className="bi bi-pencil-square"></i> Изменить
                                        </button>

                                        {!isCompleted && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => markAsCompleted(task.id)}
                                            >
                                                <i className="bi bi-check2-circle"></i> Готово
                                            </button>
                                        )}

                                        {task.categoryId === EXPENSE_CATEGORY_ID && (
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => showExpenseDetails(task.id)}
                                            >
                                                <i className="bi bi-info-circle"></i> Расход
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isAddCategoryModalOpen}
                onRequestClose={() => setIsAddCategoryModalOpen(false)}
                className="react-modal-content"
                overlayClassName="react-modal-overlay"
                ariaHideApp={false}
                shouldCloseOnOverlayClick={true}
                contentLabel="Добавить категорию"
            >
                <div className="p-4">
                    <h4 className="mb-3">Новая категория</h4>
                    <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Введите название"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-outline-light-glass" onClick={() => setIsAddCategoryModalOpen(false)}>Отмена</button>
                        <button className="btn btn-primary" onClick={handleAddCategory}>Создать</button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isExpenseModalOpen}
                onRequestClose={closeModal}
                className="react-modal-content"
                overlayClassName="react-modal-overlay"
                ariaHideApp={false}
                shouldCloseOnOverlayClick={true}
                contentLabel="Информация о расходе"
            >
                <div className="p-4">
                    <h4 className="mb-3">Информация о расходе</h4>
                    {selectedExpense ? (
                        <div>
                            <p><i className="bi bi-cash-coin me-2"></i><strong>Сумма:</strong> {selectedExpense.amount} {selectedExpense.currency}</p>
                            <p><i className="bi bi-calendar-event me-2"></i><strong>Дата:</strong> {new Date(selectedExpense.spentAt).toLocaleString('ru-RU')}</p>
                        </div>
                    ) : (
                        <p>Нет данных о расходе</p>
                    )}

                    <div className="d-flex justify-content-end">
                        <button className="btn btn-outline-light-glass" onClick={closeModal}>
                            Закрыть
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
