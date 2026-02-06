const { calculateFuelLimit } = require('./priceEngine');
const { findPumpByFuel } = require('./stationManager');

// 1. Наш бортовой журнал
const transactionHistory = [];

function startDispenser(money, fuelType, hasCard) {
    const limitCheck = calculateFuelLimit(money, fuelType, hasCard);
    
    if (limitCheck.includes("Ошибка") || limitCheck.includes("Минимальная")) {
        return limitCheck;
    }

    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        return `Извините, все колонки для топлива "${fuelType}" сейчас заняты.`;
    }

    // 2. ЗАПИСЫВАЕМ ЧЕК ПЕРЕД ВЫДАЧЕЙ УСПЕХА
    transactionHistory.push({
        amount: money,
        fuel: fuelType,
        pumpId: pump.id,
        time: new Date().toLocaleTimeString()
    });

    return `Успех! Оплата принята. Проезжайте к колонке №${pump.id}`;
}

// 3. ТЕСТОВАЯ СМЕНА (делаем 3 заправки)
console.log(startDispenser(1000, '95', true));
console.log(startDispenser(2500, '92', false));
console.log(startDispenser(5000, 'diesel', true));

// 4. ВЫВОДИМ ОТЧЕТ
console.log("\n--- ОТЧЕТ ЗА СМЕНУ ---");
console.log("Транзакции:", transactionHistory);

// Считаем общую сумму через цикл (так проще для начала)
let total = 0;
transactionHistory.forEach(t => total += t.amount);
console.log(`ИТОГО В КАССЕ: ${total} р`);


