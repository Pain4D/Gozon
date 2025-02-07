function getAuthToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function isAuthenticated() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (Date.now() >= exp) {
            logout();
            return false;
        }
        return true;
    } catch {
        logout();
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated() && window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
        window.location.href = '/login.html';
    }
}); 