let wishlistItems = [];

async function loadWishlist() {
    try {
        const response = await fetch('/api/wishlist', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            wishlistItems = await response.json();
            updateWishlistDisplay();
        }
    } catch (error) {
        console.error('Ошибка загрузки списка желаемого:', error);
    }
}

function updateWishlistDisplay() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;

    if (wishlistItems.length === 0) {
        container.innerHTML = '<p>Список желаемого пуст</p>';
        return;
    }

    container.innerHTML = wishlistItems.map(item => `
        <div class="wishlist-item">
            <img src="${item.product.imageUrl}" alt="${item.product.name}">
            <div class="wishlist-item-details">
                <h3>${item.product.name}</h3>
                <p>${item.product.description}</p>
                <p class="price">${item.product.price} ₽</p>
                <div class="wishlist-item-actions">
                    <button onclick="addToCart(${item.productId})">В корзину</button>
                    <button onclick="removeFromWishlist(${item.productId})">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function addToWishlist(productId) {
    try {
        const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId })
        });

        if (response.ok) {
            showNotification('Товар добавлен в список желаемого');
            await loadWishlist();
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления в список желаемого:', error);
        showNotification('Ошибка добавления в список желаемого', 'error');
    }
}

async function removeFromWishlist(productId) {
    try {
        const response = await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showNotification('Товар удален из списка желаемого');
            await loadWishlist();
        }
    } catch (error) {
        console.error('Ошибка удаления из списка желаемого:', error);
        showNotification('Ошибка удаления из списка желаемого', 'error');
    }
} 