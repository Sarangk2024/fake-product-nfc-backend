// const CryptoJS = require("crypto-js");
// const fs = require("fs");
// const path = require("path");

// // Load secrets
// const secretsPath = path.join(__dirname, "data", "secrets.json");
// const secrets = JSON.parse(fs.readFileSync(secretsPath));

// // ---- DEMO INPUT ----
// const productId = "PROD-1001";

// // Get stored secret
// const secret = secrets[productId];
// if (!secret) {
//   console.log("Product not found");
//   process.exit(1);
// }

// // Simulated challenge (normally from backend)
// const challenge = "demoChallenge123";

// // Simulate NFC response
// const response = CryptoJS.SHA256(secret + challenge).toString();

// console.log("Demo Details:");
// console.log("Product ID:", productId);
// console.log("Challenge:", challenge);
// console.log("Response (hash):", response);
// console.log("Status: GENUINE (demo)");


const CryptoJS = require("crypto-js");
const secrets = require("./data/secrets.json");

const productId = "PROD-1001";
const challenge = "5c8f2772dd11fb9d"; // ← REAL challenge

const secret = secrets[productId];

const response = CryptoJS.SHA256(secret + challenge).toString();

console.log("Product ID:", productId);
console.log("Challenge :", challenge);
console.log("Response  :", response);
