const { calculateFuelLimit } = require('./priceEngine');
const { findPumpByFuel } = require('./stationManager');

function startDispenser(money, fuelType, hasCard) {
    // 1. Проверяем лимиты
    const limitCheck = calculateFuelLimit(money, fuelType, hasCard);
    
    // Если функция вернула ошибку или текст про минималку — стоп
    if (limitCheck.includes("Минимальная") || limitCheck.includes("Ошибка")) {
        return limitCheck;
    }

    // 2. Ищем колонку
    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        return "Извините, все колонки с этим топливом сейчас заняты.";
    }

    // 3. Итоговый успех
    return `Успех! Оплата принята. Проезжайте к колонке №${pump.id}`;
}

// ПРОВЕРКА:
console.log(startDispenser(2000, '95', false));
