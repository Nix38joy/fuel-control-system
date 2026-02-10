const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];

function startDispenser(money, fuelType, hasCard) {
    const limitResult = calculateFuelLimit(money, fuelType, hasCard);
    if (limitResult !== "success") return { message: limitResult, success: false };

    const pump = findPumpByFuel(fuelType);
    if (!pump) return { message: `Извините, все колонки для "${fuelType}" заняты.`, success: false };

    transactionHistory.push({
        amount: money, fuel: fuelType, pumpId: pump.id, time: new Date().toLocaleTimeString()
    });
    localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));

    return { message: `Успех! Проезжайте к колонке №${pump.id}`, success: true, pump: pump };
}

function getTotalRevenue() {
    return transactionHistory.reduce((total, t) => total + t.amount, 0);
}

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
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
        pumpDiv.innerHTML = `<h3>Колонка №${pump.id}</h3><p>Топливо: ${pump.fuelType}</p>`;
        pumpsGrid.appendChild(pumpDiv);
    });
}

function renderTransactions() {
    transactionsList.innerHTML = '';
    [...transactionHistory].reverse().slice(0, 10).forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item fade-in';
        item.innerHTML = `<span>+ ${t.amount} р</span><span>№${t.pumpId}</span><span>${t.time}</span>`;
        transactionsList.appendChild(item);
    });
}

startBtn.addEventListener('click', () => {
    const response = startDispenser(Number(moneyInput.value), fuelSelect.value, cardCheckbox.checked);
    statusMessage.innerText = response.message;
    if (response.success) {
        reservePump(response.pump.id);
        renderPumps();
        renderTransactions();
        totalRevenueDisplay.innerText = getTotalRevenue();
        setTimeout(() => { releasePump(response.pump.id); renderPumps(); }, 10000);
    }
    moneyInput.value = '';
});

renderPumps();
renderTransactions();
totalRevenueDisplay.innerText = getTotalRevenue();



