const axios = require('axios');
const appId = "rzp_live_rKqF1K01WqZ1hP";
const secretKey = "R4aQ7Wq1Xv7c6bU9W2vD8hM5";
const auth = Buffer.from(`${appId}:${secretKey}`).toString("base64");

axios.post('https://api.razorpay.com/v1/payment_links', {
  amount: 100,
  currency: "INR",
  description: "Test",
  customer: {
    name: "Test",
    email: "test@test.com",
    contact: "9999999999"
  },
  callback_url: "https://example.com",
  callback_method: "get"
}, {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Basic ${auth}`
  }
}).then(res => {
  console.log("SUCCESS");
}).catch(err => {
  console.log("ERROR:", err.response?.data);
});
