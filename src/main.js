
// const { calculateFuelLimit } = require('./priceEngine');
// const { findPumpByFuel } = require('./stationManager');

// --- СОСТОЯНИЕ СИСТЕМЫ (State) ---
const transactionHistory = [];

// --- ГЛАВНАЯ ЛОГИКА ---

function startDispenser(money, fuelType, hasCard) {
    // 1. Проверяем лимиты и тип топлива через priceEngine
    const limitCheck = calculateFuelLimit(money, fuelType, hasCard);
    
    if (limitCheck.includes("Ошибка") || limitCheck.includes("Минимальная")) {
        return limitCheck;
    }

    // 2. Ищем свободную колонку через stationManager
    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        return `Извините, все колонки для топлива "${fuelType}" сейчас заняты.`;
    }

    // 3. Записываем успешную транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });

    return `Успех! Оплата принята. Проезжайте к колонке №${pump.id}`;
}

// Функция для расчета общей выручки
function getTotalRevenue() {
    let total = 0;
    transactionHistory.forEach(t => total += t.amount);
    return total;
}

// --- ИНТЕРФЕЙС (Связь с HTML) ---

// Находим все элементы на странице
const startBtn = document.getElementById('startBtn');
const moneyInput = document.getElementById('moneyInput');
const fuelSelect = document.getElementById('fuelSelect');
const cardCheckbox = document.getElementById('cardCheckbox');
const statusMessage = document.getElementById('statusMessage');
const totalRevenueDisplay = document.getElementById('totalRevenue');

// Слушаем нажатие кнопки "Заправить"
startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    // Запускаем процесс и получаем текст ответа
    const result = startDispenser(money, fuelType, hasCard);

    // Выводим текст ответа прямо на экран!
    statusMessage.innerText = result;

    // Обновляем цифру выручки на экране
    totalRevenueDisplay.innerText = getTotalRevenue();
    
    // Очищаем поле ввода для следующего клиента
    moneyInput.value = '';
});



