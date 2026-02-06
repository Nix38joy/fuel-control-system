function calculateFuelLimit(money, fuelType, hasCard) {
    let minSum;
    let min98;
    const validFuels = ['92', '95', '98', 'diesel'];

if (!validFuels.includes(fuelType)) {
    return `Ошибка: тип топлива "${fuelType}" не поддерживается нашей АЗС.`;
}


    if (hasCard) {
        minSum = 300;
        min98 = 1500;
    } else {
        minSum = 500;
        min98 = 2000;
    }

    if (money < minSum) {
        return `Минимальная сумма заправки ${minSum} р`;
    } 
    else if (fuelType === "98" && money < min98) {
        return `Для 98-го бензина мин. сумма ${min98} р`;
    } 
    else if (fuelType === "diesel" && money < 1000) {
        return `Минимальная сумма для дизеля 1000 р`;
    }
    else if (fuelType === "92" || fuelType === "95") {
        return "Заправка разрешена, ожидайте";
    } 
    else {
        return "Ошибка: несуществующий вид топлива";
    }
}







module.exports = { calculateFuelLimit };
