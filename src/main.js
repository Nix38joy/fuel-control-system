const { calculateFuelLimit } = require('./priceEngine');
const { findPumpByFuel } = require('./stationManager');

function startDispenser(money, fuelType, hasCard) {
    // 1. Проверяем деньги и тип топлива (через модуль цен)
    const limitCheck = calculateFuelLimit(money, fuelType, hasCard);
    
    // Если там есть слово "Ошибка" или "Минимальная" — возвращаем этот текст и выходим
    if (limitCheck.includes("Ошибка") || limitCheck.includes("Минимальная")) {
        return limitCheck;
    }

    // 2. Ищем колонку (через модуль станций)
    const pump = findPumpByFuel(fuelType);
    
    if (!pump) {
        return `Извините, все колонки для топлива "${fuelType}" сейчас заняты.`;
    }

    // 3. Если всё ок — выдаем успех
    return `Успех! Оплата принята. Проезжайте к колонке №${pump.id}`;
}

// ТЕСТЫ:
console.log(startDispenser(2000, '95', false)); // Должен быть успех
console.log(startDispenser(2000, 'жидкий азот', true)); // Должна быть ошибка
