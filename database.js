// =============================================
// КОНФИГУРАЦИЯ SUPABASE - ЗАМЕНИ НА СВОИ ЗНАЧЕНИЯ!
// =============================================

// ⚠️ ВАЖНО: Получи эти значения из Settings → API в Supabase
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co';  // Замени на свой Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3Z6d3h6b2h2YmJ3bG12aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI1MDMsImV4cCI6MjA4NDY0ODUwM30.01LWHc3VZmCkLZdS07iPw-Q3elf89jOYiphkW1A0zvI';           // Замени на свой anon/public key

console.log('🔧 Начинаю инициализацию Supabase...');
console.log('URL:', SUPABASE_URL);
console.log('Ключ (первые 20 символов):', SUPABASE_KEY?.substring(0, 20) + '...');

// =============================================
// ПРОСТАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ПОДКЛЮЧЕНИЯ
// =============================================
async function checkSupabaseConnection() {
    console.log('🔌 Проверяю подключение к Supabase...');
    
    try {
        // Простейший запрос для проверки
        const testUrl = `${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('Статус ответа:', response.status);
        console.log('Ответ:', response);
        
        if (response.ok) {
            console.log('✅ Подключение к Supabase успешно!');
            return true;
        } else {
            console.error('❌ Ошибка подключения. Статус:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка при проверке подключения:', error);
        return false;
    }
}

// =============================================
// ОСНОВНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С БАЗОЙ
// =============================================
const database = {
    // Проверка подключения (используется в начале)
    async testConnection() {
        return await checkSupabaseConnection();
    },
    
    // Получить все проекты
    async getProjects() {
        try {
            console.log('📥 Запрашиваю проекты...');
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Получено ${data.length} проектов`);
            return data;
        } catch (error) {
            console.error('❌ Ошибка при получении проектов:', error);
            return [];
        }
    },
    
    // Создать новый проект
    async createProject(projectData) {
        try {
            console.log('➕ Создаю проект:', projectData.title);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: projectData.title,
                    description: projectData.description,
                    author: projectData.author || 'Аноним',
                    votes: 0,
                    status: 'active',
                    created_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка создания проекта:', errorText);
                throw new Error(`Ошибка: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Проект создан, ID:', data[0]?.id);
            return data[0];
        } catch (error) {
            console.error('❌ Ошибка:', error);
            throw error;
        }
    },
    
    // Получить идеи для проекта
    async getIdeas(projectId) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?select=*&project_id=eq.${projectId}&order=votes.desc`, 
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения идей:', error);
            return [];
        }
    },
    
    // Добавить идею
    async addIdea(ideaData) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/ideas`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    project_id: ideaData.projectId,
                    content: ideaData.content,
                    author: ideaData.author || 'Аноним',
                    votes: 0,
                    created_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
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
            // 1. Сначала получаем текущее количество голосов
            const getResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/projects?select=votes&id=eq.${projectId}`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!getResponse.ok) throw new Error('Не удалось получить проект');
            
            const projectData = await getResponse.json();
            const currentVotes = projectData[0]?.votes || 0;
            
            // 2. Увеличиваем голоса
            const updateResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes: currentVotes + 1 })
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
            const getResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?select=votes&id=eq.${ideaId}`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (!getResponse.ok) throw new Error('Не удалось получить идею');
            
            const ideaData = await getResponse.json();
            const currentVotes = ideaData[0]?.votes || 0;
            
            const updateResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ votes: currentVotes + 1 })
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
            const [projectsRes, ideasRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/projects?select=id`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }),
                fetch(`${SUPABASE_URL}/rest/v1/ideas?select=votes`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                })
            ]);
            
            const projects = projectsRes.ok ? await projectsRes.json() : [];
            const ideas = ideasRes.ok ? await ideasRes.json() : [];
            
            return {
                projectsCount: projects.length,
                ideasCount: ideas.length,
                totalVotes: ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0)
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return { projectsCount: 0, ideasCount: 0, totalVotes: 0 };
        }
    }
};

// =============================================
// ДЕЛАЕМ ФУНКЦИИ ДОСТУПНЫМИ ГЛОБАЛЬНО
// =============================================
window.database = database;

// =============================================
// АВТОМАТИЧЕСКАЯ ПРОВЕРКА ПРИ ЗАГРУЗКЕ
// =============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Страница загружена, проверяю подключение...');
    
    // Ждем 1 секунду, чтобы всё точно загрузилось
    setTimeout(async () => {
        const isConnected = await database.testConnection();
        
        if (isConnected) {
            console.log('🎉 База данных работает! Загружаю данные...');
            showNotification('✅ База данных подключена', 'success');
            
            // Загружаем начальные данные
            setTimeout(() => {
                loadInitialData();
            }, 1000);
            
        } else {
            console.error('💥 Не удалось подключиться к базе данных');
            showNotification('❌ Ошибка подключения к базе данных. Проверьте консоль (F12)', 'error');
            
            // Показываем подробную ошибку
            setTimeout(() => {
                alert(
                    'ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ\n\n' +
                    'Возможные причины:\n' +
                    '1. Неправильный URL или ключ Supabase\n' +
                    '2. Таблицы не созданы в Supabase\n' +
                    '3. Проблемы с интернет-соединением\n\n' +
                    'Откройте консоль (F12 → Console) для подробной информации.'
                );
            }, 500);
        }
    }, 1000);
});

// =============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================
function showNotification(message, type) {
    // Удаляем старое уведомление, если есть
    const oldNotification = document.getElementById('connection-notification');
    if (oldNotification) oldNotification.remove();
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.id = 'connection-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.style.background = type === 'success' ? '#4CAF50' : '#f44336';
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Убираем через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

async function loadInitialData() {
    try {
        console.log('📊 Загружаю начальные данные...');
        const stats = await database.getStats();
        
        // Обновляем статистику на странице
        document.getElementById('projects-count').textContent = stats.projectsCount;
        document.getElementById('ideas-count').textContent = stats.ideasCount;
        document.getElementById('votes-count').textContent = stats.totalVotes;
        
        console.log('📊 Статистика загружена:', stats);
    } catch (error) {
        console.error('Ошибка загрузки начальных данных:', error);
    }
}

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = database;
}
