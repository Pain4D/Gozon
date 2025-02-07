// Проверка авторизации при загрузке страницы
window.onload = function() {
    const token = localStorage.getItem('token');
    if (token) {
        showMainPage();
        loadProducts();
    }
};

function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            showMainPage();
            loadProducts();
        } else {
            alert('Ошибка входа. Проверьте email и пароль.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при входе');
    }
}

async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            alert('Регистрация успешна! Теперь вы можете войти.');
            toggleForms();
        } else {
            alert('Ошибка регистрации. Попробуйте другой email.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при регистрации');
    }
}

function logout() {
    localStorage.removeItem('token');
    showAuthPage();
}

function showMainPage() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    document.getElementById('profile-container').style.display = 'none';
    document.getElementById('cart-container').style.display = 'none';
}

function showAuthPage() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('main-container').style.display = 'none';
}

async function loadProducts() {
    try {
        console.log('Загрузка товаров...');
        const response = await fetch('/api/products');
        console.log('Статус ответа:', response.status);
        
        if (response.ok) {
            const products = await response.json();
            console.log('Получено товаров:', products.length);
            
            const container = document.getElementById('products-container');
            if (!container) {
                console.error('Контейнер products-container не найден!');
                return;
            }
            
            container.innerHTML = products.map(product => `
                <div class="product-card">
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price">${product.price} ₽</div>
                    <div class="product-actions">
                        <button onclick="addToCart(${product.id})">В корзину</button>
                        <button onclick="addToWishlist(${product.id})">❤</button>
                    </div>
                </div>
            `).join('');
        } else {
            console.error('Ошибка загрузки товаров:', response.status);
            showNotification('Ошибка загрузки товаров', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showNotification('Ошибка загрузки товаров', 'error');
    }
}

// Загружаем товары при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена, начинаем загрузку товаров');
    loadProducts();
});

function showProfile() {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('profile-container').style.display = 'block';
    loadProfile();
}

async function loadProfile() {
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            document.getElementById('profile-name').value = profile.name;
            document.getElementById('profile-email').value = profile.email;
            document.getElementById('avatar-preview').src = profile.avatarUrl || '/avatars/default.png';
            
            // Загружаем адреса
            const addressesList = document.getElementById('addresses-list');
            if (profile.addresses && profile.addresses.length > 0) {
                addressesList.innerHTML = profile.addresses.map(addr => `
                    <div class="address-item">
                        <p><strong>Адрес:</strong> ${addr.address}</p>
                        <p><strong>Город:</strong> ${addr.city}</p>
                        <p><strong>Индекс:</strong> ${addr.postalCode}</p>
                        <span class="delete-btn" onclick="deleteAddress(${addr.id})">✖</span>
                    </div>
                `).join('');
            } else {
                addressesList.innerHTML = '<p>Адреса не добавлены</p>';
            }

            // Загружаем способы оплаты
            updatePaymentMethodsList(profile.paymentMethods);

            // Загружаем заказы
            loadOrders();
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        alert('Ошибка при загрузке профиля');
    }
}

async function uploadAvatar() {
    const input = document.getElementById('avatar-input');
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('avatar-preview').src = data.avatarUrl;
        }
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('profile-name').value,
        newPassword: document.getElementById('profile-password').value
    };

    try {
        const response = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Профиль обновлен');
            document.getElementById('profile-password').value = '';
        }
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
    }
}

