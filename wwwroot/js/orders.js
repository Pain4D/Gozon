async function loadOrders() {
    try {
        const response = await fetch('/api/profile/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        showNotification('Ошибка загрузки заказов', 'error');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!orders.length) {
        ordersList.innerHTML = '<p>У вас пока нет заказов</p>';
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <h4>Заказ #${order.id}</h4>
                    <p>от ${new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <p>Сумма: ${order.totalAmount} ₽</p>
            <p>Доставка: ${order.deliveryAddress}</p>
            <p>Оплата: ${order.paymentMethod}</p>
            <div class="order-details" onclick="showOrderDetails(${order.id})">
                Подробнее
            </div>
        </div>
    `).join('');
}

async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/profile/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const order = await response.json();
            displayOrderDetails(order);
        }
    } catch (error) {
        console.error('Ошибка загрузки деталей заказа:', error);
        showNotification('Ошибка загрузки деталей заказа', 'error');
    }
}

function displayOrderDetails(order) {
    document.getElementById('order-number').textContent = order.id;
    
    const content = document.getElementById('order-details-content');
    content.innerHTML = `
        <div class="order-info">
            <p>Дата: ${new Date(order.orderDate).toLocaleDateString()}</p>
            <p>Статус: <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p>Доставка: ${order.deliveryAddress}</p>
            <p>Оплата: ${order.paymentMethod}</p>
        </div>
        <div class="order-items-list">
            ${order.items.map(item => `
                <div class="order-item-detail">
                    <img src="${item.productImage}" alt="${item.productName}" class="order-item-image">
                    <div class="order-item-info">
                        <h4>${item.productName}</h4>
                        <p>Количество: ${item.quantity}</p>
                        <p>Цена: ${item.price} ₽</p>
                    </div>
                    <div class="order-item-total">
                        <p>Итого: ${item.total} ₽</p>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="order-summary">
            <h4>Итого к оплате: ${order.totalAmount} ₽</h4>
        </div>
    `;

    document.getElementById('order-details-modal').style.display = 'block';
}

// Закрытие модального окна
document.querySelector('.close').onclick = function() {
    document.getElementById('order-details-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('order-details-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('profile-container')) {
        loadOrders();
    }
}); 