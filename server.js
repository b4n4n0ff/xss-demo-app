const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для отдельной страницы поиска вакансий
app.get('/jobs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jobs.html'));
}); // <-- Вот эта строчка закрывает функцию app.get
// Имитация базы данных в оперативной памяти сервера (для Stored XSS)
let reviews = [
    { name: "Иван Соколов", company: "ООО 'Вектор'", text: "ApexTech разработали нам отличную CRM-систему. Продуктивность выросла на 40%!" },
    { name: "Дарья Меньшова", company: "FinTech Group", text: "Очень довольны аудитом безопасности. Команда настоящих профессионалов." }
];

// Глобальный переключатель режима безопасности системы
let isSecureMode = false;


function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// 1. ЭНДПОИНТЫ ДЛЯ STORED XSS (ОТЗЫВЫ)
// ==========================================

app.get('/api/reviews', (req, res) => {
    if (isSecureMode) {
        const safeReviews = reviews.map(r => ({
            name: escapeHTML(r.name),
            company: escapeHTML(r.company),
            text: escapeHTML(r.text)
        }));
        return res.json(safeReviews);
    }
    res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
    const { name, company, text } = req.body;
    if (name && text) {
        reviews.push({ name, company: company || "Частное лицо", text });
        return res.status(201).json({ success: true });
    }
    res.status(400).json({ error: "Заполните обязательные поля" });
});


// ==========================================
// 2. ЭНДПОИНТ ДЛЯ REFLECTED XSS (ПОИСК)
// ==========================================
app.get('/api/search', (req, res) => {
    const query = req.query.q || '';
    
    if (isSecureMode) {
        // Очищаем строку запроса перед возвратом пользователю
        return res.json({ query: escapeHTML(query) });
    }
    
    // Возвращаем вредоносный скрипт обратно в неизменном виде
    res.json({ query: query });
});


// ==========================================
// 3. УПРАВЛЕНИЕ СТЕНДОМ ЗАЩИТЫ
// ==========================================
app.post('/api/toggle-security', (req, res) => {
    isSecureMode = !isSecureMode;
    res.json({ isSecureMode });
});

app.get('/api/security-status', (req, res) => {
    res.json({ isSecureMode });
});

app.listen(PORT, () => {
    console.log(`[OK] Корпоративный портал запущен на http://localhost:${PORT}`);
});