async function addAddress(event) {
    event.preventDefault();
    
    const data = {
        address: document.getElementById('address-street').value,
        city: document.getElementById('address-city').value,
        postalCode: document.getElementById('address-postal').value
    };

    try {
        const response = await fetch('/api/profile/address', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Адрес успешно добавлен:', result);
            
            // Очищаем форму
            document.getElementById('address-form').reset();
            
            // Перезагружаем профиль для отображения нового адреса
            await loadProfile();
            
            alert('Адрес успешно добавлен');
        } else {
            const error = await response.json();
            console.error('Ошибка при добавлении адреса:', error);
            alert('Ошибка при добавлении адреса: ' + (error.message || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка при добавлении адреса:', error);
        alert('Произошла ошибка при добавлении адреса');
    }
}

async function deleteAddress(id) {
    try {
        const response = await fetch(`/api/profile/address/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadProfile();
        }
    } catch (error) {
        console.error('Ошибка удаления адреса:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/profile/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const orders = await response.json();
            const ordersList = document.getElementById('orders-list');
            ordersList.innerHTML = orders.map(order => `
                <div class="order-item">
                    <h4>Заказ #${order.id}</h4>
                    <p>Дата: ${new Date(order.orderDate).toLocaleDateString()}</p>
                    <p>Статус: ${order.status}</p>
                    <p>Сумма: ${order.totalAmount} ₽</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

async function addPaymentMethod(event) {
    event.preventDefault();
    
    const type = document.getElementById('payment-type').value;
    const cardNumber = document.getElementById('card-number').value;

    // Проверка ввода
    if (type === 'CARD' && (!cardNumber || cardNumber.length !== 5)) {
        alert('Для карты необходимо ввести 5 цифр');
        return;
    }

    const data = {
        type: type,
        cardNumber: type === 'CARD' ? cardNumber : null
    };

    try {
        const response = await fetch('/api/profile/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Способ оплаты успешно добавлен:', result);
            
            // Очищаем форму
            document.getElementById('payment-form').reset();
            document.getElementById('card-number').style.display = 'none';
            
            // Перезагружаем профиль
            await loadProfile();
            
            // Показываем сообщение об успехе
            alert('Способ оплаты успешно добавлен');
        } else {
            const error = await response.json();
            console.error('Ошибка при добавлении способа оплаты:', error);
            alert('Ошибка при добавлении способа оплаты: ' + (error.message || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка при добавлении способа оплаты:', error);
        alert('Произошла ошибка при добавлении способа оплаты');
    }
}

// Обновим обработчик изменения типа оплаты
document.addEventListener('DOMContentLoaded', function() {
    const paymentType = document.getElementById('payment-type');
    const cardNumber = document.getElementById('card-number');
    
    if (paymentType) {
        paymentType.addEventListener('change', function(e) {
            if (cardNumber) {
                cardNumber.style.display = e.target.value === 'CARD' ? 'block' : 'none';
                cardNumber.required = e.target.value === 'CARD';
                if (e.target.value !== 'CARD') {
                    cardNumber.value = '';
                }
            }
        });
    }
});

// Обновим отображение способов оплаты в loadProfile
function updatePaymentMethodsList(paymentMethods) {
    const paymentList = document.getElementById('payment-methods-list');
    if (paymentMethods && paymentMethods.length > 0) {
        paymentList.innerHTML = paymentMethods.map(pm => `
            <div class="payment-item">
                ${pm.type === 'CARD' 
                    ? `<p><strong>Карта:</strong> *${pm.cardNumber}</p>` 
                    : '<p><strong>Способ оплаты:</strong> Наличные</p>'}
                <span class="delete-btn" onclick="deletePaymentMethod(${pm.id})">✖</span>
            </div>
        `).join('');
    } else {
        paymentList.innerHTML = '<p>Способы оплаты не добавлены</p>';
    }
}

async function deletePaymentMethod(id) {
    try {
        const response = await fetch(`/api/profile/payment/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadProfile();
        }
    } catch (error) {
        console.error('Ошибка удаления способа оплаты:', error);
    }
}

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            const cartData = await response.json();
            const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
            
            // Обновляем индикатор
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.classList.add('updated');
                setTimeout(() => cartCount.classList.remove('updated'), 300);
            }
            
            showNotification('Товар добавлен в корзину');
        }
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        showNotification('Ошибка добавления в корзину', 'error');
    }
} 