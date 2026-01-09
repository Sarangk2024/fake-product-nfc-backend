const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

// Load secrets file
const secretsPath = path.join(__dirname, "data", "secrets.json");
const secrets = JSON.parse(fs.readFileSync(secretsPath));

// ----- INPUT (SIMULATED MANUFACTURER INPUT) -----
const batchId = "BATCH001";
const batchSize = 3;
const startProductId = 1001;

// ----- STEP 1: GENERATE BATCH SECRET -----
const batchSecret = CryptoJS.lib.WordArray.random(16).toString();

// ----- STEP 2: GENERATE PRODUCTS -----
for (let i = 0; i < batchSize; i++) {
  const productId = `PROD-${startProductId + i}`;

  // STEP 3: GENERATE PRODUCT SECRET
  const productSecret = CryptoJS.SHA256(batchSecret + productId).toString();

  // STEP 4: STORE OFF-CHAIN
  secrets[productId] = productSecret;

  console.log(`Registered ${productId}`);
}

// ----- STEP 5: SAVE TO FILE -----
fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));

console.log("Batch registration complete");
