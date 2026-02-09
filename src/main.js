// --- СОСТОЯНИЕ (ЗАГРУЗКА ИЗ ПАМЯТИ) ---
const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];

// --- ЛОГИКА СИСТЕМЫ ---

function startDispenser(money, fuelType, hasCard) {
    // 1. Проверка лимитов
    const limitResult = calculateFuelLimit(money, fuelType, hasCard);
    
    if (limitResult !== "success") {
        return { message: limitResult, success: false };
    }

    // 2. Поиск колонки
    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        return { message: `Извините, все колонки для "${fuelType}" сейчас заняты.`, success: false };
    }

    // 3. Успех: сохраняем транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });
    
    // Сохраняем в LocalStorage
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));

    return { 
        message: `Успех! Проезжайте к колонке №${pump.id}`, 
        success: true, 
        pump: pump 
    };
}

function getTotalRevenue() {
    let total = 0;
    transactionHistory.forEach(t => total += t.amount);
    return total;
}

// --- ИНТЕРФЕЙС ---

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const moneyInput = document.getElementById('moneyInput');
const fuelSelect = document.getElementById('fuelSelect');
const cardCheckbox = document.getElementById('cardCheckbox');
const statusMessage = document.getElementById('statusMessage');
const totalRevenueDisplay = document.getElementById('totalRevenue');
const pumpsGrid = document.getElementById('pumpsGrid');

function renderPumps() {
    pumpsGrid.innerHTML = '';
    pumps.forEach(pump => {
        const pumpDiv = document.createElement('div');
        pumpDiv.className = `pump-card ${pump.status}`;
        pumpDiv.innerHTML = `
            <h3>Колонка №${pump.id}</h3>
            <p>Топливо: ${pump.fuelType}</p>
            <small>${pump.status === 'available' ? 'Свободна' : 'Занята'}</small>
        `;
        pumpsGrid.appendChild(pumpDiv);
    });
}

// Кнопка ЗАПРАВИТЬ
startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    const response = startDispenser(money, fuelType, hasCard);
    
    statusMessage.classList.remove('fade-in');
    void statusMessage.offsetWidth;
    statusMessage.classList.add('fade-in');
    statusMessage.innerText = response.message;

    if (response.success) {
        const currentPump = response.pump;
        reservePump(currentPump.id);
        renderPumps();
        totalRevenueDisplay.innerText = getTotalRevenue();

        setTimeout(() => {
            releasePump(currentPump.id);
            renderPumps();
            statusMessage.innerText = `Колонка №${currentPump.id} освободилась!`;
        }, 10000);
    }
    moneyInput.value = '';
});

// Кнопка ОЧИСТИТЬ ПОЛЯ
cancelBtn.addEventListener('click', () => {
    moneyInput.value = '';
    fuelSelect.value = '92';
    cardCheckbox.checked = false;
    statusMessage.innerText = 'Готов к работе';
});

// Кнопка ЗАКРЫТЬ СМЕНУ
clearHistoryBtn.addEventListener('click', () => {
    if (confirm("ЗАКРЫТЬ СМЕНУ? Все данные будут удалены!")) {
        transactionHistory.length = 0;
        localStorage.removeItem('fuelTransactions');
        totalRevenueDisplay.innerText = '0';
        statusMessage.innerText = 'Смена закрыта.';
        renderTransactions();
    }
});

// Стартовый запуск
renderPumps();
totalRevenueDisplay.innerText = getTotalRevenue();

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    list.innerHTML = ''; // Очищаем старое

    // Берем последние 10 транзакций и переворачиваем, чтобы новые были сверху
    const lastTransactions = [...transactionHistory].reverse().slice(0, 10);

    lastTransactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item fade-in';
        item.innerHTML = `
            <span>+ ${t.amount} р</span>
            <span>Колонка №${t.pumpId} (${t.fuel})</span>
            <span>${t.time}</span>
        `;
        list.appendChild(item);
    });
}
renderPumps();
renderTransactions(); // ДОБАВЬ ЭТУ СТРОКУ В КОНЕЦ ФАЙЛА
totalRevenueDisplay.innerText = getTotalRevenue();


