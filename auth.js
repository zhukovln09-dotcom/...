// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('school_user'));
    
    if (currentUser) {
        // Обновляем кнопку входа
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.textContent = currentUser.name;
            loginBtn.onclick = () => {
                if (confirm('Выйти из системы?')) {
                    localStorage.removeItem('school_user');
                    window.location.reload();
                }
            };
        }
    }
});
