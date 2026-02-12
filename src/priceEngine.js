const fuelPrices = {
    '92': 50,
    '95': 55,
    '98': 65,
    'diesel': 60
};


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
    const minDiesel = 1500;
    if (fuelType === "diesel" && money < minDiesel) {
        return `Минимальная сумма для дизеля ${minDiesel} р`;
    }

    return "success"; 
}

function calculateLiters(money, fuelType, hasCard) {
    let price = fuelPrices[fuelType];

    if (hasCard) {
        price = price * 0.98;
    }
    return (money / price).toFixed(2);
}


// module.exports = { calculateFuelLimit }; // Закомментируй для браузера







// module.exports = { calculateFuelLimit };
