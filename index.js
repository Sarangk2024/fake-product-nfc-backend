// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const crypto = require("crypto");
// const CryptoJS = require("crypto-js");
// const fs = require("fs");
// const path = require("path");
// const { ethers } = require("ethers");

// // ---------------- BASIC CONFIG ----------------
// const PORT = process.env.PORT || 5000;
// const CONTRACT_ADDRESS = "0x7849215cFdB25b0028E4FF104B8fA1d1b98286aa";

// // ---------------- LOAD SECRETS (CORRECT PATH) ----------------
// const secretsPath = path.join(__dirname, "data", "secrets.json");
// const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));

// // ---------------- LOAD CONTRACT ABI ----------------
// const contractABI =
//   require("./blockchain/ProductRegistry.json").abi;

// // ---------------- BLOCKCHAIN PROVIDER ----------------
// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.SEPOLIA_RPC_URL
// );

// const contract = new ethers.Contract(
//   CONTRACT_ADDRESS,
//   contractABI,
//   provider
// );

// // ---------------- APP SETUP ----------------
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Store active challenges in memory
// const activeChallenges = {};

// // ---------------- ROUTES ----------------

// // Health check
// app.get("/", (req, res) => {
//   res.send("Backend running");
// });

// // STEP 1: Generate challenge
// app.post("/challenge", async (req, res) => {
//   const { productId } = req.body;

//   if (!productId) {
//     return res.status(400).json({
//       error: "Product ID required"
//     });
//   }

//   try {
//     // Check product on blockchain
//     const exists = await contract.isProductRegistered(productId);

//     if (!exists) {
//       return res.status(404).json({
//         result: "FAKE",
//         reason: "Product not on blockchain"
//       });
//     }

//     // Generate random challenge
//     const challenge = crypto.randomBytes(8).toString("hex");
//     activeChallenges[productId] = challenge;

//     console.log(`Challenge for ${productId}: ${challenge}`);

//     res.json({ challenge });

//   } catch (err) {
//     console.error("Blockchain error:", err);
//     res.status(500).json({
//       error: "Blockchain check failed"
//     });
//   }
// });

// // STEP 2: Verify response
// app.post("/verify", (req, res) => {
//   const { productId, response } = req.body;

//   if (!productId || !response) {
//     return res.status(400).json({
//       result: "FAKE",
//       reason: "Missing productId or response"
//     });
//   }

//   const challenge = activeChallenges[productId];
//   if (!challenge) {
//     return res.json({
//       result: "FAKE",
//       reason: "No active challenge"
//     });
//   }

//   const secret = secrets[productId];
//   if (!secret) {
//     return res.json({
//       result: "FAKE",
//       reason: "Unknown product"
//     });
//   }

//   // Recompute expected hash
//   const expected = CryptoJS.SHA256(
//     secret + challenge
//   ).toString();

//   // One-time use challenge
//   delete activeChallenges[productId];

//   if (expected === response) {
//     return res.json({ result: "GENUINE" });
//   } else {
//     return res.json({
//       result: "FAKE",
//       reason: "Hash mismatch"
//     });
//   }
// });

// // ---------------- START SERVER ----------------
// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT}`);
// });



require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 5000;
const CONTRACT_ADDRESS = "0x7849215cFdB25b0028E4FF104B8fA1d1b98286aa";

// ---------------- LOAD SECRETS ----------------
const secretsPath = path.join(__dirname, "data", "secrets.json");

// Ensure secrets file exists
if (!fs.existsSync(secretsPath)) {
  fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
  fs.writeFileSync(secretsPath, JSON.stringify({}));
}

let secrets = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));

// ---------------- LOAD CONTRACT ABI ----------------
const contractABI =
  require("./blockchain/ProductRegistry.json").abi;

// ---------------- BLOCKCHAIN PROVIDER ----------------
const provider = new ethers.providers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL
);

const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractABI,
  provider
);

// ---------------- EXPRESS APP ----------------
const app = express();
app.use(cors());
app.use(express.json());

// Store active challenges in memory
const activeChallenges = {};

// ---------------- ROUTES ----------------

// Health check
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ---------------- MANUFACTURER / ADMIN ----------------

// Register product (called from UI)
app.post("/register", async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId required" });
  }

  try {
    // Check blockchain
    const exists = await contract.isProductRegistered(productId);
    if (exists) {
      return res.status(400).json({ error: "Product already registered" });
    }

    // Signer (manufacturer wallet)
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      provider
    );

    const signedContract = contract.connect(wallet);

    // Register on blockchain
    const tx = await signedContract.registerProducts([productId]);
    await tx.wait();

    // Generate secret
    const secret = CryptoJS.SHA256(
      crypto.randomBytes(16).toString("hex") + productId
    ).toString();

    // Store secret
    secrets[productId] = secret;
    fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));

    return res.json({
      success: true,
      productId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// List registered products (for admin UI)
app.get("/products", (req, res) => {
  try {
    const productList = Object.keys(secrets);
    res.json({ products: productList });
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

// ---------------- CUSTOMER VERIFICATION ----------------

// STEP 1: Generate challenge
app.post("/challenge", async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID required" });
  }

  try {
    // Verify product exists on blockchain
    const exists = await contract.isProductRegistered(productId);
    if (!exists) {
      return res.json({
        result: "FAKE",
        reason: "Product not on blockchain"
      });
    }

    // Generate challenge
    const challenge = crypto.randomBytes(8).toString("hex");
    activeChallenges[productId] = challenge;

    console.log(`Challenge for ${productId}: ${challenge}`);
    res.json({ challenge });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Blockchain error" });
  }
});

// STEP 2: Verify response
app.post("/verify", (req, res) => {
  const { productId, response } = req.body;

  if (!productId || !response) {
    return res.json({
      result: "FAKE",
      reason: "Missing data"
    });
  }

  const challenge = activeChallenges[productId];
  if (!challenge) {
    return res.json({
      result: "FAKE",
      reason: "No active challenge"
    });
  }

  const secret = secrets[productId];
  if (!secret) {
    return res.json({
      result: "FAKE",
      reason: "Unknown product"
    });
  }

  const expected = CryptoJS.SHA256(
    secret + challenge
  ).toString();

  delete activeChallenges[productId];

  if (expected === response) {
    return res.json({ result: "GENUINE" });
  } else {
    return res.json({
      result: "FAKE",
      reason: "Hash mismatch"
    });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
