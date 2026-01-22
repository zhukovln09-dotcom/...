// Простая система авторизации (без паролей)
window.auth = {
    currentUser: null,

    // Инициализация при загрузке страницы
    init() {
        const savedUser = localStorage.getItem('crowdsourcing_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    },

    // Войти (простая форма)
    login() {
        const name = prompt('Введите ваше имя для участия:');
        if (name && name.trim()) {
            this.currentUser = {
                id: Date.now().toString(),
                name: name.trim(),
                joined: new Date().toISOString()
            };
            
            localStorage.setItem('crowdsourcing_user', JSON.stringify(this.currentUser));
            this.updateUI();
            alert(`Добро пожаловать, ${name}!`);
        }
    },

    // Выйти
    logout() {
        this.currentUser = null;
        localStorage.removeItem('crowdsourcing_user');
        this.updateUI();
        alert('Вы вышли из системы.');
    },

    // Обновить интерфейс
    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.currentUser) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Выйти (${this.currentUser.name})`;
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    },

    // Получить текущего пользователя
    getUser() {
        return this.currentUser;
    }
};

// Инициализируем авторизацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.auth.init();
    
    // Назначаем обработчики кнопок
    document.getElementById('loginBtn').addEventListener('click', () => window.auth.login());
    document.getElementById('logoutBtn').addEventListener('click', () => window.auth.logout());
});
