let cart = {
    items: [],
    totalPrice: 0
};

// Глобальная функция для обновления счетчика корзины
window.updateCartCount = async function() {
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const cartData = await response.json();
            const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
            
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.classList.add('updated');
                setTimeout(() => {
                    cartCount.classList.remove('updated');
                }, 300);
            }
        }
    } catch (error) {
        console.error('Ошибка обновления счетчика корзины:', error);
    }
};

async function showCart() {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('profile-container').style.display = 'none';
    document.getElementById('cart-container').style.display = 'block';
    await loadCart();
}

async function loadCart() {
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            cart = await response.json();
            updateCartDisplay();
            // Обновление глобального счетчик
            await window.updateCartCount();
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        showNotification('Ошибка загрузки корзины', 'error');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    if (!cartItems || !cartSummary || !emptyCartMessage) return;

    if (!cart.items.length) {
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        return;
    }

    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';
    emptyCartMessage.style.display = 'none';

    // Отображаем товары
    cartItems.innerHTML = cart.items.map(item => `
        <div class="cart-item">
            <img src="${item.product.imageUrl}" alt="${item.product.name}">
            <div class="cart-item-details">
                <h3>${item.product.name}</h3>
                <p>${item.product.description}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.product.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.product.id}, ${item.quantity + 1})">+</button>
                </div>
                <p class="price">${item.product.price} ₽</p>
                <button onclick="removeFromCart(${item.product.id})" class="remove-btn">Удалить</button>
            </div>
        </div>
    `).join('');

    const deliveryInputs = document.querySelectorAll('input[name="delivery"]');
    deliveryInputs.forEach(input => {
        input.addEventListener('change', updateTotal);
    });

    updateTotal();
}

function updateCartCount(count) {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.classList.add('updated');
        setTimeout(() => {
            cartCount.classList.remove('updated');
        }, 300);
    }
}

async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        await removeFromCart(productId);
        return;
    }

    try {
        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId, quantity: newQuantity })
        });

        if (response.ok) {
            await loadCart();
        }
    } catch (error) {
        console.error('Ошибка обновления количества:', error);
        showNotification('Ошибка обновления количества', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            await loadCart();
            showNotification('Товар удален из корзины');
        }
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
        showNotification('Ошибка удаления из корзины', 'error');
    }
}

async function clearCart() {
    try {
        const response = await fetch('/api/cart/clear', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            await loadCart(); // Обновит отображение и счетчик
            showNotification('Корзина очищена');
        }
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
        showNotification('Ошибка очистки корзины', 'error');
    }
}

function updateTotal() {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);

    // Получаем стоимость доставки
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const deliveryCost = selectedDelivery && selectedDelivery.value === 'courier' ? 300 : 0;
    
    document.getElementById('delivery-cost').textContent = deliveryCost.toFixed(2);
    document.getElementById('total').textContent = (subtotal + deliveryCost).toFixed(2);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#4CAF50' : '#ff4444';
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Добавляем обработчик события для комментария
document.getElementById('cart-comment')?.addEventListener('change', async (e) => {
    try {
        const response = await fetch('/api/cart/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ comment: e.target.value })
        });

        if (response.ok) {
            showNotification('Комментарий сохранен');
        }
    } catch (error) {
        console.error('Ошибка сохранения комментария:', error);
        showNotification('Ошибка сохранения комментария', 'error');
    }
});

async function checkout() {
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const selectedPayment = document.querySelector('input[name="payment"]:checked');

    if (!selectedDelivery) {
        showNotification('Выберите способ доставки', 'error');
        return;
    }

    if (!selectedPayment) {
        showNotification('Выберите способ оплаты', 'error');
        return;
    }

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                deliveryMethod: selectedDelivery.value,
                paymentMethod: selectedPayment.value
            })
        });

        if (response.ok) {
            showNotification('Заказ успешно оформлен');
            cart = { items: [], totalPrice: 0 };
            updateCartDisplay();
            updateCartCount(0);
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showNotification('Ошибка оформления заказа', 'error');
    }
}

// Добавим загрузку корзины при старте
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});

window.clearCart = clearCart; 