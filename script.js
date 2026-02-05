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

// Инициализация Firebase (версия совместимости)
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase успешно инициализирован");
} catch (error) {
    console.error("Ошибка инициализации Firebase:", error);
    // Если ошибка, показываем сообщение пользователю
    document.querySelector('.gifts-container').innerHTML = 
        '<div class="error">Ошибка подключения к базе данных. Пожалуйста, обновите страницу.</div>';
}

const db = firebase.firestore();

// Элементы DOM
const giftsContainer = document.querySelector('.gifts-container');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('gift-modal');
const closeModal = document.querySelector('.close-modal');
const modalBody = document.querySelector('.modal-body');

// Формовые элементы
const userSelect = document.getElementById('user-select');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const giftName = document.getElementById('gift-name');
const giftPrice = document.getElementById('gift-price');
const giftLink = document.getElementById('gift-link');
const giftColor = document.getElementById('gift-color');
const giftDescription = document.getElementById('gift-description');

// Статистические элементы
const totalGiftsEl = document.getElementById('total-gifts');
const user1GiftsEl = document.getElementById('user1-gifts');
const user2GiftsEl = document.getElementById('user2-gifts');

// Текущий фильтр
let currentFilter = 'all';
let unsubscribe = null;

// Загрузка подарков из Firebase
function loadGifts() {
    // Отписываемся от предыдущего слушателя
    if (unsubscribe) {
        unsubscribe();
    }
    
    let query = db.collection('gifts').orderBy('date', 'desc');
    
    // Применяем фильтр
    if (currentFilter === 'user1' || currentFilter === 'user2') {
        query = query.where('user', '==', currentFilter);
    } else if (currentFilter === 'priority') {
        query = query.where('priority', '==', 'high');
    }
    
    // Показываем загрузку
    giftsContainer.innerHTML = '<div class="loading">Загрузка списка подарков...</div>';
    
    // Подписываемся на изменения в реальном времени
    unsubscribe = query.onSnapshot((snapshot) => {
        const gifts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            gifts.push({
                id: doc.id,
                ...data,
                // Убедимся, что дата в правильном формате
                date: data.date || new Date().toISOString()
            });
        });
        
        displayGifts(gifts);
        updateStats(gifts);
    }, (error) => {
        console.error("Ошибка загрузки подарков:", error);
        giftsContainer.innerHTML = '<div class="error">Ошибка подключения к базе данных</div>';
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
    // Сортировка: сначала высокий приоритет, затем некупленные, потом купленные
    gifts.sort((a, b) => {
        // По приоритету (высокий приоритет идет первым)
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        
        // По статусу покупки (некупленные идут первыми)
        if (a.purchased && !b.purchased) return 1;
        if (!a.purchased && b.purchased) return -1;
        
        // По дате (новые идут первыми)
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

// Получение сообщения для пустого списка
function getEmptyMessage() {
    switch(currentFilter) {
        case 'all': return 'Пока нет ни одного подарка в списке. Добавьте первый!';
        case 'user1': return 'Для Ахиллеса пока нет желаний. Добавьте что-нибудь!';
        case 'user2': return 'Для Аяночки пока нет желаний. Добавьте что-нибудь!';
        case 'priority': return 'Нет подарков с высоким приоритетом.';
        default: return 'Список пуст.';
    }
}

// Создание элемента подарка
function createGiftElement(gift) {
    const giftCard = document.createElement('div');
    giftCard.className = `gift-card ${gift.user} ${gift.priority === 'high' ? 'priority-high' : ''} ${gift.purchased ? 'purchased' : ''}`;
    giftCard.dataset.id = gift.id;
    
    const userLabel = gift.user === 'user1' ? 'Ахиллесушка' : 'Аяночка';
    const userClass = gift.user === 'user1' ? 'user1-badge' : 'user2-badge';
    const purchasedText = gift.purchased ? ' (куплено)' : '';
    
    // Обрезаем описание для карточки
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
    
    // Добавляем обработчик клика для открытия модального окна
    giftCard.addEventListener('click', (e) => {
        // Не открываем модалку если кликнули на кнопку или ссылку
        if (!e.target.closest('.gift-actions') && !e.target.closest('.gift-link')) {
            openGiftModal(gift);
        }
    });
    
    // Добавляем обработчики для кнопок
    const purchasedBtn = giftCard.querySelector('.purchased-btn');
    const deleteBtn = giftCard.querySelector('.delete-btn');
    
    purchasedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePurchaseStatus(gift.id, gift.purchased);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteGift(gift.id);
    });
    
    return giftCard;
}

// Функция для экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Форматирование цены
function formatPrice(price) {
    if (!price) return '';
    const num = parseInt(price);
    return isNaN(num) ? price : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Открытие модального окна с деталями подарка
function openGiftModal(gift) {
    const userLabel = gift.user === 'user1' ? 'Ахиллесушка' : 'Аяночка';
    const priorityLabel = {
        'high': 'Высокий',
        'normal': 'Обычный',
        'low': 'Низкий'
    }[gift.priority] || 'Не указан';
    
    const purchasedLabel = gift.purchased ? 'Да (куплено)' : 'Нет';
    const purchasedClass = gift.purchased ? 'style="color: #4bc0c0; font-weight: 600;"' : '';
    
    // Форматирование даты
    const date = new Date(gift.date);
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    modalBody.innerHTML = `
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
                <div class="detail-label">Примерная цена:</div>
                <div class="detail-value">${gift.price ? formatPrice(gift.price) + ' руб.' : 'Не указана'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Цвет/размер:</div>
                <div class="detail-value">${escapeHtml(gift.color || 'Не указано')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Куплено:</div>
                <div class="detail-value" ${purchasedClass}>${purchasedLabel}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Дата добавления:</div>
                <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                <div class="detail-label">Описание:</div>
                <div class="detail-value" style="margin-top: 5px; white-space: pre-line;">${escapeHtml(gift.description || 'Описание отсутствует')}</div>
            </div>
            ${gift.link ? `
            <div class="detail-row">
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

// Добавление нового подарка
async function addGift() {
    const name = giftName.value.trim();
    const user = userSelect.value;
    
    if (!name) {
        alert('Пожалуйста, введите название подарка');
        giftName.focus();
        return;
    }
    
    const newGift = {
        name: name,
        user: user,
        category: categorySelect.value || null,
        priority: prioritySelect.value,
        price: giftPrice.value.trim() || null,
        link: giftLink.value.trim() || null,
        color: giftColor.value.trim() || null,
        description: giftDescription.value.trim() || null,
        purchased: false,
        date: new Date().toISOString()
    };
    
    try {
        await db.collection('gifts').add(newGift);
        clearForm();
        // Не нужно вызывать loadGifts() - сработает автоматически через onSnapshot
    } catch (error) {
        console.error('Ошибка добавления подарка:', error);
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
    categorySelect.selectedIndex = 0;
    prioritySelect.selectedIndex = 0;
    giftName.focus();
}

// Переключение статуса покупки
async function togglePurchaseStatus(id, currentStatus) {
    try {
        await db.collection('gifts').doc(id).update({
            purchased: !currentStatus
        });
        // Не нужно вызывать loadGifts() - сработает автоматически
    } catch (error) {
        console.error('Ошибка обновления подарка:', error);
        alert('Не удалось обновить статус подарка');
    }
}

// Удаление подарка
async function deleteGift(id) {
    if (!confirm('Вы уверены, что хотите удалить этот подарок из списка?')) {
        return;
    }
    
    try {
        await db.collection('gifts').doc(id).delete();
        // Не нужно вызывать loadGifts() - сработает автоматически
    } catch (error) {
        console.error('Ошибка удаления подарка:', error);
        alert('Не удалось удалить подарок');
    }
}

// Установка фильтра
function setFilter(filter) {
    currentFilter = filter;
    
    // Обновление активной кнопки
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Перезагрузка подарков с новым фильтром
    loadGifts();
}

// Проверка подключения к Firebase
function checkFirebaseConnection() {
    const connectionCheck = setTimeout(() => {
        if (!document.querySelector('.gift-card') && !document.querySelector('.error')) {
            giftsContainer.innerHTML = 
                '<div class="error">Ожидание подключения к базе данных...</div>';
        }
    }, 3000);
    
    return connectionCheck;
}

// Инициализация приложения
function init() {
    // Проверяем подключение
    const connectionTimeout = checkFirebaseConnection();
    
    // Загрузка подарков при загрузке страницы
    loadGifts();
    
    // Обработчики событий
    addBtn.addEventListener('click', addGift);
    
    giftName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addGift();
        }
    });
    
    clearBtn.addEventListener('click', clearForm);
    
    // Обработчики для фильтров
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
    
    // Закрытие модального окна
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Закрытие модального окна клавишей ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
    
    // Отмена таймера проверки подключения
    setTimeout(() => {
        clearTimeout(connectionTimeout);
    }, 5000);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);

// Добавляем обработчик для offline/online
window.addEventListener('online', () => {
    console.log('Соединение восстановлено');
    loadGifts();
});

window.addEventListener('offline', () => {
    console.log('Соединение потеряно');
    giftsContainer.innerHTML = '<div class="error">Отсутствует интернет-соединение</div>';
});