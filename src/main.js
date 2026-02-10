// --- СОСТОЯНИЕ (ЗАГРУЗКА ИЗ ПАМЯТИ) ---
const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];

// --- ГЛАВНАЯ ЛОГИКА ---

function startDispenser(money, fuelType, hasCard) {
    // 1. Лимиты по деньгам
    const limitResult = calculateFuelLimit(money, fuelType, hasCard);
    if (limitResult !== "success") {
        return { message: limitResult, success: false };
    }

    // 2. Проверка остатка в бочках (fuelStorage из stationManager.js)
    const litersNeeded = calculateLiters(money, fuelType);
    if (fuelStorage[fuelType] < litersNeeded) {
        return { message: `Недостаточно топлива! В наличии: ${fuelStorage[fuelType]} л`, success: false };
    }

    // 3. Поиск колонки
    const pump = findPumpByFuel(fuelType);
    if (!pump) {
        return { message: `Извините, все колонки для "${fuelType}" сейчас заняты.`, success: false };
    }

    // 4. Успех: сохраняем транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });
    
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));

    return { 
        message: `Успех! Проезжайте к колонке №${pump.id} (${litersNeeded} л)`, 
        success: true, 
        pump: pump 
    };
}

function getTotalRevenue() {
    return transactionHistory.reduce((total, t) => total + t.amount, 0);
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
const transactionsList = document.getElementById('transactionsList');

function renderPumps() {
    pumpsGrid.innerHTML = '';
    pumps.forEach(pump => {
        const pumpDiv = document.createElement('div');
        pumpDiv.className = `pump-card ${pump.status}`;
        pumpDiv.innerHTML = `<h3>Колонка №${pump.id}</h3><p>Топливо: ${pump.fuelType}</p><small>${pump.status === 'available' ? 'Свободна' : 'Занята'}</small>`;
        pumpsGrid.appendChild(pumpDiv);
    });
}

function renderTransactions() {
    if (!transactionsList) return;
    transactionsList.innerHTML = '';
    [...transactionHistory].reverse().slice(0, 10).forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item fade-in';
        item.innerHTML = `<span>+ ${t.amount} р</span><span>№${t.pumpId}</span><span>${t.time}</span>`;
        transactionsList.appendChild(item);
       
    });
}

// Кнопка ЗАПРАВИТЬ
startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    const response = startDispenser(money, fuelType, hasCard);
    statusMessage.innerText = response.message;

    if (isNaN(money) || money <= 0) {
    statusMessage.innerText = "Ошибка: введите корректную сумму!";
    return;
}

    if (response.success) {
        // Списание литров
        const liters = calculateLiters(money, fuelType);
        fuelStorage[fuelType] = Number((fuelStorage[fuelType] - liters).toFixed(2));
        
        reservePump(response.pump.id);
        renderPumps();
        renderTransactions();
        totalRevenueDisplay.innerText = getTotalRevenue();

        setTimeout(() => {
            releasePump(response.pump.id);
            renderPumps();
            statusMessage.innerText = `Колонка №${response.pump.id} освободилась!`;
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
        statusMessage.innerText = 'Смена закрыта. Касса обнулена.';
        renderTransactions();
    }
});

// Старт
renderPumps();
renderTransactions();
totalRevenueDisplay.innerText = getTotalRevenue();

const updatePricesBtn = document.getElementById('updatePricesBtn');

updatePricesBtn.addEventListener('click', () => {
    // Собираем значения из всех полей ввода
    fuelPrices['92'] = Number(document.getElementById('price92').value);
    fuelPrices['95'] = Number(document.getElementById('price95').value);
    fuelPrices['98'] = Number(document.getElementById('price98').value);
    fuelPrices['diesel'] = Number(document.getElementById('priceDiesel').value);
    
    // Выводим уведомление оператору
    statusMessage.innerText = "Цены на все виды топлива обновлены!";
    
    // Лог в консоль для проверки (F12)
    console.log("Новый прайс-лист:", fuelPrices);
});



