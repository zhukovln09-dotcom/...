// Переключение между страницами
async function showPage(pageName) {
    const content = document.getElementById('content');
    const buttons = document.querySelectorAll('.nav-btn');
    
    // Обновляем активную кнопку
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Показываем загрузку
    content.innerHTML = '<div class="loading">Загрузка...</div>';
    
    // Загружаем контент страницы
    switch(pageName) {
        case 'ideas':
            await showIdeasPage();
            break;
        case 'add':
            showAddPage();
            break;
        case 'top':
            await showTopPage();
            break;
    }
}

// Страница со списком идей
async function showIdeasPage() {
    const content = document.getElementById('content');
    
    try {
        // Загружаем идеи из базы данных
        const { data: ideas, error } = await supabaseClient
            .from('ideas')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        let html = `
            <div class="page">
                <h2>💡 Все идеи</h2>
                <div id="ideas-list">
        `;
        
        if (ideas.length === 0) {
            html += '<p>Идей пока нет. Будь первым!</p>';
        } else {
            ideas.forEach(idea => {
                html += `
                    <div class="idea-card" data-id="${idea.id}">
                        <h3>${idea.title}</h3>
                        <p>${idea.description}</p>
                        <div class="idea-meta">
                            <div>
                                <span>👤 ${idea.author || 'Аноним'}</span>
                                <span> | 📅 ${new Date(idea.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <button onclick="voteIdea(${idea.id})" class="vote-btn">
                                    👍 ${idea.votes || 0}
                                </button>
                                <button onclick="showComments(${idea.id})" class="comment-btn">
                                    💬 Комментарии
                                </button>
                            </div>
                        </div>
                        <div id="comments-${idea.id}" class="comment-section" style="display: none;"></div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка:', error);
        content.innerHTML = `
            <div class="page">
                <h2>Ошибка</h2>
                <p>Не удалось загрузить идеи. Попробуйте позже.</p>
            </div>
        `;
    }
}

// Страница добавления идеи
function showAddPage() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="page">
            <h2>➕ Добавить новую идею</h2>
            <form id="add-idea-form" onsubmit="submitIdea(event)">
                <div class="form-group">
                    <label for="title">Заголовок:</label>
                    <input type="text" id="title" required placeholder="Краткое описание идеи">
                </div>
                
                <div class="form-group">
                    <label for="description">Подробное описание:</label>
                    <textarea id="description" required placeholder="Опиши свою идею подробно..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="author">Имя (необязательно):</label>
                    <input type="text" id="author" placeholder="Твоё имя или класс">
                </div>
                
                <button type="submit" class="submit-btn">💡 Опубликовать идею</button>
            </form>
        </div>
    `;
}

// Страница топ идей
async function showTopPage() {
    const content = document.getElementById('content');
    
    try {
        // Загружаем идеи, отсортированные по голосам
        const { data: ideas, error } = await supabaseClient
            .from('ideas')
            .select('*')
            .order('votes', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        let html = `
            <div class="page">
                <h2>🏆 Топ-10 идей</h2>
                <div id="top-ideas">
        `;
        
        if (ideas.length === 0) {
            html += '<p>Идей пока нет. Будь первым!</p>';
        } else {
            ideas.forEach((idea, index) => {
                html += `
                    <div class="idea-card">
                        <h3>${index + 1}. ${idea.title} <span style="color: #764ba2;">👍 ${idea.votes || 0}</span></h3>
                        <p>${idea.description}</p>
                        <div class="idea-meta">
                            <span>👤 ${idea.author || 'Аноним'}</span>
                            <button onclick="voteIdea(${idea.id})" class="vote-btn">
                                👍 Голосовать
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка:', error);
        content.innerHTML = `
            <div class="page">
                <h2>Ошибка</h2>
                <p>Не удалось загрузить топ идей.</p>
            </div>
        `;
    }
}

// Отправка новой идеи
async function submitIdea(event) {
    event.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const author = document.getElementById('author').value;
    
    try {
        const { data, error } = await supabaseClient
            .from('ideas')
            .insert([
                {
                    title: title,
                    description: description,
                    author: author || 'Аноним',
                    votes: 0
                }
            ]);
        
        if (error) throw error;
        
        alert('Идея успешно добавлена!');
        
        // Очищаем форму
        event.target.reset();
        
        // Показываем страницу с идеями
        showPage('ideas');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении идеи. Попробуйте снова.');
    }
}

// Голосование за идею
async function voteIdea(ideaId) {
    try {
        // Сначала получаем текущее количество голосов
        const { data: idea, error: fetchError } = await supabaseClient
            .from('ideas')
            .select('votes')
            .eq('id', ideaId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Увеличиваем голоса на 1
        const { error: updateError } = await supabaseClient
            .from('ideas')
            .update({ votes: (idea.votes || 0) + 1 })
            .eq('id', ideaId);
        
        if (updateError) throw updateError;
        
        // Обновляем отображение
        const voteBtn = document.querySelector(`button[onclick="voteIdea(${ideaId})"]`);
        if (voteBtn) {
            voteBtn.textContent = `👍 ${(idea.votes || 0) + 1}`;
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при голосовании.');
    }
}

// Показать комментарии
async function showComments(ideaId) {
    const commentsDiv = document.getElementById(`comments-${ideaId}`);
    
    // Переключаем отображение
    if (commentsDiv.style.display === 'block') {
        commentsDiv.style.display = 'none';
        return;
    }
    
    commentsDiv.style.display = 'block';
    commentsDiv.innerHTML = '<p>Загрузка комментариев...</p>';
    
    try {
        // Загружаем комментарии
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('*')
            .eq('idea_id', ideaId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        let html = '<h4>💬 Комментарии:</h4>';
        
        if (comments.length === 0) {
            html += '<p>Комментариев пока нет.</p>';
        } else {
            comments.forEach(comment => {
                html += `
                    <div class="comment">
                        <p><strong>${comment.author || 'Аноним'}:</strong> ${comment.text}</p>
                        <small>${new Date(comment.created_at).toLocaleString()}</small>
                    </div>
                `;
            });
        }
        
        // Форма для добавления комментария
        html += `
            <div style="margin-top: 20px;">
                <input type="text" id="comment-author-${ideaId}" placeholder="Твоё имя (необязательно)" style="width: 100%; margin-bottom: 5px; padding: 5px;">
                <textarea id="comment-text-${ideaId}" placeholder="Твой комментарий..." style="width: 100%; padding: 5px; margin-bottom: 5px;"></textarea>
                <button onclick="addComment(${ideaId})" style="background: #667eea; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer;">
                    💬 Добавить комментарий
                </button>
            </div>
        `;
        
        commentsDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка:', error);
        commentsDiv.innerHTML = '<p>Ошибка загрузки комментариев.</p>';
    }
}

// Добавить комментарий
async function addComment(ideaId) {
    const author = document.getElementById(`comment-author-${ideaId}`).value;
    const text = document.getElementById(`comment-text-${ideaId}`).value;
    
    if (!text.trim()) {
        alert('Введите текст комментария');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert([
                {
                    idea_id: ideaId,
                    author: author || 'Аноним',
                    text: text
                }
            ]);
        
        if (error) throw error;
        
        // Очищаем поля
        document.getElementById(`comment-author-${ideaId}`).value = '';
        document.getElementById(`comment-text-${ideaId}`).value = '';
        
        // Обновляем комментарии
        showComments(ideaId);
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении комментария.');
    }
}

// Загружаем первую страницу при загрузке сайта
document.addEventListener('DOMContentLoaded', () => {
    showPage('ideas');
});
