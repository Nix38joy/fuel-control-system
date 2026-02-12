// --- 1. СОСТОЯНИЕ (ДАННЫЕ) ---
const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];

// ОЧЕРЕДЬ (Массив ожидания)
const waitingQueue = []; 

// --- 2. ГЛАВНАЯ ЛОГИКА (МОЗГИ) ---

// Проверка возможности заправки (хватает ли места, денег и топлива)
function startDispenser(money, fuelType, hasCard) {
    const limitResult = calculateFuelLimit(money, fuelType, hasCard);
    if (limitResult !== "success") return { message: limitResult, success: false };

    if (Number(fuelStorage[fuelType]) <= 0) {
        return { message: `ОШИБКА: Топливо ${fuelType} закончилось!`, success: false };
    }

    const litersNeeded = calculateLiters(money, fuelType, hasCard);
    if (Number(fuelStorage[fuelType]) < litersNeeded) {
        return { message: `Недостаточно топлива! В наличии: ${fuelStorage[fuelType]} л`, success: false };
    }

    const pump = findPumpByFuel(fuelType);
    if (!pump) return { message: `Все колонки для "${fuelType}" заняты.`, success: false };

    return { 
        success: true, 
        pump: pump,
        liters: Number(litersNeeded)
    };
}

// Универсальный запуск заправки (и для кнопки, и для очереди)
function runRefuel(money, fuelType, hasCard, pump, liters) {
    // 1. Списание топлива
    fuelStorage[fuelType] = Number((Number(fuelStorage[fuelType]) - liters).toFixed(2));
    localStorage.setItem('fuelInventory', JSON.stringify(fuelStorage));

    // 2. Резерв колонки
    reservePump(pump.id);
    
    // ВАЖНО: Сначала рисуем все колонки (это создаст пустые контейнеры для полосок)
    renderPumps(); 
    
    // 3. Запускаем анимацию ТОЛЬКО для той колонки, которая начала заправку сейчас
    animateProgress(pump.id, 30000); 

    // 4. Всё остальное: история, выручка, хранилище
    transactionHistory.push({
        amount: money, fuel: fuelType, pumpId: pump.id, 
        time: new Date().toLocaleTimeString(), withCard: hasCard
    });
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));
    
    renderTransactions();
    renderStorage();
    totalRevenueDisplay.innerText = getTotalRevenue();

    // 5. Таймер освобождения
    setTimeout(() => {
        releasePump(pump.id);
        renderPumps();
        statusMessage.innerText = `Колонка №${pump.id} свободна`;
        checkQueue(); 
    }, 30000);
}


// Автоматический поиск машины в очереди
function checkQueue() {
    if (waitingQueue.length === 0) return;

    for (let i = 0; i < waitingQueue.length; i++) {
        const car = waitingQueue[i];
        const check = startDispenser(car.money, car.fuelType, car.hasCard);

        if (check.success) {
            // Машина нашла место! Удаляем из очереди и заправляем
            waitingQueue.splice(i, 1);
            renderQueue();
            runRefuel(car.money, car.fuelType, car.hasCard, check.pump, check.liters);
            statusMessage.innerText = `Машина из очереди поехала на колонку №${check.pump.id}`;
            break; // Берем по одной машине за раз
        }
    }
}

// --- 3. ИНТЕРФЕЙС (ОТРИСОВКА) ---

const startBtn = document.getElementById('startBtn');
const moneyInput = document.getElementById('moneyInput');
const fuelSelect = document.getElementById('fuelSelect');
const cardCheckbox = document.getElementById('cardCheckbox');
const statusMessage = document.getElementById('statusMessage');
const totalRevenueDisplay = document.getElementById('totalRevenue');
const pumpsGrid = document.getElementById('pumpsGrid');
const transactionsList = document.getElementById('transactionsList');
const storageStatus = document.getElementById('storageStatus');
const queueList = document.getElementById('queueList');
const queueCount = document.getElementById('queueCount');
const reportModal = document.getElementById('reportModal');
const reportData = document.getElementById('reportData');

