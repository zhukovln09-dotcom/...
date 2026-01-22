// Основной JavaScript файл
document.addEventListener('DOMContentLoaded', function() {
    // Переменные для состояния приложения
    let currentProjectId = null;
    
    // Инициализация
    init();

    async function checkDatabaseConnection() {
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connection-status';
    connectionStatus.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: bold;
        display: none;
    `;
    document.body.appendChild(connectionStatus);

    const isConnected = await window.database.checkConnection();
    
    if (isConnected) {
        connectionStatus.textContent = '✓ База данных подключена';
        connectionStatus.style.background = '#d4edda';
        connectionStatus.style.color = '#155724';
        connectionStatus.style.border = '1px solid #c3e6cb';
        connectionStatus.style.display = 'block';
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            connectionStatus.style.display = 'none';
        }, 3000);
        
        return true;
    } else {
        connectionStatus.textContent = '✗ Нет подключения к базе данных';
        connectionStatus.style.background = '#f8d7da';
        connectionStatus.style.color = '#721c24';
        connectionStatus.style.border = '1px solid #f5c6cb';
        connectionStatus.style.display = 'block';
        
        // Показываем сообщение пользователю
        setTimeout(() => {
            alert('Внимание: Не удалось подключиться к базе данных. Некоторые функции могут не работать. Проверьте подключение к интернету и настройки Supabase.');
        }, 1000);
        
        return false;
    }
}
    
    // Основная функция инициализации
    function init() {
        loadStats();
        setupNavigation();
        loadProjects();
        setupEventListeners();
    }
    
    // Загрузка статистики
    async function loadStats() {
        const stats = await window.database.getStats();
        
        document.getElementById('projects-count').textContent = stats.projectsCount;
        document.getElementById('ideas-count').textContent = stats.ideasCount;
        document.getElementById('votes-count').textContent = stats.totalVotes;
    }
    
    // Настройка навигации
    function setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const pageId = this.dataset.page;
                
                // Обновляем активные кнопки
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Показываем выбранную страницу
                pages.forEach(page => {
                    page.classList.remove('active');
                    if (page.id === `${pageId}-page`) {
                        page.classList.add('active');
                    }
                });
                
                // Загружаем данные для страницы
                if (pageId === 'projects') {
                    loadProjects();
                } else if (pageId === 'leaderboard') {
                    loadLeaderboard();
                }
            });
        });
    }
    
    // Загрузка проектов
    async function loadProjectsPage() {
    console.log('🔄 Загружаю страницу проектов...');
    
    const container = document.getElementById('projects-list');
    if (!container) {
        console.error('❌ Контейнер projects-list не найден!');
        return;
    }
    
    // Показываем состояние загрузки
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
            </div>
            <p>Загрузка проектов...</p>
            <p class="loading-details">Пожалуйста, подождите</p>
        </div>
    `;
    
    // Добавляем стили для состояний
    addLoadingStyles();
    
    try {
        // Проверяем доступность базы данных
        if (!window.database || typeof window.database.getProjects !== 'function') {
            throw new Error('Функции базы данных не загружены');
        }
        
        console.log('📡 Запрашиваю проекты у базы данных...');
        
        // Запрашиваем проекты
        const projects = await window.database.getProjects();
        
        console.log(`📊 Получено проектов: ${projects ? projects.length : 0}`);
        
        // Проверяем результат
        if (!projects || !Array.isArray(projects)) {
            throw new Error('Некорректный ответ от базы данных');
        }
        
        if (projects.length === 0) {
            // Нет проектов - показываем сообщение
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-inbox fa-4x"></i>
                    </div>
                    <h3>Проектов пока нет</h3>
                    <p>Будьте первым, кто предложит идею для улучшения школы!</p>
                    <div class="empty-actions">
                        <button class="btn-primary" onclick="switchToSubmitPage()">
                            <i class="fas fa-plus"></i> Создать первый проект
                        </button>
                        <button class="btn-secondary" onclick="addSampleProjects()">
                            <i class="fas fa-magic"></i> Добавить примеры проектов
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Отображаем проекты
            container.innerHTML = '';
            
            // Добавляем счетчик
            const counter = document.createElement('div');
            counter.className = 'projects-counter';
            counter.innerHTML = `<i class="fas fa-project-diagram"></i> Найдено проектов: <strong>${projects.length}</strong>`;
            container.appendChild(counter);
            
            // Добавляем каждый проект
            projects.forEach((project, index) => {
                const projectElement = createProjectElement(project, index);
                container.appendChild(projectElement);
            });
            
            console.log(`✅ Отображено ${projects.length} проектов`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка при загрузке проектов:', error);
        
        // Показываем понятное сообщение об ошибке
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle fa-4x"></i>
                </div>
                <h3>Не удалось загрузить проекты</h3>
                <p>${error.message || 'Произошла ошибка при подключении к базе данных'}</p>
                <div class="error-details">
                    <details>
                        <summary>Подробности ошибки (для разработчика)</summary>
                        <pre>${error.stack || error.toString()}</pre>
                    </details>
                </div>
                <div class="error-actions">
                    <button class="btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                    <button class="btn-secondary" onclick="useDemoData()">
                        <i class="fas fa-desktop"></i> Использовать демо-данные
                    </button>
                </div>
            </div>
        `;
    }
}

// Вспомогательная функция для создания элемента проекта
function createProjectElement(project, index) {
    const div = document.createElement('div');
    div.className = 'project-card';
    div.dataset.id = project.id;
    
    // Форматируем дату
    let dateString = 'Недавно';
    if (project.created_at) {
        try {
            const date = new Date(project.created_at);
            dateString = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            console.warn('Ошибка форматирования даты:', e);
        }
    }
    
    // Определяем цвет статуса
    const statusClass = project.status === 'active' ? 'status-active' : 'status-completed';
    const statusText = project.status === 'active' ? 'Активный' : 'Завершен';
    
    // Создаем HTML
    div.innerHTML = `
        <div class="project-card-header">
            <div class="project-index">#${index + 1}</div>
            <div class="project-title-section">
                <h3 class="project-title">${escapeHtml(project.title || 'Без названия')}</h3>
                <span class="project-status ${statusClass}">
                    <i class="fas fa-${project.status === 'active' ? 'play-circle' : 'check-circle'}"></i>
                    ${statusText}
                </span>
            </div>
        </div>
        
        <div class="project-description">
            ${escapeHtml(project.description || 'Нет описания')}
        </div>
        
        <div class="project-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${escapeHtml(project.author || 'Аноним')}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${dateString}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-lightbulb"></i>
                <span>ID: ${project.id}</span>
            </div>
        </div>
        
        <div class="project-actions">
            <button class="vote-btn" data-id="${project.id}">
                <i class="fas fa-thumbs-up"></i>
                <span class="vote-count">${project.votes || 0}</span>
                <span class="vote-text">Поддержать</span>
            </button>
            
            <button class="btn-secondary view-details-btn" data-id="${project.id}">
                <i class="fas fa-comments"></i>
                <span>Обсудить</span>
            </button>
            
            <button class="btn-secondary share-btn" data-id="${project.id}">
                <i class="fas fa-share"></i>
                <span>Поделиться</span>
            </button>
        </div>
    `;
    
    // Добавляем обработчики событий
    const voteBtn = div.querySelector('.vote-btn');
    voteBtn.addEventListener('click', async function() {
        await handleProjectVote(this, project.id);
    });
    
    const viewBtn = div.querySelector('.view-details-btn');
    viewBtn.addEventListener('click', function() {
        viewProjectDetails(project.id);
    });
    
    const shareBtn = div.querySelector('.share-btn');
    shareBtn.addEventListener('click', function() {
        shareProject(project);
    });
    
    // Добавляем анимацию появления
    setTimeout(() => {
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    }, index * 100);
    
    return div;
}

// Функция для голосования
async function handleProjectVote(button, projectId) {
    if (!window.database || !window.database.voteProject) {
        alert('Функция голосования временно недоступна');
        return;
    }
    
    // Анимация нажатия
    button.classList.add('voting');
    button.disabled = true;
    
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Голосую...';
    
    try {
        const success = await window.database.voteProject(projectId);
        
        if (success) {
            // Обновляем счетчик
            const countSpan = button.querySelector('.vote-count');
            if (countSpan) {
                const currentVotes = parseInt(countSpan.textContent) || 0;
                countSpan.textContent = currentVotes + 1;
            }
            
            // Анимация успеха
            button.classList.remove('voting');
            button.classList.add('voted');
            
            // Обновляем статистику на главной
            updateHomePageStats();
            
            // Показываем уведомление
            showMessage('Спасибо за ваш голос!', 'success');
            
        } else {
            throw new Error('Не удалось проголосовать');
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        button.innerHTML = originalHTML;
        button.classList.remove('voting');
        button.disabled = false;
        
        showMessage('Ошибка при голосовании. Попробуйте позже.', 'error');
    }
}

// Вспомогательные функции
function addLoadingStyles() {
    const styleId = 'projects-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .loading-state, .empty-state, .error-state {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        
        .spinner {
            margin-bottom: 20px;
            color: #4b6cb7;
        }
        
        .loading-details {
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }
        
        .empty-icon, .error-icon {
            margin-bottom: 20px;
            color: #ccc;
        }
        
        .error-icon {
            color: #f44336;
        }
        
        .empty-state h3, .error-state h3 {
            color: #333;
            margin-bottom: 10px;
        }
        
        .empty-state p, .error-state p {
            color: #666;
            margin-bottom: 25px;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .empty-actions, .error-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .projects-counter {
            background: #f8f9fa;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 1.1em;
            color: #495057;
            border-left: 4px solid #4b6cb7;
        }
        
        .project-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
            animation: cardAppear 0.5s ease forwards;
        }
        
        @keyframes cardAppear {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        
        .project-card-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .project-index {
            background: #4b6cb7;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2em;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .project-title-section {
            flex: 1;
        }
        
        .project-title {
            margin: 0 0 8px 0;
            color: #2c3e50;
            font-size: 1.4em;
        }
        
        .project-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        
        .status-completed {
            background: #e2e3e5;
            color: #383d41;
        }
        
        .project-description {
            color: #495057;
            line-height: 1.6;
            margin-bottom: 20px;
            font-size: 1.05em;
        }
        
        .project-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .project-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .vote-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #4b6cb7, #3a56a4);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            justify-content: center;
        }
        
        .vote-btn:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(75, 108, 183, 0.3);
        }
        
        .vote-btn.voting {
            background: #6c757d;
        }
        
        .vote-btn.voted {
            background: #28a745;
        }
        
        .vote-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            padding: 10px 20px;
            background: #f8f9fa;
            color: #495057;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            justify-content: center;
        }
        
        .btn-secondary:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .error-details {
            margin: 20px 0;
            text-align: left;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .error-details details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
        }
        
        .error-details summary {
            cursor: pointer;
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
        }
        
        .error-details pre {
            background: white;
            padding: 15px;
            border-radius: 6px;
            overflow: auto;
            font-size: 0.85em;
            color: #dc3545;
            border: 1px solid #dee2e6;
        }
        
        @media (max-width: 768px) {
            .project-meta {
                flex-direction: column;
                gap: 10px;
            }
            
            .project-actions {
                flex-direction: column;
            }
            
            .project-card {
                padding: 20px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Глобальные вспомогательные функции
function switchToSubmitPage() {
    const submitBtn = document.querySelector('.nav-btn[data-page="submit"]');
    if (submitBtn) submitBtn.click();
}

function addSampleProjects() {
    const sampleProjects = [
        {
            id: 'sample_1',
            title: 'Улучшение школьной библиотеки',
            description: 'Предлагаю обновить фонд книг, добавить современную литературу и создать уютную зону для чтения.',
            author: 'Александр Петров',
            votes: 24,
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'sample_2',
            title: 'Эко-проект: раздельный сбор мусора',
            description: 'Установить контейнеры для раздельного сбора пластика, бумаги и батареек в каждой рекреации.',
            author: 'Екатерина Сидорова',
            votes: 42,
            status: 'active',
            created_at: new Date(Date.now() - 86400000).toISOString() // вчера
        }
    ];
    
    // Сохраняем в localStorage
    localStorage.setItem('sample_projects', JSON.stringify(sampleProjects));
    
    // Перезагружаем страницу проектов
    loadProjectsPage();
    
    showMessage('Демо-проекты добавлены!', 'success');
}

function useDemoData() {
    // Переключаемся на демо-режим
    window.useDemoMode = true;
    
    // Перезагружаем страницу проектов
    loadProjectsPage();
    
    showMessage('Используются демо-данные', 'info');
}

function viewProjectDetails(projectId) {
    alert(`Открываем детали проекта ${projectId}. Эта функция будет доработана.`);
    // Здесь будет модальное окно с деталями
}

function shareProject(project) {
    const text = `Посмотрите этот проект: "${project.title}"`;
    if (navigator.share) {
        navigator.share({
            title: project.title,
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Ссылка на проект скопирована!', 'success');
        });
    }
}

function updateHomePageStats() {
    // Обновляем счетчики на главной странице
    if (window.database && window.database.getStats) {
        window.database.getStats().then(stats => {
            const projectsCount = document.getElementById('projects-count');
            const ideasCount = document.getElementById('ideas-count');
            const votesCount = document.getElementById('votes-count');
            
            if (projectsCount) projectsCount.textContent = stats.projectsCount;
            if (ideasCount) ideasCount.textContent = stats.ideasCount;
            if (votesCount) votesCount.textContent = stats.totalVotes;
        });
    }
}

function showMessage(text, type) {
    const notification = document.createElement('div');
    notification.className = `message message-${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: messageSlideIn 0.3s ease;
    `;
    
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'messageSlideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для анимации сообщений
const messageStyle = document.createElement('style');
messageStyle.textContent = `
    @keyframes messageSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes messageSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(messageStyle);

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Экспортируем функции для глобального использования
window.loadProjectsPage = loadProjectsPage;
window.switchToSubmitPage = switchToSubmitPage;
window.addSampleProjects = addSampleProjects;
window.useDemoData = useDemoData;
    
    // Создание карточки проекта
    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = project.id;
        card.dataset.status = project.status;
        card.dataset.votes = project.votes;
        
        card.innerHTML = `
            <div class="project-header">
                <h3>${project.title}</h3>
                <span class="project-status ${project.status}">${project.status === 'active' ? 'Активный' : 'Завершен'}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-footer">
                <div class="project-meta">
                    <span><i class="fas fa-user"></i> ${project.author || 'Аноним'}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(project.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="project-actions">
                    <button class="vote-btn" data-id="${project.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="vote-count">${project.votes}</span>
                    </button>
                    <button class="btn-secondary view-details-btn" data-id="${project.id}">
                        <i class="fas fa-comments"></i> Обсудить
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики событий для карточки
        card.querySelector('.vote-btn').addEventListener('click', async function(e) {
            e.stopPropagation();
            const projectId = this.dataset.id;
            const success = await window.database.voteForProject(projectId);
            
            if (success) {
                const voteCount = this.querySelector('.vote-count');
                voteCount.textContent = parseInt(voteCount.textContent) + 1;
                this.classList.add('voted');
                setTimeout(() => this.classList.remove('voted'), 300);
                loadStats(); // Обновляем статистику
            }
        });
        
        card.querySelector('.view-details-btn').addEventListener('click', function() {
            openProjectModal(project.id);
        });
        
        return card;
    }
    
    // Настройка фильтров
    function setupFilters(projects) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Обновляем активную кнопку фильтра
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                const projectCards = document.querySelectorAll('.project-card');
                
                projectCards.forEach(card => {
                    let show = true;
                    
                    if (filter === 'active') {
                        show = card.dataset.status === 'active';
                    } else if (filter === 'popular') {
                        show = parseInt(card.dataset.votes) > 5;
                    }
                    
                    card.style.display = show ? 'block' : 'none';
                });
            });
        });
    }
    
    // Открытие модального окна с деталями проекта
    async function openProjectModal(projectId) {
        currentProjectId = projectId;
        const modal = document.getElementById('project-modal');
        const projectDetails = document.getElementById('modal-project-details');
        const ideasList = document.getElementById('modal-ideas-list');
        
        // Загрузка проекта
        const projects = await window.database.getAllProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            projectDetails.innerHTML = `
                <h2>${project.title}</h2>
                <p class="project-meta">
                    <i class="fas fa-user"></i> ${project.author || 'Аноним'} | 
                    <i class="fas fa-calendar"></i> ${new Date(project.created_at).toLocaleDateString('ru-RU')} | 
                    <i class="fas fa-thumbs-up"></i> ${project.votes} голосов
                </p>
                <p>${project.description}</p>
            `;
        }
        
        // Загрузка идей
        await loadProjectIdeas(projectId);
        
        // Показываем модальное окно
        modal.style.display = 'block';
    }
    
    // Загрузка идей для проекта
    async function loadProjectIdeas(projectId) {
        const ideasList = document.getElementById('modal-ideas-list');
        ideasList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка идей...</div>';
        
        const ideas = await window.database.getProjectIdeas(projectId);
        
        if (ideas.length === 0) {
            ideasList.innerHTML = '<p class="no-ideas">Пока нет предложений. Будьте первым!</p>';
            return;
        }
        
        ideasList.innerHTML = '<h3><i class="fas fa-lightbulb"></i> Предложения</h3>';
        
        ideas.forEach(idea => {
            const ideaElement = document.createElement('div');
            ideaElement.className = 'idea-card';
            ideaElement.innerHTML = `
                <p>${idea.content}</p>
                <div class="idea-footer">
                    <span><i class="fas fa-user"></i> ${idea.author || 'Аноним'}</span>
                    <button class="vote-btn idea-vote-btn" data-id="${idea.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="vote-count">${idea.votes}</span>
                    </button>
                </div>
            `;
            
            ideaElement.querySelector('.idea-vote-btn').addEventListener('click', async function() {
                const ideaId = this.dataset.id;
                const success = await window.database.voteForIdea(ideaId);
                
                if (success) {
                    const voteCount = this.querySelector('.vote-count');
                    voteCount.textContent = parseInt(voteCount.textContent) + 1;
                    this.classList.add('voted');
                    setTimeout(() => this.classList.remove('voted'), 300);
                    loadStats(); // Обновляем статистику
                }
            });
            
            ideasList.appendChild(ideaElement);
        });
    }
    
    // Загрузка рейтинга
    async function loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка рейтинга...</div>';
        
        try {
            const projects = await window.database.getAllProjects();
            const allIdeas = [];
            
            // Собираем все идеи
            for (const project of projects) {
                const ideas = await window.database.getProjectIdeas(project.id);
                ideas.forEach(idea => {
                    idea.projectTitle = project.title;
                    allIdeas.push(idea);
                });
            }
            
            // Сортируем по количеству голосов
            allIdeas.sort((a, b) => b.votes - a.votes);
            
            // Отображаем топ-10
            if (allIdeas.length === 0) {
                leaderboardList.innerHTML = '<p class="no-data">Пока нет идей для рейтинга.</p>';
                return;
            }
            
            let html = '<div class="leaderboard-table">';
            allIdeas.slice(0, 10).forEach((idea, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                
                html += `
                    <div class="leaderboard-row ${index < 3 ? 'top-three' : ''}">
                        <div class="rank">${medal}</div>
                        <div class="idea-content">
                            <p>${idea.content}</p>
                            <small>Проект: ${idea.projectTitle} • Автор: ${idea.author || 'Аноним'}</small>
                        </div>
                        <div class="votes-count">
                            <i class="fas fa-thumbs-up"></i> ${idea.votes}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            leaderboardList.innerHTML = html;
        } catch (error) {
            console.error('Ошибка загрузки рейтинга:', error);
            leaderboardList.innerHTML = '<div class="error">Ошибка при загрузке рейтинга.</div>';
        }
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Отправка нового проекта
        document.getElementById('submit-project-btn').addEventListener('click', async function() {
            const title = document.getElementById('project-title').value.trim();
            const description = document.getElementById('project-description').value.trim();
            const author = document.getElementById('project-author').value.trim() || null;
            const user = window.auth.getUser();
            
            if (!title || !description) {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
                return;
            }
            
            const project = {
                title,
                description,
                author: author || (user ? user.name : null),
                votes: 0,
                status: 'active'
            };
            
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            
            try {
                const newProject = await window.database.createProject(project);
                
                if (newProject) {
                    showMessage('Проект успешно опубликован!', 'success');
                    document.getElementById('project-title').value = '';
                    document.getElementById('project-description').value = '';
                    document.getElementById('project-author').value = '';
                    
                    // Переключаемся на страницу проектов
                    document.querySelector('.nav-btn[data-page="projects"]').click();
                    loadProjects();
                    loadStats();
                } else {
                    showMessage('Ошибка при публикации проекта.', 'error');
                }
            } catch (error) {
                showMessage('Ошибка при подключении к базе данных.', 'error');
            } finally {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-paper-plane"></i> Опубликовать проект';
            }
        });
        
        // Отправка новой идеи
        document.getElementById('submit-idea-btn').addEventListener('click', async function() {
            const content = document.getElementById('new-idea-content').value.trim();
            const author = document.getElementById('new-idea-author').value.trim() || null;
            const user = window.auth.getUser();
            
            if (!content) {
                alert('Пожалуйста, введите предложение.');
                return;
            }
            
            if (!currentProjectId) {
                alert('Ошибка: проект не выбран.');
                return;
            }
            
            const idea = {
                project_id: currentProjectId,
                content,
                author: author || (user ? user.name : null),
                votes: 0
            };
            
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            
            try {
                const newIdea = await window.database.addIdea(idea);
                
                if (newIdea) {
                    alert('Идея успешно добавлена!');
                    document.getElementById('new-idea-content').value = '';
                    document.getElementById('new-idea-author').value = '';
                    
                    // Обновляем список идей
                    loadProjectIdeas(currentProjectId);
                    loadStats();
                } else {
                    alert('Ошибка при добавлении идеи.');
                }
            } catch (error) {
                alert('Ошибка при подключении к базе данных.');
            } finally {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-plus"></i> Добавить идею';
            }
        });
        
        // Закрытие модального окна
        document.querySelector('.close-modal').addEventListener('click', function() {
            document.getElementById('project-modal').style.display = 'none';
        });
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('project-modal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Вспомогательная функция для показа сообщений
    function showMessage(text, type) {
        const messageEl = document.getElementById('submit-message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
    
    // Стили для сообщений
    const style = document.createElement('style');
    style.textContent = `
        .message {
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            font-weight: 600;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        .error {
            text-align: center;
            padding: 2rem;
            color: #dc3545;
            background: #f8d7da;
            border-radius: 10px;
        }
        .no-projects, .no-ideas, .no-data {
            text-align: center;
            padding: 3rem;
            color: #666;
            background: #f8f9fa;
            border-radius: 15px;
        }
        .leaderboard-row {
            display: flex;
            align-items: center;
            padding: 1rem;
            margin: 0.5rem 0;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .top-three {
            background: linear-gradient(135deg, #fff9e6 0%, #fff0cc 100%);
            border-left: 4px solid #ffc107;
        }
        .rank {
            font-size: 1.5rem;
            font-weight: bold;
            min-width: 50px;
            text-align: center;
        }
        .idea-content {
            flex: 1;
            padding: 0 1rem;
        }
        .votes-count {
            font-size: 1.2rem;
            font-weight: bold;
            color: #4b6cb7;
        }
        .project-status {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .project-status.active {
            background: #d4edda;
            color: #155724;
        }
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .project-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
        }
        .voted {
            background: #45a049 !important;
            transform: scale(1.1);
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
