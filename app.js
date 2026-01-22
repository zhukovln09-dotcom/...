// Главное приложение
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение запущено!');
    
    initApp();
});

async function initApp() {
    // 1. Настройка навигации
    setupNavigation();
    
    // 2. Проверка и загрузка данных
    await checkAndLoadData();
    
    // 3. Настройка обработчиков
    setupEventHandlers();
}

// Навигация
function setupNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const pageId = this.dataset.page;
            
            // Обновляем кнопки
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем страницу
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${pageId}-page`) {
                    page.classList.add('active');
                    
                    // Загружаем данные для страницы
                    if (pageId === 'projects') {
                        loadProjects();
                    }
                }
            });
        });
    });
}

// Проверка и загрузка начальных данных
async function checkAndLoadData() {
    try {
        // Проверяем подключение
        if (!window.database) {
            throw new Error('База данных не загрузилась');
        }
        
        // Загружаем статистику для главной страницы
        const stats = await window.database.getStats();
        document.getElementById('projects-count').textContent = stats.projectsCount;
        document.getElementById('ideas-count').textContent = stats.ideasCount;
        
        // Предзагружаем проекты
        await loadProjects();
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showMessage('Ошибка загрузки данных. Проверьте подключение.', 'error');
    }
}

// Загрузка проектов
async function loadProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Загрузка проектов...</div>';
    
    try {
        const projects = await window.database.getProjects();
        
        if (!projects || projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Пока нет проектов. Будьте первым!</p>
                    <button onclick="showSubmitPage()">Создать проект</button>
                </div>
            `;
            return;
        }
        
        // Отображаем проекты
        container.innerHTML = '';
        projects.forEach(project => {
            container.appendChild(createProjectCard(project));
        });
        
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки проектов</div>';
    }
}

// Создание карточки проекта
function createProjectCard(project) {
    const div = document.createElement('div');
    div.className = 'project-card';
    
    const date = project.created_at 
        ? new Date(project.created_at).toLocaleDateString('ru-RU')
        : 'Недавно';
    
    div.innerHTML = `
        <h3>${escapeHtml(project.title || 'Без названия')}</h3>
        <p>${escapeHtml(project.description || 'Нет описания')}</p>
        <div class="project-meta">
            <small>Автор: ${escapeHtml(project.author || 'Аноним')}</small>
            <small>Дата: ${date}</small>
            <small>Голосов: ${project.votes || 0}</small>
        </div>
        <button class="vote-btn" data-id="${project.id}">
            👍 Поддержать (${project.votes || 0})
        </button>
    `;
    
    // Обработчик голосования
    const voteBtn = div.querySelector('.vote-btn');
    voteBtn.addEventListener('click', async function() {
        const projectId = this.dataset.id;
        await voteForProject(projectId, this);
    });
    
    return div;
}

// Голосование за проект
async function voteForProject(projectId, button) {
    if (!window.database) {
        alert('База данных не доступна');
        return;
    }
    
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Голосую...';
    
    try {
        // Получаем текущие голоса
        const projects = await window.database.getProjects();
        const project = projects.find(p => p.id == projectId);
        
        if (!project) {
            throw new Error('Проект не найден');
        }
        
        const newVotes = (project.votes || 0) + 1;
        
        // Обновляем в базе
        const success = await window.database.updateProject(projectId, { votes: newVotes });
        
        if (success) {
            // Обновляем кнопку
            button.textContent = `👍 Поддержать (${newVotes})`;
            
            // Обновляем статистику
            const stats = await window.database.getStats();
            document.getElementById('projects-count').textContent = stats.projectsCount;
            
            showMessage('Спасибо за ваш голос!', 'success');
        } else {
            throw new Error('Не удалось обновить голоса');
        }
        
    } catch (error) {
        console.error('Ошибка голосования:', error);
        button.textContent = originalText;
        showMessage('Ошибка при голосовании', 'error');
    } finally {
        button.disabled = false;
    }
}

// Создание нового проекта
async function createProject() {
    const titleInput = document.getElementById('project-title');
    const descInput = document.getElementById('project-description');
    const authorInput = document.getElementById('project-author');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const author = authorInput.value.trim();
    
    // Проверка
    if (!title || !description) {
        showMessage('Заполните название и описание', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Создание...';
    
    try {
        const project = {
            title,
            description,
            author: author || 'Аноним',
            votes: 0,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        const newProject = await window.database.createProject(project);
        
        if (newProject) {
            // Очищаем форму
            titleInput.value = '';
            descInput.value = '';
            authorInput.value = '';
            
            // Показываем успех
            showMessage('Проект успешно создан!', 'success');
            
            // Обновляем статистику
            const stats = await window.database.getStats();
            document.getElementById('projects-count').textContent = stats.projectsCount;
            
            // Переходим к проектам и обновляем
            document.querySelector('.nav-btn[data-page="projects"]').click();
            await loadProjects();
            
        } else {
            throw new Error('Не удалось создать проект');
        }
        
    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        showMessage('Ошибка при создании проекта', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Опубликовать';
    }
}

// Настройка обработчиков событий
function setupEventHandlers() {
    // Кнопка создания проекта
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', createProject);
    }
    
    // Нажатие Enter в полях формы
    const inputs = document.querySelectorAll('#submit-page input, #submit-page textarea');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                createProject();
            }
        });
    });
}

// Вспомогательные функции
function showSubmitPage() {
    document.querySelector('.nav-btn[data-page="submit"]').click();
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Делаем функции глобальными для обработчиков в HTML
window.showSubmitPage = showSubmitPage;
window.loadProjects = loadProjects;
