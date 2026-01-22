// =============================================
// КОНФИГУРАЦИЯ SUPABASE - ЗАМЕНИ ЭТИ ЗНАЧЕНИЯ!
// =============================================

// ⚠️ ПОЛУЧИ ЭТИ ЗНАЧЕНИЯ ИЗ SUPABASE: Settings → API
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3Z6d3h6b2h2YmJ3bG12aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI1MDMsImV4cCI6MjA4NDY0ODUwM30.01LWHc3VZmCkLZdS07iPw-Q3elf89jOYiphkW1A0zvI';

console.log('=== НАСТРОЙКА SUPABASE ===');
console.log('URL:', SUPABASE_URL);
console.log('Ключ (первые 10 символов):', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) + '...' : 'НЕ УСТАНОВЛЕН');

// =============================================
// УЛУЧШЕННЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С SUPABASE
// =============================================

const Database = {
    // Проверка подключения
    async testConnection() {
        console.log('🔄 Проверка подключения к Supabase...');
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            console.log('📡 Статус проверки подключения:', response.status);
            
            if (response.ok) {
                console.log('✅ Подключение к Supabase успешно!');
                return true;
            } else {
                console.error('❌ Ошибка подключения. Статус:', response.status);
                const errorText = await response.text();
                console.error('Детали ошибки:', errorText);
                return false;
            }
        } catch (error) {
            console.error('❌ Сетевая ошибка при подключении:', error);
            return false;
        }
    },
    
    // Получить все проекты (исправленная версия)
    async getProjects() {
        console.log('📥 Запрос проектов из базы данных...');
        
        try {
            // URL для запроса проектов
            const url = `${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`;
            
            console.log('📡 Отправляю запрос на:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📊 Статус ответа:', response.status);
            console.log('📊 Заголовки ответа:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка HTTP при получении проектов:', response.status);
                console.error('❌ Текст ошибки:', errorText);
                
                // Пробуем получить более простой запрос
                console.log('🔄 Пробую альтернативный запрос...');
                return await this.getProjectsSimple();
            }
            
            const data = await response.json();
            console.log(`✅ Успешно получено ${data.length} проектов`);
            console.log('📋 Пример проекта:', data.length > 0 ? {
                id: data[0].id,
                title: data[0].title,
                votes: data[0].votes
            } : 'Нет проектов');
            
            return data;
            
        } catch (error) {
            console.error('❌ Критическая ошибка при получении проектов:', error);
            
            // Пробуем использовать localStorage как запасной вариант
            const localProjects = localStorage.getItem('local_projects');
            if (localProjects) {
                console.log('🔄 Использую локальные данные из localStorage');
                return JSON.parse(localProjects);
            }
            
            return [];
        }
    },
    
    // Упрощенный запрос проектов
    async getProjectsSimple() {
        try {
            const url = `${SUPABASE_URL}/rest/v1/projects`;
            console.log('🔄 Пробую упрощенный запрос на:', url);
            
            const response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Упрощенный запрос: получено ${data.length} проектов`);
                return data;
            }
            
            return [];
        } catch (error) {
            console.error('Ошибка упрощенного запроса:', error);
            return [];
        }
    },
    
    // Создать новый проект
    async createProject(projectData) {
        console.log('➕ Создание нового проекта:', projectData.title);
        
        try {
            // Проверяем обязательные поля
            if (!projectData.title || !projectData.description) {
                throw new Error('Название и описание обязательны');
            }
            
            const project = {
                title: projectData.title,
                description: projectData.description,
                author: projectData.author || 'Аноним',
                votes: 0,
                status: 'active',
                created_at: new Date().toISOString()
            };
            
            console.log('📤 Отправляю данные:', project);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(project)
            });
            
            console.log('📡 Статус создания проекта:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка создания проекта:', errorText);
                
                // Сохраняем локально если не удалось на сервер
                this.saveProjectLocally(project);
                throw new Error('Проект сохранен локально. Проблема с сервером.');
            }
            
            const data = await response.json();
            console.log('✅ Проект создан на сервере:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Ошибка при создании проекта:', error);
            throw error;
        }
    },
    
    // Сохранить проект локально (запасной вариант)
    saveProjectLocally(project) {
        try {
            const localProjects = JSON.parse(localStorage.getItem('local_projects') || '[]');
            project.id = 'local_' + Date.now();
            localProjects.push(project);
            localStorage.setItem('local_projects', JSON.stringify(localProjects));
            console.log('💾 Проект сохранен локально:', project);
        } catch (e) {
            console.error('Ошибка локального сохранения:', e);
        }
    },
    
    // Получить идеи проекта
    async getProjectIdeas(projectId) {
        try {
            console.log(`📥 Запрос идей для проекта ${projectId}...`);
            
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?project_id=eq.${projectId}&order=votes.desc`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!response.ok) {
                console.error('Ошибка получения идей:', response.status);
                return [];
            }
            
            const data = await response.json();
            console.log(`✅ Получено ${data.length} идей для проекта ${projectId}`);
            return data;
        } catch (error) {
            console.error('Ошибка при получении идей:', error);
            return [];
        }
    },
    
    // Добавить идею
    async addIdea(ideaData) {
        try {
            const idea = {
                project_id: ideaData.projectId,
                content: ideaData.content,
                author: ideaData.author || 'Аноним',
                votes: 0,
                created_at: new Date().toISOString()
            };
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/ideas`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(idea)
            });
            
            if (!response.ok) throw new Error('Ошибка создания идеи');
            
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Ошибка добавления идеи:', error);
            throw error;
        }
    },
    
    // Голосовать за проект
    async voteProject(projectId) {
        try {
            // Сначала получаем проект
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}&select=votes`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!response.ok) throw new Error('Не удалось получить проект');
            
            const data = await response.json();
            if (!data || data.length === 0) throw new Error('Проект не найден');
            
            const currentVotes = data[0].votes || 0;
            const newVotes = currentVotes + 1;
            
            // Обновляем голоса
            const updateResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes: newVotes })
                }
            );
            
            return updateResponse.ok;
        } catch (error) {
            console.error('Ошибка голосования:', error);
            return false;
        }
    },
    
    // Голосовать за идею
    async voteIdea(ideaId) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}&select=votes`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!response.ok) throw new Error('Не удалось получить идею');
            
            const data = await response.json();
            if (!data || data.length === 0) throw new Error('Идея не найдена');
            
            const currentVotes = data[0].votes || 0;
            const newVotes = currentVotes + 1;
            
            const updateResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes: newVotes })
                }
            );
            
            return updateResponse.ok;
        } catch (error) {
            console.error('Ошибка голосования за идею:', error);
            return false;
        }
    },
    
    // Получить статистику
    async getStats() {
        try {
            console.log('📊 Запрос статистики...');
            
            const [projectsRes, ideasRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/projects?select=id`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }),
                fetch(`${SUPABASE_URL}/rest/v1/ideas?select=id,votes`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                })
            ]);
            
            let projectsCount = 0;
            let ideasCount = 0;
            let totalVotes = 0;
            
            if (projectsRes.ok) {
                const projects = await projectsRes.json();
                projectsCount = projects.length;
            }
            
            if (ideasRes.ok) {
                const ideas = await ideasRes.json();
                ideasCount = ideas.length;
                totalVotes = ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0);
            }
            
            console.log(`📊 Статистика: ${projectsCount} проектов, ${ideasCount} идей, ${totalVotes} голосов`);
            
            return {
                projectsCount,
                ideasCount,
                totalVotes
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return { projectsCount: 0, ideasCount: 0, totalVotes: 0 };
        }
    }
};

