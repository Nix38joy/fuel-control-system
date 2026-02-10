function calculateFuelLimit(money, fuelType, hasCard) {
    const validFuels = ['92', '95', '98', 'diesel'];

    if (!validFuels.includes(fuelType)) {
        return `Ошибка: тип топлива "${fuelType}" не поддерживается.`;
    }

    let minSum = hasCard ? 300 : 500;
    let min98 = hasCard ? 1500 : 2000;

    if (money < minSum) {
        return `Минимальная сумма заправки ${minSum} р`;
    } 
    if (fuelType === "98" && money < min98) {
        return `Для 98-го бензина мин. сумма ${min98} р`;
    } 
    if (fuelType === "diesel" && money < 1000) {
        return `Минимальная сумма для дизеля 1000 р`;
    }

    return "success"; 
}


// module.exports = { calculateFuelLimit }; // Закомментируй для браузера







// module.exports = { calculateFuelLimit };
