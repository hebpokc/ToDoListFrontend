import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';

const API_URL = 'https://localhost:44335';

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#22d3ee', '#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#f43f5e'];

const CURRENCY_SYMBOLS = { RUB: '₽', USD: '$', EUR: '€' };

const formatMoney = (value, currency) =>
    `${Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${CURRENCY_SYMBOLS[currency] || currency}`;

const Stats = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const fetchExpenses = async () => {
            const token = localStorage.getItem('auth_token');
            const userId = localStorage.getItem('user_id');

            if (!token || !userId) {
                setError('Вы не авторизованы');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/expense/getByUserId/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Не удалось загрузить расходы');

                const data = await response.json();
                setExpenses(data);

                const currencies = [...new Set(data.map(e => e.currency))];
                if (currencies.length > 0) {
                    setSelectedCurrency(currencies.includes('RUB') ? 'RUB' : currencies[0]);
                }
            } catch (err) {
                setError(err.message || 'Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    // Запуск анимаций графиков после загрузки
    useEffect(() => {
        if (!loading && !error) {
            const t = setTimeout(() => setAnimated(true), 100);
            return () => clearTimeout(t);
        }
    }, [loading, error]);

    const currencies = useMemo(
        () => [...new Set(expenses.map(e => e.currency))],
        [expenses]
    );

    const filtered = useMemo(
        () => expenses.filter(e => e.currency === selectedCurrency && e.amount != null),
        [expenses, selectedCurrency]
    );

    const total = useMemo(
        () => filtered.reduce((sum, e) => sum + Number(e.amount), 0),
        [filtered]
    );

    // Группировка по месяцам (последние 6)
    const monthly = useMemo(() => {
        const map = new Map();
        filtered.forEach(e => {
            const d = new Date(e.spentAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            map.set(key, (map.get(key) || 0) + Number(e.amount));
        });
        return [...map.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([key, value]) => {
                const [y, m] = key.split('-');
                const label = new Date(Number(y), Number(m) - 1, 1)
                    .toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
                return { key, label, value };
            });
    }, [filtered]);

    const maxMonthly = Math.max(...monthly.map(m => m.value), 1);

    // Группировка по задачам для «пирога»
    const byTask = useMemo(() => {
        const map = new Map();
        filtered.forEach(e => {
            const key = e.taskTitle || 'Без названия';
            map.set(key, (map.get(key) || 0) + Number(e.amount));
        });
        return [...map.entries()]
            .map(([label, value], idx) => ({ label, value, color: CHART_COLORS[idx % CHART_COLORS.length] }))
            .sort((a, b) => b.value - a.value);
    }, [filtered]);

    const avg = filtered.length > 0 ? total / filtered.length : 0;
    const maxExpense = filtered.length > 0 ? Math.max(...filtered.map(e => Number(e.amount))) : 0;

    // SVG-«пирог»
    const pieSlices = useMemo(() => {
        if (total === 0) return [];
        let angle = -90;
        return byTask.map(item => {
            const fraction = item.value / total;
            const sweep = fraction * 360;
            const start = angle;
            angle += sweep;
            return { ...item, fraction, start, sweep };
        });
    }, [byTask, total]);

    const polar = (cx, cy, r, deg) => {
        const rad = (deg * Math.PI) / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };

    const slicePath = (slice) => {
        const cx = 100, cy = 100, r = 88;
        // Полный круг одним сегментом
        if (slice.fraction >= 0.9999) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
        }
        const [x1, y1] = polar(cx, cy, r, slice.start);
        const [x2, y2] = polar(cx, cy, r, slice.start + slice.sweep);
        const largeArc = slice.sweep > 180 ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    if (loading) return (<><AnimatedBackground /><div className="loading-spinner"></div></>);

    if (error) {
        return (
            <>
                <AnimatedBackground />
                <div className="container mt-5 fade-in">
                    <div className="alert alert-danger">{error}</div>
                    <button className="btn btn-outline-light-glass" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i> Назад
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <AnimatedBackground />
            <div className="container mt-5 mb-5">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 fade-in">
                    <h2 className="page-title mb-0"><span className="shimmer-text">Статистика расходов</span></h2>
                    <div className="d-flex gap-2 align-items-center">
                        {currencies.length > 1 && (
                            <select
                                className="form-select"
                                style={{ maxWidth: 130 }}
                                value={selectedCurrency}
                                onChange={(e) => { setSelectedCurrency(e.target.value); setAnimated(false); setTimeout(() => setAnimated(true), 100); }}
                            >
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        <button className="btn btn-outline-light-glass" onClick={() => navigate('/tasks')}>
                            <i className="bi bi-list-check me-1"></i> К задачам
                        </button>
                        <button className="btn btn-outline-light-glass" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left"></i> Назад
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="alert alert-glass-info text-center fade-in">
                        <strong>Расходов пока нет.</strong> Создайте задачу с расходом, чтобы увидеть статистику.
                    </div>
                ) : (
                    <>
                        {/* Сводные карточки */}
                        <div className="row g-4 mb-4 stagger">
                            <div className="col-6 col-lg-3">
                                <div className="stat-card glass">
                                    <div className="stat-icon" style={{ color: '#c4b5fd' }}><i className="bi bi-wallet2"></i></div>
                                    <div className="stat-value shimmer-text">{formatMoney(total, selectedCurrency)}</div>
                                    <div className="stat-label">Всего потрачено</div>
                                </div>
                            </div>
                            <div className="col-6 col-lg-3">
                                <div className="stat-card glass">
                                    <div className="stat-icon" style={{ color: '#f9a8d4' }}><i className="bi bi-receipt"></i></div>
                                    <div className="stat-value">{filtered.length}</div>
                                    <div className="stat-label">Расходов</div>
                                </div>
                            </div>
                            <div className="col-6 col-lg-3">
                                <div className="stat-card glass">
                                    <div className="stat-icon" style={{ color: '#67e8f9' }}><i className="bi bi-calculator"></i></div>
                                    <div className="stat-value">{formatMoney(avg, selectedCurrency)}</div>
                                    <div className="stat-label">Средний расход</div>
                                </div>
                            </div>
                            <div className="col-6 col-lg-3">
                                <div className="stat-card glass">
                                    <div className="stat-icon" style={{ color: '#6ee7b7' }}><i className="bi bi-arrow-up-right-circle"></i></div>
                                    <div className="stat-value">{formatMoney(maxExpense, selectedCurrency)}</div>
                                    <div className="stat-label">Самый крупный</div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4 mb-4">
                            {/* Столбчатый график по месяцам */}
                            <div className="col-lg-7">
                                <div className="glass chart-panel fade-in">
                                    <h5 className="mb-4"><i className="bi bi-bar-chart-line me-2"></i>Расходы по месяцам</h5>
                                    <div className="bar-chart">
                                        {monthly.map((m, idx) => (
                                            <div key={m.key} className="bar-col" title={formatMoney(m.value, selectedCurrency)}>
                                                <div className="bar-value">{formatMoney(m.value, selectedCurrency)}</div>
                                                <div
                                                    className="bar"
                                                    style={{
                                                        height: animated ? `${(m.value / maxMonthly) * 100}%` : '0%',
                                                        background: `linear-gradient(180deg, ${CHART_COLORS[idx % CHART_COLORS.length]}, ${CHART_COLORS[(idx + 3) % CHART_COLORS.length]}55)`,
                                                        transitionDelay: `${idx * 0.1}s`
                                                    }}
                                                ></div>
                                                <div className="bar-label">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* «Пирог» по задачам */}
                            <div className="col-lg-5">
                                <div className="glass chart-panel fade-in">
                                    <h5 className="mb-3"><i className="bi bi-pie-chart me-2"></i>По задачам</h5>
                                    <div className="d-flex justify-content-center">
                                        <svg viewBox="0 0 200 200" className={`pie-svg ${animated ? 'pie-animated' : ''}`}>
                                            {pieSlices.map((slice, idx) => (
                                                <path
                                                    key={slice.label}
                                                    d={slicePath(slice)}
                                                    fill={slice.color}
                                                    stroke="#14102e"
                                                    strokeWidth="2"
                                                    style={{ animationDelay: `${idx * 0.12}s` }}
                                                >
                                                    <title>{`${slice.label}: ${formatMoney(slice.value, selectedCurrency)} (${(slice.fraction * 100).toFixed(1)}%)`}</title>
                                                </path>
                                            ))}
                                            <circle cx="100" cy="100" r="52" fill="#1c1740" />
                                            <text x="100" y="95" textAnchor="middle" className="pie-center-label">Всего</text>
                                            <text x="100" y="114" textAnchor="middle" className="pie-center-value">
                                                {Number(total).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency}
                                            </text>
                                        </svg>
                                    </div>
                                    <div className="pie-legend mt-3">
                                        {byTask.map(item => (
                                            <div key={item.label} className="pie-legend-item">
                                                <span className="pie-dot" style={{ background: item.color }}></span>
                                                <span className="pie-legend-label" title={item.label}>{item.label}</span>
                                                <span className="pie-legend-value">
                                                    {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Таблица расходов */}
                        <div className="glass chart-panel fade-in">
                            <h5 className="mb-3"><i className="bi bi-table me-2"></i>Все расходы</h5>
                            <div className="table-responsive">
                                <table className="table expense-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Задача</th>
                                            <th>Категория</th>
                                            <th>Дата</th>
                                            <th className="text-end">Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(e => (
                                            <tr key={e.id}>
                                                <td>{e.taskTitle || '—'}</td>
                                                <td>{e.categoryName || '—'}</td>
                                                <td>{new Date(e.spentAt).toLocaleDateString('ru-RU')}</td>
                                                <td className="text-end fw-semibold">{formatMoney(e.amount, e.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default Stats;
