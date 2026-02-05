// Элементы DOM
const giftsContainer = document.querySelector('.gifts-container');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('gift-modal');
const fullImageModal = document.getElementById('full-image-modal');
const closeModal = document.querySelectorAll('.close-modal');
const modalBody = document.querySelector('.modal-body');
const fullImage = document.getElementById('full-image');

// Формовые элементы
const userSelect = document.getElementById('user-select');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const giftName = document.getElementById('gift-name');
const giftPrice = document.getElementById('gift-price');
const giftLink = document.getElementById('gift-link');
const giftColor = document.getElementById('gift-color');
const giftPhoto = document.getElementById('gift-photo');
const photoPreview = document.getElementById('photo-preview');

// Статистические элементы
const totalGiftsEl = document.getElementById('total-gifts');
const user1GiftsEl = document.getElementById('user1-gifts');
const user2GiftsEl = document.getElementById('user2-gifts');

// Текущий фильтр и фото
let currentFilter = 'all';
let currentPhoto = null;

// Загрузка данных из LocalStorage
const STORAGE_KEY = 'our-wishlist-v2';

function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveToStorage(gifts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gifts));
}

// Загрузка подарков
function loadGifts() {
    const gifts = loadFromStorage();
    displayGifts(gifts);
    updateStats(gifts);
}

// Обновление статистики
function updateStats(gifts) {
    const total = gifts.length;
    const user1Count = gifts.filter(g => g.user === 'user1').length;
    const user2Count = gifts.filter(g => g.user === 'user2').length;
    
    totalGiftsEl.textContent = total;
    user1GiftsEl.textContent = user1Count;
    user2GiftsEl.textContent = user2Count;
}

// Отображение подарков
function displayGifts(gifts) {
    // Фильтрация
    let filteredGifts = gifts;
    if (currentFilter === 'user1' || currentFilter === 'user2') {
        filteredGifts = gifts.filter(g => g.user === currentFilter);
    } else if (currentFilter === 'priority') {
        filteredGifts = gifts.filter(g => g.priority === 'high');
    }
    
    // Сортировка
    filteredGifts.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.purchased && !b.purchased) return 1;
        if (!a.purchased && b.purchased) return -1;
        return new Date(b.date) - new Date(a.date);
    });
    
    // Очистка контейнера
    giftsContainer.innerHTML = '';
    
    // Если нет подарков
    if (filteredGifts.length === 0) {
        const message = getEmptyMessage();
        giftsContainer.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
    }
    
    // Добавление каждого подарка
    filteredGifts.forEach(gift => {
        const giftElement = createGiftElement(gift);
        giftsContainer.appendChild(giftElement);
    });
}

// Создание элемента подарка
function createGiftElement(gift) {
    const giftCard = document.createElement('div');
    giftCard.className = `gift-card ${gift.user} ${gift.priority === 'high' ? 'priority-high' : ''} ${gift.purchased ? 'purchased' : ''}`;
    
    const userLabel = gift.user === 'user1' ? 'Ахиллесушка' : 'Аяночка';
    const userClass = gift.user === 'user1' ? 'user1-badge' : 'user2-badge';
    const purchasedText = gift.purchased ? ' (куплено)' : '';
    
    // Фото или заглушка
    let photoHtml = '';
    if (gift.photo) {
        photoHtml = `
            <div class="gift-image-preview" data-image="${gift.photo}">
                <img src="${gift.photo}" alt="${gift.name}" onclick="openFullImage('${gift.photo}')">
            </div>
        `;
    } else {
        photoHtml = `
            <div class="gift-image-preview">
                <div class="image-placeholder">
                    <i class="fas fa-gift"></i>
                    <small>Нет фото</small>
                </div>
            </div>
        `;
    }
    
    giftCard.innerHTML = `
        <div class="gift-header">
            <div class="gift-title">${escapeHtml(gift.name)}${purchasedText}</div>
            <div class="user-badge ${userClass}">${userLabel}</div>
        </div>
        ${gift.category ? `<div class="gift-category">${escapeHtml(gift.category)}</div>` : ''}
        ${gift.price ? `<div class="gift-price">${formatPrice(gift.price)} руб.</div>` : ''}
        
        <!-- ФОТО ВМЕСТО ОПИСАНИЯ -->
        ${photoHtml}
        
        ${gift.link ? `<a href="${gift.link}" target="_blank" class="gift-link" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> Ссылка на товар</a>` : ''}
        <div class="gift-actions">
            <button class="action-btn purchased-btn" data-id="${gift.id}">
                <i class="fas fa-${gift.purchased ? 'undo' : 'shopping-cart'}"></i>
                ${gift.purchased ? 'Отменить покупку' : 'Отметить купленным'}
            </button>
            <button class="action-btn delete-btn" data-id="${gift.id}">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </div>
    `;
    
    // Обработчики
    giftCard.addEventListener('click', (e) => {
        if (!e.target.closest('.gift-actions') && !e.target.closest('.gift-link') && !e.target.closest('.gift-image-preview img')) {
            openGiftModal(gift);
        }
    });
    
    giftCard.querySelector('.purchased-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        togglePurchaseStatus(gift.id);
    });
    
    giftCard.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteGift(gift.id);
    });
    
    return giftCard;
}

// Открытие полноразмерного фото
window.openFullImage = function(imageSrc) {
    event.stopPropagation();
    fullImage.src = imageSrc;
    fullImageModal.style.display = 'flex';
}

