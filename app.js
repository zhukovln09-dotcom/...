// Конфигурация Supabase
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co';
const SUPABASE_KEY = 'sb_secret_D8RCyUo1i7prvB9OCTzbkQ_dpAUUY_F';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Текущий пользователь
let currentUser = JSON.parse(localStorage.getItem('school_user')) || null;

// DOM элементы
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');

// Открытие/закрытие модального окна
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Форма входа
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const grade = document.getElementById('grade').value;
        
        if (!email || !username || !grade) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        // Простая авторизация (без пароля)
        currentUser = {
            email: email,
            name: username,
            grade: grade,
            id: Date.now().toString() // Простой ID
        };
        
        localStorage.setItem('school_user', JSON.stringify(currentUser));
        updateUIForUser();
        loginModal.style.display = 'none';
        alert(`Добро пожаловать, ${username}!`);
    });
}

// Обновление интерфейса для пользователя
function updateUIForUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (currentUser && loginBtn) {
        loginBtn.textContent = currentUser.name;
        loginBtn.style.background = '#ff7e5f';
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        // Получаем количество идей
        const { data: ideas, error: ideasError } = await supabaseClient
            .from('ideas')
            .select('*');
        
        if (!ideasError) {
            document.getElementById('ideasCount').textContent = ideas?.length || 0;
            
            // Считаем общее количество голосов
            const totalVotes = ideas?.reduce((sum, idea) => sum + (idea.votes || 0), 0) || 0;
            document.getElementById('votesCount').textContent = totalVotes;
            
            // Считаем реализованные проекты (пример)
            document.getElementById('projectsCount').textContent = ideas?.filter(i => i.status === 'completed').length || 0;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка популярных идей
async function loadFeaturedIdeas() {
    try {
        const { data: ideas, error } = await supabaseClient
            .from('ideas')
            .select('*')
            .order('votes', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        const container = document.getElementById('featuredIdeas');
        if (container && ideas) {
            container.innerHTML = '';
            
            ideas.forEach(idea => {
                const ideaCard = document.createElement('div');
                ideaCard.className = 'idea-card';
                ideaCard.innerHTML = `
                    <div class="idea-header">
                        <div class="idea-title">${idea.title}</div>
                        <div class="idea-votes">${idea.votes || 0} 👍</div>
                    </div>
                    <div class="idea-author">${idea.author_name}, ${idea.author_grade} класс</div>
                    <p>${idea.description.substring(0, 100)}...</p>
                    <div class="idea-tags">
                        ${(idea.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;
                container.appendChild(ideaCard);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки идей:', error);
    }
}

// Голосование за идею
async function voteForIdea(ideaId) {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему, чтобы голосовать');
        return;
    }
    
    try {
        // Проверяем, голосовал ли уже пользователь
        const { data: existingVotes } = await supabaseClient
            .from('votes')
            .select('*')
            .eq('idea_id', ideaId)
            .eq('voter_name', currentUser.name);
        
        if (existingVotes && existingVotes.length > 0) {
            alert('Вы уже голосовали за эту идею!');
            return;
        }
        
        // Добавляем голос
        const { error: voteError } = await supabaseClient
            .from('votes')
            .insert({
                idea_id: ideaId,
                voter_name: currentUser.name
            });
        
        if (voteError) throw voteError;
        
        // Обновляем счетчик голосов в идее
        const { data: idea } = await supabaseClient
            .from('ideas')
            .select('votes')
            .eq('id', ideaId)
            .single();
        
        const newVotes = (idea?.votes || 0) + 1;
        
        await supabaseClient
            .from('ideas')
            .update({ votes: newVotes })
            .eq('id', ideaId);
        
        alert('Ваш голос учтен!');
        loadFeaturedIdeas();
        loadStats();
        
    } catch (error) {
        console.error('Ошибка голосования:', error);
        alert('Не удалось проголосовать');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateUIForUser();
    loadStats();
    loadFeaturedIdeas();
    
    // Экспортируем функции для использования в других файлах
    window.voteForIdea = voteForIdea;
    window.currentUser = currentUser;
    window.supabaseClient = supabaseClient;
});