function renderPumps() {
    pumps.forEach(pump => {
        // Ищем уже существующую карточку колонки на странице
        let pumpDiv = document.querySelector(`[data-pump-id="${pump.id}"]`);
        
        // Если карточки еще нет (первый запуск) — создаем её
        if (!pumpDiv) {
            pumpDiv = document.createElement('div');
            pumpDiv.setAttribute('data-pump-id', pump.id);
            pumpsGrid.appendChild(pumpDiv);
        }

        // Обновляем только классы и текст, не трогая внутренности, если там идет анимация
        pumpDiv.className = `pump-card ${pump.status}`;
        
        // Если колонка освободилась — очищаем её полностью
        if (pump.status === 'available') {
            pumpDiv.innerHTML = `
                <h3>Колонка №${pump.id}</h3>
                <p>Топливо: ${pump.fuelType}</p>
                <small>Свободна</small>
            `;
        } 
        // Если занята и там НЕТ полоски — рисуем заголовок и место под полоску
        else if (pump.status === 'busy' && !pumpDiv.querySelector('.progress-bar')) {
            pumpDiv.innerHTML = `
                <h3>Колонка №${pump.id}</h3>
                <p>Топливо: ${pump.fuelType}</p>
                <div class="progress-container"><div id="bar-${pump.id}" class="progress-bar"></div></div>
                <small>Заправка...</small>
            `;
        }
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
        let statusClass = (amount <= 0) ? 'out-of-stock' : (amount < 100 ? 'critical-low' : '');
        item.innerHTML = `${fuel.toUpperCase()}: <span class="${statusClass}">${amount.toFixed(2)} л</span>`;
        storageStatus.appendChild(item);
    }
}

function renderQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    queueCount.innerText = waitingQueue.length;
    waitingQueue.forEach((car, index) => {
        const carDiv = document.createElement('div');
        carDiv.className = 'queue-item fade-in';
        carDiv.innerHTML = `<b>#${index + 1}</b> ${car.fuelType} (${car.money}р)`;
        queueList.appendChild(carDiv);
    });
}
function animateProgress(pumpId, duration) {
    let start = null;
    function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const percentage = Math.min((elapsed / duration) * 100, 100);
        
        const bar = document.getElementById(`bar-${pumpId}`);
        // Если бар существует на странице — двигаем его
        if (bar) {
            bar.style.width = percentage + '%';
        }

        if (elapsed < duration) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}


function getTotalRevenue() {
    return transactionHistory.reduce((total, t) => total + t.amount, 0);
}

// --- 4. ОБРАБОТЧИКИ СОБЫТИЙ ---

startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    if (isNaN(money) || money <= 0) {
        statusMessage.innerText = "Ошибка: введите сумму!";
        return;
    }

    const response = startDispenser(money, fuelType, hasCard);

    if (response.success) {
        statusMessage.innerText = `Заправка начата: ${fuelType}`;
        runRefuel(money, fuelType, hasCard, response.pump, response.liters);
    } else if (response.message.includes("заняты")) {
        // ДОБАВЛЯЕМ В ОЧЕРЕДЬ
        waitingQueue.push({ money, fuelType, hasCard });
        renderQueue();
        statusMessage.innerText = "Все колонки заняты. Машина добавлена в очередь.";
    } else {
        statusMessage.innerText = response.message;
    }
    moneyInput.value = '';
});

// Отчет за смену
function generateShiftReportHTML() {
    const report = { '92': { l: 0, r: 0 }, '95': { l: 0, r: 0 }, '98': { l: 0, r: 0 }, 'diesel': { l: 0, r: 0 } };
    transactionHistory.forEach(t => {
        const l = calculateLiters(t.amount, t.fuel, t.withCard);
        report[t.fuel].l += Number(l);
        report[t.fuel].r += t.amount;
    });
    let html = "";
    for (let f in report) { if (report[f].r > 0) html += `<p><b>${f.toUpperCase()}</b>: ${report[f].l.toFixed(2)} л<br>Сумма: ${report[f].r} р</p>`; }
    html += `<hr><h3>ИТОГО: ${getTotalRevenue()} р</h3>`;
    return html;
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    reportData.innerHTML = generateShiftReportHTML();
    reportModal.style.display = "block";
});

document.querySelector('.close-modal').onclick = () => reportModal.style.display = "none";

document.getElementById('confirmCloseShift').onclick = () => {
    if (confirm("Сбросить смену и ТОПЛИВО?")) {
        localStorage.clear();
        location.reload();
    }
};

document.getElementById('updatePricesBtn').addEventListener('click', () => {
    fuelPrices['92'] = Number(document.getElementById('price92').value);
    fuelPrices['95'] = Number(document.getElementById('price95').value);
    fuelPrices['98'] = Number(document.getElementById('price98').value);
    fuelPrices['diesel'] = Number(document.getElementById('priceDiesel').value);
    statusMessage.innerText = "Цены обновлены!";
});

// СТАРТ
renderPumps();
renderTransactions();
renderStorage();
renderQueue();
totalRevenueDisplay.innerText = getTotalRevenue();




