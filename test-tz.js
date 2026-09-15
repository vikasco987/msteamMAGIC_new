const { toZonedTime } = require('date-fns-tz');
const d = new Date('2026-09-12T04:44:00Z');
const z = toZonedTime(d, 'Asia/Kolkata');
console.log(z.getHours(), z.getUTCHours());
