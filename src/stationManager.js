const pumps = [
    { id: 1, fuelType: '95', status: 'available' },
    { id: 2, fuelType: '92', status: 'available' },
    { id: 3, fuelType: '95', status: 'available' },
    { id: 4, fuelType: 'diesel', status: 'maintenance' },
    { id: 5, fuelType: '98', status: 'available'}
];

function getAvailablePumps() {
    return pumps.filter(pump => pump.status === 'available');
}

console.log(getAvailablePumps());

function findPumpByFuel(type) {
    
    const available = getAvailablePumps();
    
    return available.find(pump => pump.fuelType === type);
}

console.log(findPumpByFuel('95'));

function reservePump(id) {
    // Находим нужную колонку в массиве
    const pump = pumps.find(p => p.id === id);
    
    // Если нашли — меняем статус
    if (pump) {
        pump.status = 'busy';
        console.log(`Колонка №${id} теперь занята.`);
    }
}

function releasePump(id) {
    const pump = pumps.find(p => p.id === id);
    if (pump) {
        pump.status = 'available';
        console.log(`Колонка №${id} снова свободна!`);
    }
}

function checkFuelExistence(type) {
    // Ищем в массиве ХОТЯ БЫ ОДНУ колонку с таким топливом
    return pumps.some(p => p.fuelType === type);
}







// module.exports = { findPumpByFuel };
