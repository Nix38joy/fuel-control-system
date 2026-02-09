// --- СОСТОЯНИЕ СИСТЕМЫ (State) ---
// Пытаемся достать данные из памяти, если их нет — создаем пустой массив
const savedTransactions = localStorage.getItem('fuelTransactions');
const transactionHistory = savedTransactions ? JSON.parse(savedTransactions) : [];


// --- ГЛАВНАЯ ЛОГИКА (Бизнес-процесс) ---

function startDispenser(money, fuelType, hasCard) {
    // 1. Проверяем лимиты в priceEngine.js
    const limitCheck = calculateFuelLimit(money, fuelType, hasCard);
    
    // Если вернулась ошибка по деньгам или типу топлива
    if (limitCheck.includes("Ошибка") || limitCheck.includes("Минимальная")) {
        return { message: limitCheck, success: false };
    }

    // 2. Ищем свободную колонку в stationManager.js
      // 2. Ищем свободную колонку
    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        // Если свободную не нашли, лезем в основной массив pumps проверить причину
        // (ВАЖНО: переменная pumps должна быть доступна из stationManager.js)
        const allPumpsOfThisType = pumps.filter(p => p.fuelType === fuelType);
        
        if (allPumpsOfThisType.length === 0) {
            return { message: `Ошибка: тип топлива "${fuelType}" не поддерживается.`, success: false };
        }

        // Проверяем, есть ли среди них те, что в ремонте
        const isMaintenance = allPumpsOfThisType.every(p => p.status === 'maintenance');
        
        if (isMaintenance) {
            return { message: `Извините, колонка с "${fuelType}" на тех. обслуживании.`, success: false };
        }

        return { message: `Извините, все колонки для "${fuelType}" сейчас заняты.`, success: false };
    }



    // 3. ЕСЛИ ВСЁ ОК: Сохраняем транзакцию
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });

localStorage.setItem('fuelTransactions', JSON.stringify(transactionHistory));


    // Возвращаем объект с успехом и данными о колонке
    return { 
        message: `Успех! Проезжайте к колонке №${pump.id}`, 
        success: true, 
        pump: pump 
    };
}

// Функция расчета выручки
function getTotalRevenue() {
    let total = 0;
    transactionHistory.forEach(t => total += t.amount);
    return total;
}

// --- ИНТЕРФЕЙС (DOM и Рендеринг) ---

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const moneyInput = document.getElementById('moneyInput');
const fuelSelect = document.getElementById('fuelSelect');
const cardCheckbox = document.getElementById('cardCheckbox');
const statusMessage = document.getElementById('statusMessage');
const totalRevenueDisplay = document.getElementById('totalRevenue');
const pumpsGrid = document.getElementById('pumpsGrid');

// Функция отрисовки колонок на экране
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

// Кнопка "Заправить"
startBtn.addEventListener('click', () => {
    const money = Number(moneyInput.value);
    const fuelType = fuelSelect.value;
    const hasCard = cardCheckbox.checked;

    const response = startDispenser(money, fuelType, hasCard);
    statusMessage.classList.remove('fade-in'); // Сначала убираем класс
    void statusMessage.offsetWidth;           // Магия для перезапуска анимации
    statusMessage.classList.add('fade-in');    // Добавляем снова
    statusMessage.innerText = response.message;

    if (response.success) {
        const currentPump = response.pump; // Та самая ОДНА колонка
        
        reservePump(currentPump.id); // Занимаем её
        renderPumps();               // Перерисовываем (стала оранжевой)
        totalRevenueDisplay.innerText = getTotalRevenue(); // Обновляем деньги

        // Таймер освобождения через 10 секунд
        setTimeout(() => {
            releasePump(currentPump.id); // Освобождаем в данных
            renderPumps();               // Перерисовываем (стала зеленой)
            statusMessage.innerText = `Колонка №${currentPump.id} освободилась. Готов к работе!`;
        }, 10000);
    }

    moneyInput.value = '';
});

// Кнопка "Отменить"
cancelBtn.addEventListener('click', () => {
    moneyInput.value = '';
    fuelSelect.value = '92';
    cardCheckbox.checked = false;
    statusMessage.innerText = 'Готов к работе';
});

// Первичная отрисовка при загрузке страницы
renderPumps();

totalRevenueDisplay.innerText = getTotalRevenue();

const clearHistoryBtn = document.getElementById('clearHistoryBtn');

clearHistoryBtn.addEventListener('click', () => {
    // Наш "предохранитель"
    const isConfirmed = confirm("Вы уверены, что хотите ЗАКРЫТЬ СМЕНУ? Все данные о выручке будут удалены безвозвратно!");

    if (isConfirmed) {
        // 1. Очищаем массив в памяти программы
        transactionHistory.length = 0; 
        
        // 2. Удаляем запись из памяти браузера
        localStorage.removeItem('fuelTransactions');
        
        // 3. Обновляем экран
        totalRevenueDisplay.innerText = '0';
        statusMessage.innerText = 'Смена закрыта. Касса обнулена.';
        
        console.log('Смена закрыта оператором, данные очищены.');
    } else {
        console.log('Сброс отменен. Данные в сохранности.');
    }
});


