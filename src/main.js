
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

        // ... внутри startDispenser, после поиска pump ...

    // Бронируем колонку, чтобы она стала занятой
    reservePump(pump.id);

    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });


    // 3. Записываем успешную транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });

    return `Успех! Оплата принята. Проезжайте к колонке №${pump.id}`;
}

function renderPumps() {
    const pumpsGrid = document.getElementById('pumpsGrid');
    pumpsGrid.innerHTML = ''; // Очищаем сетку

    pumps.forEach(pump => {
        // Создаем элемент карточки
        const pumpDiv = document.createElement('div');
        
        // Добавляем классы (базовый + класс статуса для цвета из CSS)
        pumpDiv.className = `pump-card ${pump.status}`;
        
        // Наполняем текстом
        pumpDiv.innerHTML = `
            <h3>Колонка №${pump.id}</h3>
            <p>Топливо: ${pump.fuelType}</p>
            <small>${pump.status === 'available' ? 'Свободна' : 'Занята'}</small>
        `;
        
        // Добавляем в сетку
        pumpsGrid.appendChild(pumpDiv);
    });
}

// Вызываем один раз при загрузке, чтобы увидеть колонки сразу
renderPumps();


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
    renderPumps();
    // Очищаем поле ввода для следующего клиента
    moneyInput.value = '';
});


// 1. Находим кнопку "Отменить"
const cancelBtn = document.getElementById('cancelBtn');

// 2. Вешаем слушателя
cancelBtn.addEventListener('click', () => {
    // Очищаем поле ввода суммы
    moneyInput.value = '';
    
    // Сбрасываем выбор топлива на первый вариант (92)
    fuelSelect.value = '92';
    
    // Снимаем галочку с карты лояльности
    cardCheckbox.checked = false;
    
    // Возвращаем статусное сообщение в исходный вид
    statusMessage.innerText = 'Готов к работе';
    
    console.log('Операция отменена пользователем');
});

