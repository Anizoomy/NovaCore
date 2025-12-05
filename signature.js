const crypto = require("crypto");

// Your webhook secret key
const secret = "sk_test_2CrrgJ8j5Yg3x1w5qva1d3hHGgBXjMT5QhL8UWbV";

// Raw JSON body (MUST be a single-line string!)
const rawBody = `{"event":"charge.success","data":{"reference":"KRPAY_1764937686055_32991","amount":1000000,"currency":"NGN","status":"success","metadata":{"userId":"69285c0f76bceab1020ec917","email":"habeebolayemi518@gmail.com"}}}`;

const signature = crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");

console.log("Your webhook signature:", signature);
