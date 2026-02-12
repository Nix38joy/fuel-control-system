const REFUEL_DURATION_MS = 30000;

const savedStorage = localStorage.getItem('fuelInventory');
const fuelStorage = savedStorage ? JSON.parse(savedStorage) : {
    '92': 5000,
    '95': 3000,
    '98': 1500,
    'diesel': 10000
};

function getDefaultPumps() {
    return [
        { id: 1, fuelType: '92', status: 'available' },
        { id: 2, fuelType: '92', status: 'available' },
        { id: 3, fuelType: '95', status: 'available' },
        { id: 4, fuelType: '95', status: 'available' },
        { id: 5, fuelType: '98', status: 'available' },
        { id: 6, fuelType: '98', status: 'available' },
        { id: 7, fuelType: 'diesel', status: 'available' },
        { id: 8, fuelType: 'diesel', status: 'available' }
    ];
}

function loadPumps() {
    const saved = localStorage.getItem('fuelPumps');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.length !== 8) return getDefaultPumps(); // миграция с 5 на 8 колонок
            const now = Date.now();
            parsed.forEach(p => {
                if (p.status === 'busy' && p.busySince && (now - p.busySince > REFUEL_DURATION_MS)) {
                    p.status = 'available';
                    delete p.busySince;
                }
            });
            return parsed;
        } catch (e) {
            return getDefaultPumps();
        }
    }
    return getDefaultPumps();
}

const pumps = loadPumps();

function savePumps() {
    localStorage.setItem('fuelPumps', JSON.stringify(pumps));
}

function getAvailablePumps() {
    return pumps.filter(pump => pump.status === 'available');
}

function findPumpByFuel(type) {
    const available = getAvailablePumps();
    return available.find(pump => pump.fuelType === type);
}

function reservePump(id) {
    const pump = pumps.find(p => p.id === id);
    if (pump) {
        pump.status = 'busy';
        pump.busySince = Date.now();
        savePumps();
    }
}

function releasePump(id) {
    const pump = pumps.find(p => p.id === id);
    if (pump) {
        pump.status = 'available';
        delete pump.busySince;
        savePumps();
    }
}

function checkFuelExistence(type) {
    // Ищем в массиве ХОТЯ БЫ ОДНУ колонку с таким топливом
    return pumps.some(p => p.fuelType === type);
}







// module.exports = { findPumpByFuel };
