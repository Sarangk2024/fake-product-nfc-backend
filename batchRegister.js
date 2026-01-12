const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

// Load secrets file
const secretsPath = path.join(__dirname, "data", "secrets.json");
const secrets = fs.existsSync(secretsPath)
  ? JSON.parse(fs.readFileSync(secretsPath))
  : {};

// -------- INPUT (MANUFACTURER) --------
const batchId = "BATCH001";
const batchSize = 3;
const startProductId = 1001;

// -------- STEP 1: BATCH SECRET --------
const batchSecret = CryptoJS.lib.WordArray.random(16).toString();

console.log("Batch ID:", batchId);
console.log("Batch Secret Generated");

// -------- STEP 2: PRODUCT GENERATION --------
for (let i = 0; i < batchSize; i++) {
  const productId = `PROD-${startProductId + i}`;

  // Product secret (derived)
  const productSecret = CryptoJS.SHA256(
    batchSecret + productId
  ).toString();

  secrets[productId] = productSecret;
  console.log(`Registered ${productId}`);
}

// -------- SAVE --------
fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
console.log("Batch registration complete");
