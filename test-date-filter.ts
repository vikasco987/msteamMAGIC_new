const date = "2026-09-05";

// Current API logic
const startUTC = new Date(`${date}T00:00:00.000Z`);
const endUTC = new Date(`${date}T23:59:59.999Z`);

console.log("API Start (UTC):", startUTC.toISOString());
console.log("API End (UTC):", endUTC.toISOString());

// Correct IST logic
const [year, month, day] = date.split('-').map(Number);
const startIST = new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0));
const endIST = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

console.log("IST Start (UTC):", startIST.toISOString());
console.log("IST End (UTC):", endIST.toISOString());
