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
    async function loadProjects() {
        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка проектов...</div>';
        
        try {
            const projects = await window.database.getAllProjects();
            
            if (projects.length === 0) {
                projectsList.innerHTML = `
                    <div class="no-projects">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3>Пока нет проектов</h3>
                        <p>Будьте первым, кто предложит улучшение для школы!</p>
                    </div>
                `;
                return;
            }
            
            projectsList.innerHTML = '';
            projects.forEach(project => {
                const projectCard = createProjectCard(project);
                projectsList.appendChild(projectCard);
            });
            
            // Настройка фильтров
            setupFilters(projects);
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
            projectsList.innerHTML = '<div class="error">Ошибка при загрузке проектов. Попробуйте позже.</div>';
        }
    }
    
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