// =============================================
// ИНИЦИАЛИЗАЦИЯ И ПРОВЕРКА
// =============================================

// Делаем доступным глобально
window.database = Database;

// Автоматическая проверка при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализация базы данных...');
    
    // Ждем немного для загрузки страницы
    setTimeout(async () => {
        console.log('🔍 Начинаю проверку подключения...');
        
        // Проверяем настройки
        if (!SUPABASE_URL || SUPABASE_URL.includes('ВАШ') || 
            !SUPABASE_KEY || SUPABASE_KEY.includes('ВАШ')) {
            console.error('❌ НЕ НАСТРОЕНЫ КЛЮЧИ SUPABASE!');
            showError('Не настроены ключи Supabase. Замените значения в database.js');
            return;
        }
        
        // Проверяем подключение
        const isConnected = await Database.testConnection();
        
        if (isConnected) {
            console.log('🎉 База данных готова к работе!');
            showSuccess('База данных подключена');
            
            // Тестовая загрузка проектов
            console.log('🧪 Тестовая загрузка проектов...');
            try {
                const testProjects = await Database.getProjects();
                console.log('🧪 Тест успешен! Проектов:', testProjects.length);
                
                // Если нет проектов, предлагаем создать
                if (testProjects.length === 0) {
                    console.log('ℹ️ Проектов нет. Можно создать первый!');
                }
            } catch (testError) {
                console.error('🧪 Тестовая загрузка не удалась:', testError);
            }
            
        } else {
            console.error('💥 Не удалось подключиться к базе данных');
            showError('Ошибка подключения. Проверьте настройки Supabase и консоль (F12).');
        }
    }, 500);
});

// Функции для отображения уведомлений
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Создаем стили для уведомлений
    const styleId = 'notification-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .supabase-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: notificationSlideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
            }
            @keyframes notificationSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes notificationSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-success {
                background: #4CAF50;
                border-left: 4px solid #2E7D32;
            }
            .notification-error {
                background: #f44336;
                border-left: 4px solid #c62828;
            }
            .notification-info {
                background: #2196F3;
                border-left: 4px solid #1565C0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Удаляем старое уведомление
    const oldNotification = document.querySelector('.supabase-notification');
    if (oldNotification) {
        oldNotification.style.animation = 'notificationSlideOut 0.3s ease';
        setTimeout(() => oldNotification.remove(), 300);
    }
    
    // Создаем новое уведомление
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.className = `supabase-notification notification-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }, oldNotification ? 350 : 0);
}