// Открытие модального окна с деталями
function openGiftModal(gift) {
    const userLabel = gift.user === 'user1' ? 'Ахиллесушка' : 'Аяночка';
    const priorityLabels = {
        'high': 'Высокий',
        'normal': 'Обычный',
        'low': 'Низкий'
    };
    
    const priorityLabel = priorityLabels[gift.priority] || 'Не указан';
    const date = new Date(gift.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Фото для модального окна
    let photoModalHtml = '';
    if (gift.photo) {
        photoModalHtml = `
            <div class="modal-image-container">
                <img src="${gift.photo}" alt="${gift.name}" class="modal-image" onclick="openFullImage('${gift.photo}')" style="cursor: pointer;">
            </div>
        `;
    } else {
        photoModalHtml = `
            <div class="modal-image-container" style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
                <i class="fas fa-gift" style="font-size: 3rem; color: #ddd;"></i>
                <p style="color: #999; margin-top: 10px;">Фото не добавлено</p>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        ${photoModalHtml}
        <div class="modal-details">
            <div class="detail-row">
                <div class="detail-label">Название:</div>
                <div class="detail-value">${escapeHtml(gift.name)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Для кого:</div>
                <div class="detail-value">${userLabel}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Категория:</div>
                <div class="detail-value">${escapeHtml(gift.category || 'Не указана')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Приоритет:</div>
                <div class="detail-value">${priorityLabel}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Цена:</div>
                <div class="detail-value">${gift.price ? formatPrice(gift.price) + ' руб.' : 'Не указана'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Цвет/размер:</div>
                <div class="detail-value">${escapeHtml(gift.color || 'Не указано')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Куплено:</div>
                <div class="detail-value" style="color: ${gift.purchased ? '#4bc0c0' : '#666'}">${gift.purchased ? 'Да' : 'Нет'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Дата:</div>
                <div class="detail-value">${date}</div>
            </div>
            ${gift.link ? `<div class="detail-row">
                <div class="detail-label">Ссылка:</div>
                <div class="detail-value">
                    <a href="${gift.link}" target="_blank" class="modal-link">
                        <i class="fas fa-external-link-alt"></i> Перейти к товару
                    </a>
                </div>
            </div>` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Добавление подарка
function addGift() {
    const name = giftName.value.trim();
    if (!name) {
        alert('Введите название подарка');
        giftName.focus();
        return;
    }
    
    const gifts = loadFromStorage();
    const newGift = {
        id: Date.now(),
        name: name,
        user: userSelect.value,
        category: categorySelect.value || null,
        priority: prioritySelect.value,
        price: giftPrice.value.trim() || null,
        link: giftLink.value.trim() || null,
        color: giftColor.value.trim() || null,
        photo: currentPhoto, // Сохраняем фото вместо описания
        purchased: false,
        date: new Date().toISOString()
    };
    
    gifts.push(newGift);
    saveToStorage(gifts);
    clearForm();
    loadGifts();
}

// Очистка формы
function clearForm() {
    giftName.value = '';
    giftPrice.value = '';
    giftLink.value = '';
    giftColor.value = '';
    photoPreview.innerHTML = '';
    currentPhoto = null;
    categorySelect.selectedIndex = 0;
    prioritySelect.selectedIndex = 0;
    giftPhoto.value = '';
    giftName.focus();
}

// Управление фото
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите изображение');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Изображение должно быть меньше 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentPhoto = e.target.result;
        
        photoPreview.innerHTML = `
            <img src="${currentPhoto}" class="preview-image" alt="Предпросмотр">
            <button type="button" class="remove-photo" onclick="removePhoto()">
                <i class="fas fa-times"></i> Удалить фото
            </button>
        `;
    };
    reader.readAsDataURL(file);
}

// Удаление фото
window.removePhoto = function() {
    currentPhoto = null;
    photoPreview.innerHTML = '';
    giftPhoto.value = '';
}

// Переключение статуса покупки
function togglePurchaseStatus(id) {
    const gifts = loadFromStorage();
    const index = gifts.findIndex(g => g.id === id);
    if (index !== -1) {
        gifts[index].purchased = !gifts[index].purchased;
        saveToStorage(gifts);
        loadGifts();
    }
}

// Удаление подарка
function deleteGift(id) {
    if (!confirm('Удалить этот подарок из списка?')) return;
    
    const gifts = loadFromStorage();
    const filtered = gifts.filter(g => g.id !== id);
    saveToStorage(filtered);
    loadGifts();
}

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    if (!price) return '';
    const num = parseInt(price);
    return isNaN(num) ? price : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function getEmptyMessage() {
    switch(currentFilter) {
        case 'all': return 'Пока нет подарков. Добавьте первый!';
        case 'user1': return 'Для Ахиллеса пока нет желаний';
        case 'user2': return 'Для Аяночки пока нет желаний';
        case 'priority': return 'Нет подарков с высоким приоритетом';
        default: return 'Список пуст';
    }
}

// Установка фильтра
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    loadGifts();
}

// Инициализация
function init() {
    // Загрузка данных
    loadGifts();
    
    // Обработчики событий
    addBtn.addEventListener('click', addGift);
    giftName.addEventListener('keypress', (e) => e.key === 'Enter' && addGift());
    clearBtn.addEventListener('click', clearForm);
    giftPhoto.addEventListener('change', handlePhotoUpload);
    
    // Обработчики фильтров
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    // Закрытие модальных окон
    closeModal.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            fullImageModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === fullImageModal) fullImageModal.style.display = 'none';
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.style.display === 'flex') modal.style.display = 'none';
            if (fullImageModal.style.display === 'flex') fullImageModal.style.display = 'none';
        }
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', init);
