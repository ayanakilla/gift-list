// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAQaE-RUlP-9l9KqUPUV_2pNpON7Oat9NY",
    authDomain: "wishlistforayanakilla.firebaseapp.com",
    projectId: "wishlistforayanakilla",
    storageBucket: "wishlistforayanakilla.firebasestorage.app",
    messagingSenderId: "974705587471",
    appId: "1:974705587471:web:640be35d883f65fddbfa7a",
    measurementId: "G-XWR9K2VE37"
};

// Инициализация Firebase
let db = null;
let unsubscribe = null;

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
const giftDescription = document.getElementById('gift-description');
const giftPhoto = document.getElementById('gift-photo');
const photoPreview = document.getElementById('photo-preview');

// Статистические элементы
const totalGiftsEl = document.getElementById('total-gifts');
const user1GiftsEl = document.getElementById('user1-gifts');
const user2GiftsEl = document.getElementById('user2-gifts');

// Текущий фильтр и фото
let currentFilter = 'all';
let currentPhoto = null;

// Инициализация Firebase
function initializeFirebase() {
    try {
        // Проверяем, что Firebase загружен
        if (typeof firebase === 'undefined') {
            console.error("Firebase не загружен");
            showError("Ошибка загрузки Firebase");
            return false;
        }
        
        // Инициализируем
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase успешно инициализирован");
        
        // Загружаем данные
        loadGifts();
        return true;
    } catch (error) {
        console.error("Ошибка инициализации Firebase:", error);
        showError("Ошибка подключения к базе данных");
        return false;
    }
}

// Показать ошибку
function showError(message) {
    giftsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 40px; color: #ff6b6b; background: rgba(255, 107, 107, 0.1); border-radius: 10px;">
            <h3>${message}</h3>
            <p>Попробуйте обновить страницу</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6a11cb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Обновить страницу
            </button>
        </div>
    `;
}

// Загрузка подарков из Firebase
function loadGifts() {
    if (!db) {
        showError("База данных не инициализирована");
        return;
    }
    
    // Отписываемся от предыдущего слушателя
    if (unsubscribe) {
        unsubscribe();
    }
    
    // Создаем запрос
    let query = db.collection('gifts').orderBy('date', 'desc');
    
    // Применяем фильтр
    if (currentFilter === 'user1' || currentFilter === 'user2') {
        query = query.where('user', '==', currentFilter);
    } else if (currentFilter === 'priority') {
        query = query.where('priority', '==', 'high');
    }
    
    // Показываем загрузку
    giftsContainer.innerHTML = '<div class="loading">Загрузка подарков...</div>';
    
    // Подписываемся на изменения в реальном времени
    unsubscribe = query.onSnapshot((snapshot) => {
        const gifts = [];
        snapshot.forEach((doc) => {
            gifts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayGifts(gifts);
        updateStats(gifts);
    }, (error) => {
        console.error("Ошибка загрузки:", error);
        showError("Ошибка загрузки данных");
    });
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
    // Сортировка
    gifts.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.purchased && !b.purchased) return 1;
        if (!a.purchased && b.purchased) return -1;
        return new Date(b.date) - new Date(a.date);
    });
    
    // Очистка контейнера
    giftsContainer.innerHTML = '';
    
    // Если нет подарков
    if (gifts.length === 0) {
        const message = getEmptyMessage();
        giftsContainer.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
    }
    
    // Добавление каждого подарка
    gifts.forEach(gift => {
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
            <div class="gift-image-thumbnail" onclick="openFullImage('${escapeHtml(gift.photo)}')">
                <img src="${gift.photo}" alt="${escapeHtml(gift.name)}">
            </div>
        `;
    } else {
        photoHtml = `
            <div class="gift-image-thumbnail">
                <div class="no-photo">
                    <i class="fas fa-image"></i>
                </div>
            </div>
        `;
    }
    
    // Обрезаем описание
    const shortDescription = gift.description && gift.description.length > 100 
        ? gift.description.substring(0, 100) + '...' 
        : gift.description || 'Описание отсутствует';
    
    giftCard.innerHTML = `
        <div class="gift-header">
            <div class="gift-title">${escapeHtml(gift.name)}${purchasedText}</div>
            <div class="user-badge ${userClass}">${userLabel}</div>
        </div>
        ${gift.category ? `<div class="gift-category">${escapeHtml(gift.category)}</div>` : ''}
        ${gift.price ? `<div class="gift-price">${formatPrice(gift.price)} руб.</div>` : ''}
        
        <!-- ФОТО -->
        ${photoHtml}
        
        <!-- ОПИСАНИЕ -->
        <div class="gift-description-short">${escapeHtml(shortDescription)}</div>
        
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
        if (!e.target.closest('.gift-actions') && !e.target.closest('.gift-link') && 
            !e.target.closest('.gift-image-thumbnail')) {
            openGiftModal(gift);
        }
    });
    
    giftCard.querySelector('.purchased-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        togglePurchaseStatus(gift.id, gift.purchased);
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
    const date = gift.date ? new Date(gift.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Дата не указана';
    
    // Фото для модального окна
    let photoModalHtml = '';
    if (gift.photo) {
        photoModalHtml = `
            <div class="modal-image-container">
                <img src="${gift.photo}" alt="${escapeHtml(gift.name)}" class="modal-image" onclick="openFullImage('${escapeHtml(gift.photo)}')" style="cursor: pointer;">
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
            <div class="detail-row" style="flex-direction: column;">
                <div class="detail-label">Описание:</div>
                <div class="detail-value" style="margin-top: 5px; white-space: pre-line;">${escapeHtml(gift.description || 'Описание отсутствует')}</div>
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

