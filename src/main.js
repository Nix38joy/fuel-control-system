// =============================================================================
// 1. КОНСТАНТЫ И СОСТОЯНИЕ (STATE)
// =============================================================================

const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];
const waitingQueue = [];

// DOM-элементы
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

// =============================================================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (расчёты, звуки, анимации)
// =============================================================================

function getTotalRevenue() {
    return transactionHistory.reduce((total, t) => total + t.amount, 0);
}

function animateProgress(pumpId, duration) {
    let start = null;
    function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const percentage = Math.min((elapsed / duration) * 100, 100);
        const bar = document.getElementById(`bar-${pumpId}`);
        if (bar) bar.style.width = percentage + '%';
        if (elapsed < duration) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

function playFinishSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* браузер заблокировал автовоспроизведение */ }
}

function updateFuelSelectOptions() {
    if (!fuelSelect) return;
    const options = fuelSelect.options;
    for (let i = 0; i < options.length; i++) {
        const fuel = options[i].value;
        const amount = Number(fuelStorage[fuel]);
        options[i].text = amount <= 0 ? `${fuel.toUpperCase()} (НЕТ В НАЛИЧИИ)` : fuel.toUpperCase();
    }
}

function checkStartButton() {
    if (!startBtn || !fuelSelect) return;
    const selectedFuel = fuelSelect.value;
    const amount = Number(fuelStorage[selectedFuel]);
    if (amount <= 0) {
        startBtn.disabled = true;
        startBtn.innerText = "НЕТ ТОПЛИВА";
    } else {
        startBtn.disabled = false;
        startBtn.innerText = "ЗАПРАВИТЬ";
    }
}

function generateShiftReportHTML() {
    const report = { '92': { l: 0, r: 0 }, '95': { l: 0, r: 0 }, '98': { l: 0, r: 0 }, 'diesel': { l: 0, r: 0 } };
    transactionHistory.forEach(t => {
        const liters = t.amount / t.priceAtMoment;
        report[t.fuel].l += Number(liters);
        report[t.fuel].r += t.amount;
    });
    let html = "";
    for (let f in report) {
        if (report[f].r > 0) {
            html += `<p><b>${f.toUpperCase()}</b>: ${report[f].l.toFixed(2)} л<br>Сумма: ${report[f].r} р</p>`;
        }
    }
    html += `<hr><h3>ИТОГО: ${getTotalRevenue()} р</h3>`;
    return html;
}

// =============================================================================
// 3. ФУНКЦИИ РЕНДЕРИНГА
// =============================================================================

function renderPumps() {
    pumps.forEach(pump => {
        let pumpDiv = document.querySelector(`[data-pump-id="${pump.id}"]`);
        if (!pumpDiv) {
            pumpDiv = document.createElement('div');
            pumpDiv.setAttribute('data-pump-id', pump.id);
            pumpsGrid.appendChild(pumpDiv);
        }
        pumpDiv.className = `pump-card ${pump.status}`;
        if (pump.status === 'available') {
            pumpDiv.innerHTML = `
                <h3>Колонка №${pump.id}</h3>
                <p>Топливо: ${pump.fuelType}</p>
                <small>Свободна</small>
            `;
        } else if (pump.status === 'busy' && !pumpDiv.querySelector('.progress-bar')) {
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
        const statusClass = (amount <= 0) ? 'out-of-stock' : (amount < 100 ? 'critical-low' : '');
        item.innerHTML = `${fuel.toUpperCase()}: <span class="${statusClass}">${amount.toFixed(2)} л</span>`;
        storageStatus.appendChild(item);
    }
    updateFuelSelectOptions();
    checkStartButton();
}

function renderQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    if (queueCount) queueCount.innerText = waitingQueue.length;
    waitingQueue.forEach((car, index) => {
        const carDiv = document.createElement('div');
        carDiv.className = 'queue-item fade-in';
        carDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span><b>#${index + 1}</b> ${car.fuelType} (${car.money}р)${car.hasCard ? ' 💳' : ''}</span>
                <button onclick="removeFromQueue(${index})" aria-label="Удалить из очереди" class="queue-remove-btn">✕</button>
            </div>
        `;
        queueList.appendChild(carDiv);
    });
}

function refreshUI() {
    renderTransactions();
    renderStorage();
    if (totalRevenueDisplay) totalRevenueDisplay.innerText = getTotalRevenue();
}

// =============================================================================
// 4. ОСНОВНАЯ ЛОГИКА
// =============================================================================

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

    return { success: true, pump, liters: Number(litersNeeded) };
}

function runRefuel(money, fuelType, hasCard, pump, liters) {
    const currentPrice = fuelPrices[fuelType];
    fuelStorage[fuelType] = Number((Number(fuelStorage[fuelType]) - liters).toFixed(2));
    localStorage.setItem('fuelInventory', JSON.stringify(fuelStorage));

    transactionHistory.push({
        amount: money, fuel: fuelType, pumpId: pump.id, 
        priceAtMoment: currentPrice, time: new Date().toLocaleTimeString(), withCard: hasCard
    });
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));

    reservePump(pump.id);
    renderPumps();
    refreshUI();
    animateProgress(pump.id, 30000);

    setTimeout(() => {
        releasePump(pump.id);
        renderPumps();
        playFinishSound();
        statusMessage.innerText = `Колонка №${pump.id} свободна`;
        checkQueue(); 
    }, 30000);
}

function checkQueue() {
    if (waitingQueue.length === 0) return;
    for (let i = 0; i < waitingQueue.length; i++) {
        const car = waitingQueue[i];
        const res = startDispenser(car.money, car.fuelType, car.hasCard);
        if (res.success) {
            waitingQueue.splice(i, 1);
            renderQueue();
            runRefuel(car.money, car.fuelType, car.hasCard, res.pump, res.liters);
            break;
        }
    }
}

function removeFromQueue(index) {
    waitingQueue.splice(index, 1);
    renderQueue();
}

// =============================================================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ (EVENT LISTENERS)
// =============================================================================

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
        runRefuel(money, fuelType, hasCard, response.pump, response.liters);
    } else if (response.message.includes("заняты")) {
        waitingQueue.push({ money, fuelType, hasCard });
        renderQueue();
        statusMessage.innerText = "Машина добавлена в очередь.";
    } else {
        statusMessage.innerText = response.message;
    }
    moneyInput.value = '';
});

fuelSelect.addEventListener('change', checkStartButton);

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    reportData.innerHTML = generateShiftReportHTML();
    reportModal.style.display = "block";
});

document.querySelector('.close-modal').onclick = () => reportModal.style.display = "none";

document.getElementById('confirmCloseShift').onclick = () => {
    if (confirm("Сбросить смену и топливо?")) {
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

// Кнопка ОЧИСТИТЬ ПОЛЯ
const cancelBtn = document.getElementById('cancelBtn');
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        moneyInput.value = '';
        fuelSelect.value = '92'; // или твой дефолтный вид топлива
        cardCheckbox.checked = false;
        statusMessage.innerText = 'Готов к работе';
        checkStartButton(); // Сразу разблокируем кнопку, если 92-й есть в наличии
    });
}


// ИНИЦИАЛИЗАЦИЯ
renderPumps();
refreshUI();
renderQueue();
