// --- СОСТОЯНИЕ (ЗАГРУЗКА ИЗ ПАМЯТИ) ---
const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];

// Примечание: fuelStorage и fuelPrices подтягиваются автоматически из других файлов

// --- ГЛАВНАЯ ЛОГИКА ---

function startDispenser(money, fuelType, hasCard) {
    // 1. Лимиты по деньгам
    const limitResult = calculateFuelLimit(money, fuelType, hasCard);
    if (limitResult !== "success") return { message: limitResult, success: false };

    // 2. Проверка на наличие топлива вообще
    if (Number(fuelStorage[fuelType]) <= 0) {
        return { message: `ОШИБКА: Топливо ${fuelType} закончилось!`, success: false };
    }

    // 3. Расчет литров и проверка остатка в бочке
    const litersNeeded = calculateLiters(money, fuelType, hasCard);
    if (Number(fuelStorage[fuelType]) < litersNeeded) {
        return { message: `Недостаточно топлива! В наличии: ${fuelStorage[fuelType]} л`, success: false };
    }

    // 4. Поиск свободной колонки
    const pump = findPumpByFuel(fuelType);
    if (!pump) return { message: `Извините, все колонки для "${fuelType}" заняты.`, success: false };

    // 5. Успех: сохраняем транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString(),
        withCard: hasCard
    });
    
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));

    return { 
        message: `Успех! Проезжайте к колонке №${pump.id} (${Number(litersNeeded).toFixed(2)} л)`, 
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
const storageStatus = document.getElementById('storageStatus');
const reportModal = document.getElementById('reportModal');
const reportData = document.getElementById('reportData');

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
        item.innerHTML = `<span>+ ${t.amount} р</span><span>№${t.pumpId} ${t.withCard ? '💳' : ''}</span><span>${t.time}</span>`;
        transactionsList.appendChild(item);
    });
}

function renderStorage() {
    if (!storageStatus) return;
    storageStatus.innerHTML = '';
    
    for (let fuel in fuelStorage) {
        const amount = Number(fuelStorage[fuel]);
        const item = document.createElement('div');
        item.className = 'storage-item';
        
        let statusClass = '';
        if (amount <= 0) {
            statusClass = 'out-of-stock';
        } else if (amount < 100) {
            statusClass = 'critical-low';
        }

        item.innerHTML = `${fuel.toUpperCase()}: <span class="${statusClass}">${amount.toFixed(2)} л</span>`;
        storageStatus.appendChild(item);
    }
}

function generateShiftReportHTML() {
    const report = { '92': { l: 0, r: 0 }, '95': { l: 0, r: 0 }, '98': { l: 0, r: 0 }, 'diesel': { l: 0, r: 0 } };
    transactionHistory.forEach(t => {
        const liters = calculateLiters(t.amount, t.fuel, t.withCard);
        report[t.fuel].l += Number(liters);
        report[t.fuel].r += t.amount;
    });

    let html = "";
    for (let f in report) {
        if (report[f].r > 0) {
            html += `<p><b>${f.toUpperCase()}</b>: ${report[f].l.toFixed(2)} л <br> Сумма: ${report[f].r} р</p>`;
        }
    }
    html += `<hr><h3>ИТОГО ВЫРУЧКА: ${getTotalRevenue()} р</h3>`;
    return html;
}

// Кнопка ЗАПРАВИТЬ
startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    if (isNaN(money) || money <= 0) {
        statusMessage.innerText = "Ошибка: введите корректную сумму!";
        return;
    }

    const response = startDispenser(money, fuelType, hasCard);
    statusMessage.innerText = response.message;

    if (response.success) {
        // Списание литров
        const liters = calculateLiters(money, fuelType, hasCard);
        fuelStorage[fuelType] = Number((Number(fuelStorage[fuelType]) - liters).toFixed(2));
        
        // Сохраняем новый остаток в память
        localStorage.setItem('fuelInventory', JSON.stringify(fuelStorage));
        
        reservePump(response.pump.id);
        renderPumps();
        renderTransactions();
        renderStorage();
        totalRevenueDisplay.innerText = getTotalRevenue();

        setTimeout(() => {
            releasePump(response.pump.id);
            renderPumps();
            statusMessage.innerText = `Колонка №${response.pump.id} освободилась!`;
        }, 10000);
    }
    moneyInput.value = '';
});

// Кнопка ЗАКРЫТЬ СМЕНУ (Модальное окно)
clearHistoryBtn.addEventListener('click', () => {
    reportData.innerHTML = generateShiftReportHTML();
    reportModal.style.display = "block";
});

// Закрытие модалки
document.querySelector('.close-modal').onclick = () => {
    reportModal.style.display = "none";
};

// Подтверждение обнуления внутри модалки
document.getElementById('confirmCloseShift').onclick = () => {
    if (confirm("Выгрузить отчет и ОБНУЛИТЬ КАССУ?")) {
        transactionHistory.length = 0;
        localStorage.removeItem('fuelTransactions');
        totalRevenueDisplay.innerText = '0';
        reportModal.style.display = "none";
        renderTransactions();
        statusMessage.innerText = 'Смена закрыта. Касса обнулена.';
    }
};

// ОБНОВИТЬ ЦЕНЫ
const updatePricesBtn = document.getElementById('updatePricesBtn');
if (updatePricesBtn) {
    updatePricesBtn.addEventListener('click', () => {
        fuelPrices['92'] = Number(document.getElementById('price92').value);
        fuelPrices['95'] = Number(document.getElementById('price95').value);
        fuelPrices['98'] = Number(document.getElementById('price98').value);
        fuelPrices['diesel'] = Number(document.getElementById('priceDiesel').value);
        statusMessage.innerText = "Цены на все виды топлива обновлены!";
    });
}

// СТАРТ СИСТЕМЫ
renderPumps();
renderTransactions();
renderStorage();
totalRevenueDisplay.innerText = getTotalRevenue();