// Добавление подарка в Firebase
async function addGift() {
    if (!db) {
        alert('База данных не доступна');
        return;
    }
    
    const name = giftName.value.trim();
    if (!name) {
        alert('Введите название подарка');
        giftName.focus();
        return;
    }
    
    const newGift = {
        name: name,
        user: userSelect.value,
        category: categorySelect.value || null,
        priority: prioritySelect.value,
        price: giftPrice.value.trim() || null,
        link: giftLink.value.trim() || null,
        color: giftColor.value.trim() || null,
        description: giftDescription.value.trim() || null,
        photo: currentPhoto, // Дополнительное фото
        purchased: false,
        date: new Date().toISOString()
    };
    
    try {
        await db.collection('gifts').add(newGift);
        clearForm();
        // Не нужно вызывать loadGifts() - сработает автоматически через onSnapshot
    } catch (error) {
        console.error('Ошибка добавления:', error);
        alert('Ошибка при добавлении подарка');
    }
}

// Очистка формы
function clearForm() {
    giftName.value = '';
    giftPrice.value = '';
    giftLink.value = '';
    giftColor.value = '';
    giftDescription.value = '';
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
            <button type="button" class="remove-photo-btn" onclick="removePhoto()">
                <i class="fas fa-times"></i> Удалить
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

// Переключение статуса покупки в Firebase
async function togglePurchaseStatus(id, currentStatus) {
    if (!db) {
        alert('База данных не доступна');
        return;
    }
    
    try {
        await db.collection('gifts').doc(id).update({
            purchased: !currentStatus
        });
        // Не нужно вызывать loadGifts() - сработает автоматически
    } catch (error) {
        console.error('Ошибка обновления:', error);
        alert('Не удалось обновить статус подарка');
    }
}

// Удаление подарка из Firebase
async function deleteGift(id) {
    if (!db) {
        alert('База данных не доступна');
        return;
    }
    
    if (!confirm('Удалить этот подарок из списка?')) {
        return;
    }
    
    try {
        await db.collection('gifts').doc(id).delete();
        // Не нужно вызывать loadGifts() - сработает автоматически
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить подарок');
    }
}

// Вспомогательные функции
function escapeHtml(text) {
    if (!text) return '';
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
    // Инициализируем Firebase
    setTimeout(() => {
        initializeFirebase();
    }, 100);
    
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

// Добавляем обработчик для offline/online
window.addEventListener('online', () => {
    console.log('Соединение восстановлено');
    if (db) {
        loadGifts();
    }
});

window.addEventListener('offline', () => {
    console.log('Соединение потеряно');
    showError('Отсутствует интернет-соединение');
});
