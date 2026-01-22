// =============================================
// КОНФИГУРАЦИЯ SUPABASE - ЗАМЕНИ ЭТИ ЗНАЧЕНИЯ!
// =============================================

// ⚠️ ПОЛУЧИ ЭТИ ЗНАЧЕНИЯ ИЗ SUPABASE: Settings → API
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3Z6d3h6b2h2YmJ3bG12aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI1MDMsImV4cCI6MjA4NDY0ODUwM30.01LWHc3VZmCkLZdS07iPw-Q3elf89jOYiphkW1A0zvI';

console.log('=== ПРОВЕРКА КОНФИГУРАЦИИ ===');
console.log('URL:', SUPABASE_URL);
console.log('Ключ:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'НЕТ');

// === ПРОСТЕЙШАЯ ФУНКЦИЯ ДЛЯ ЗАПРОСОВ ===
async function supabaseFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    try {
        console.log('📡 Запрос:', url);
        const response = await fetch(url, { ...options, headers });
        console.log('📊 Ответ:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Для пустых ответов (например, DELETE)
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ Ошибка запроса:', error);
        throw error;
    }
}

// === БАЗА ДАННЫХ - МИНИМАЛЬНЫЙ ФУНКЦИОНАЛ ===
window.database = {
    // Проверить подключение
    async test() {
        try {
            await supabaseFetch('');
            return true;
        } catch {
            return false;
        }
    },
    
    // Получить все проекты
    async getProjects() {
        try {
            const projects = await supabaseFetch('projects?select=*&order=created_at.desc');
            console.log(`✅ Получено проектов: ${projects.length}`);
            return projects || [];
        } catch (error) {
            console.error('❌ Ошибка получения проектов:', error);
            return [];
        }
    },
    
    // Создать проект
    async createProject(project) {
        try {
            console.log('➕ Создаю проект:', project.title);
            const result = await supabaseFetch('projects', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(project)
            });
            console.log('✅ Проект создан:', result[0]);
            return result[0];
        } catch (error) {
            console.error('❌ Ошибка создания проекта:', error);
            throw error;
        }
    },
    
    // Обновить проект (голосование)
    async updateProject(id, data) {
        try {
            await supabaseFetch(`projects?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления:', error);
            return false;
        }
    },
    
    // Получить статистику
    async getStats() {
        try {
            const [projects, ideas] = await Promise.all([
                supabaseFetch('projects?select=id'),
                supabaseFetch('ideas?select=id,votes')
            ]);
            
            return {
                projectsCount: projects?.length || 0,
                ideasCount: ideas?.length || 0,
                totalVotes: ideas?.reduce((sum, i) => sum + (i.votes || 0), 0) || 0
            };
        } catch (error) {
            console.error('Ошибка статистики:', error);
            return { projectsCount: 0, ideasCount: 0, totalVotes: 0 };
        }
    }
};

// === АВТОМАТИЧЕСКАЯ ПРОВЕРКА ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализация базы данных...');
    
    // Проверяем конфигурацию
    if (!SUPABASE_URL || SUPABASE_URL.includes('твой') || 
        !SUPABASE_KEY || SUPABASE_KEY.includes('твой')) {
        console.error('❌ КЛЮЧИ НЕ НАСТРОЕНЫ!');
        alert('Замени SUPABASE_URL и SUPABASE_KEY в database.js на свои из Supabase!');
        return;
    }
    
    // Тестируем подключение
    const isConnected = await window.database.test();
    if (isConnected) {
        console.log('✅ Подключение к Supabase установлено!');
    } else {
        console.error('❌ Не удалось подключиться к Supabase');
        alert('Ошибка подключения к базе данных. Проверь консоль (F12).');
    }
});
