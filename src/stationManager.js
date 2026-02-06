const pumps = [
    { id: 1, fuelType: '95', status: 'available' },
    { id: 2, fuelType: '92', status: 'busy' },
    { id: 3, fuelType: '95', status: 'available' },
    { id: 4, fuelType: 'diesel', status: 'maintenance' },
    { id: 5, fuelType: '98', status: 'busy'}
];

function getAvailablePumps() {
    return pumps.filter(pump => pump.status === 'available');
}

console.log(getAvailablePumps());