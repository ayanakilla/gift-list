// Работа с LocalStorage
const STORAGE_KEY = 'giftlist-data-v2';

// Начальные данные
const INITIAL_DATA = [ ];

// Загрузка данных
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            saveToStorage(INITIAL_DATA);
            return INITIAL_DATA;
        }
        return JSON.parse(data);
    } catch (e) {
        return INITIAL_DATA;
    }
}

// Сохранение данных
function saveToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Генерация ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

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

// Статистика
const totalGiftsEl = document.getElementById('total-gifts');
const user1GiftsEl = document.getElementById('user1-gifts');
const user2GiftsEl = document.getElementById('user2-gifts');
const highPriorityEl = document.getElementById('high-priority');

let currentFilter = 'all';

// Основные функции
async function loadGifts() {
    const gifts = loadFromStorage();
    displayGifts(gifts);
    updateStats(gifts);
}

function updateStats(gifts) {
    totalGiftsEl.textContent = gifts.length;
    user1GiftsEl.textContent = gifts.filter(g => g.user === 'user1').length;
    user2GiftsEl.textContent = gifts.filter(g => g.user === 'user2').length;
    highPriorityEl.textContent = gifts.filter(g => g.priority === 'high').length;
}

function displayGifts(gifts) {
    let filteredGifts = gifts;
    if (currentFilter === 'user1' || currentFilter === 'user2') {
        filteredGifts = gifts.filter(g => g.user === currentFilter);
    } else if (currentFilter === 'priority') {
        filteredGifts = gifts.filter(g => g.priority === 'high');
    }
    
    filteredGifts.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.purchased === b.purchased) return new Date(b.date) - new Date(a.date);
        return a.purchased ? 1 : -1;
    });
    
    giftsContainer.innerHTML = '';
    
    if (filteredGifts.length === 0) {
        giftsContainer.innerHTML = `<div class="empty-state">${getEmptyMessage()}</div>`;
        return;
    }
    
    filteredGifts.forEach(gift => {
        giftsContainer.appendChild(createGiftElement(gift));
    });
}

function createGiftElement(gift) {
    const giftCard = document.createElement('div');
    giftCard.className = `gift-card ${gift.user} ${gift.priority === 'high' ? 'priority-high' : ''} ${gift.purchased ? 'purchased' : ''}`;
    
    const userLabel = gift.user === 'user1' ? 'Акила' : 'Аяна';
    const userClass = gift.user === 'user1' ? 'user1-badge' : 'user2-badge';
    const shortDescription = gift.description && gift.description.length > 100 
        ? gift.description.substring(0, 100) + '...' 
        : gift.description || 'Описание отсутствует';
    
    giftCard.innerHTML = `
        <div class="gift-header">
            <div class="gift-title">${gift.name}${gift.purchased ? ' (куплено)' : ''}</div>
            <div class="user-badge ${userClass}">${userLabel}</div>
        </div>
        ${gift.category ? `<div class="gift-category">${gift.category}</div>` : ''}
        ${gift.price ? `<div class="gift-price">${formatPrice(gift.price)} руб.</div>` : ''}
        <div class="gift-description-short">${shortDescription}</div>
        ${gift.link ? `<a href="${gift.link}" target="_blank" class="gift-link"><i class="fas fa-external-link-alt"></i> Ссылка на товар</a>` : ''}
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
        if (!e.target.closest('.gift-actions') && !e.target.closest('.gift-link')) {
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

function formatPrice(price) {
    return parseInt(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function openGiftModal(gift) {
    const userLabel = gift.user === 'user1' ? 'Ахиллес' : 'Аяночка';
    const priorityLabel = { 'high': 'Высокий', 'normal': 'Обычный', 'low': 'Низкий' }[gift.priority] || 'Не указан';
    const date = new Date(gift.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    modalBody.innerHTML = `
        <div class="modal-details">
            <div class="detail-row"><div class="detail-label">Название:</div><div class="detail-value">${gift.name}</div></div>
            <div class="detail-row"><div class="detail-label">Для кого:</div><div class="detail-value">${userLabel}</div></div>
            <div class="detail-row"><div class="detail-label">Категория:</div><div class="detail-value">${gift.category || 'Не указана'}</div></div>
            <div class="detail-row"><div class="detail-label">Приоритет:</div><div class="detail-value">${priorityLabel}</div></div>
            <div class="detail-row"><div class="detail-label">Цена:</div><div class="detail-value">${gift.price ? formatPrice(gift.price) + ' руб.' : 'Не указана'}</div></div>
            <div class="detail-row"><div class="detail-label">Цвет/размер:</div><div class="detail-value">${gift.color || 'Не указано'}</div></div>
            <div class="detail-row"><div class="detail-label">Куплено:</div><div class="detail-value" style="color: ${gift.purchased ? '#4bc0c0' : '#666'}">${gift.purchased ? 'Да' : 'Нет'}</div></div>
            <div class="detail-row"><div class="detail-label">Дата:</div><div class="detail-value">${date}</div></div>
            <div class="detail-row" style="flex-direction: column;">
                <div class="detail-label">Описание:</div>
                <div class="detail-value" style="margin-top: 5px; white-space: pre-line;">${gift.description || 'Описание отсутствует'}</div>
            </div>
            ${gift.link ? `<div class="detail-row"><div class="detail-label">Ссылка:</div><div class="detail-value"><a href="${gift.link}" target="_blank" class="modal-link"><i class="fas fa-external-link-alt"></i> Перейти к товару</a></div></div>` : ''}
        </div>
    `;
    modal.style.display = 'flex';
}

function addGift() {
    const name = giftName.value.trim();
    if (!name) {
        alert('Введите название подарка');
        giftName.focus();
        return;
    }
    
    const gifts = loadFromStorage();
    const newGift = {
        id: generateId(),
        name,
        user: userSelect.value,
        category: categorySelect.value || null,
        priority: prioritySelect.value,
        price: giftPrice.value.trim() || null,
        link: giftLink.value.trim() || null,
        color: giftColor.value.trim() || null,
        description: giftDescription.value.trim() || null,
        purchased: false,
        date: new Date().toISOString()
    };
    
    gifts.push(newGift);
    saveToStorage(gifts);
    clearForm();
    loadGifts();
}

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

function togglePurchaseStatus(id) {
    const gifts = loadFromStorage();
    const index = gifts.findIndex(g => g.id === id);
    if (index !== -1) {
        gifts[index].purchased = !gifts[index].purchased;
        saveToStorage(gifts);
        loadGifts();
    }
}

function deleteGift(id) {
    if (!confirm('Удалить этот подарок?')) return;
    const gifts = loadFromStorage();
    const filtered = gifts.filter(g => g.id !== id);
    saveToStorage(filtered);
    loadGifts();
}

function getEmptyMessage() {
    switch(currentFilter) {
        case 'all': return 'Пока нет подарков. Добавьте первый!';
        case 'user1': return 'У вас пока нет желаний. Добавьте что-нибудь!';
        case 'user2': return 'У девушки пока нет желаний.';
        case 'priority': return 'Нет подарков с высоким приоритетом.';
        default: return 'Список пуст.';
    }
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    loadGifts();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadGifts();
    
    addBtn.addEventListener('click', addGift);
    giftName.addEventListener('keypress', (e) => e.key === 'Enter' && addGift());
    clearBtn.addEventListener('click', clearForm);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && modal.style.display === 'flex' && (modal.style.display = 'none'));

});
