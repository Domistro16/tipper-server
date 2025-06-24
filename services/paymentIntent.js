// paymentIntent.js
import crypto from "crypto";
import axios from "axios";
import { ethers } from "ethers";
import contractAbi from "../abis/Controller.json" with { type: 'json' };
import priceAbi from "../abis/Price.json" with { type: "json" };
import "dotenv/config";

const HMAC_SECRET = process.env.PAYMENT_HMAC_SECRET;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// simple in-process cache
let ratesCache = { timestamp: 0, rates: {} };

/** Fetch fresh USD→all rates (or return cached if recent). */
async function getRates() {
  const now = Date.now();
  if (now - ratesCache.timestamp < CACHE_TTL_MS && ratesCache.rates.USD) {
    return ratesCache.rates;
  }
  const resp = await axios.get(
    `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`
  );
  ratesCache = {
    timestamp: now,
    rates: resp.data.conversion_rates,
  };
  return ratesCache.rates;
}

/**
 * Compute the fiat amount for a given domain + duration, *then* convert
 * it into the requested currencyCode.
 *
 * @param {string} domain
 * @param {number} duration        // e.g. "3years"
 * @param {string} currencyCode    // e.g. "NGN", "EUR", "GBP", "USD"
 */
export async function computeAmount(domain, duration, currencyCode, lifetime) {
  // 1) Base USD price logic (you choose your algorithm)

  console.log(domain)
  const provider = new ethers.JsonRpcProvider(
    process.env.ETH_PROVIDER_URL
  );
  const controller = new ethers.Contract(
    process.env.MINT_CONTRACT_ADDRESS,
    contractAbi,
    provider
  );
  const priceOracle = new ethers.Contract(
    process.env.PRICE_ORACLE,
    priceAbi,
    provider
  )
  const priceData = await controller.rentPrice(domain, duration, lifetime);

  console.log("Price data:", priceData.base, priceData.premium);
  
  const bnb = (Number(priceData.base) + Number(priceData.premium)) / 1e18
  console.log("BNB price:", bnb);
  const data = await priceOracle.latestRoundData();
  console.log(data)
  const baseUsd = bnb * (Number(data.answer) / 1e8)
  // 2) If they want USD, just return it

  console.log("Base USD price:", baseUsd);
  if (currencyCode === "USD") {
    return Math.ceil(baseUsd);
  }

  console.log('trees')
  // 3) Otherwise fetch rates and convert
  const rates = await getRates();
  const rate = rates[currencyCode];
  if (!rate) {
    throw new Error(`Unsupported currency: ${currencyCode}`);
  }

  console.log(rate);
  // Multiply + round up to the nearest whole unit
  return Math.ceil(baseUsd * rate);
}

// 4) Your existing calculate-intent endpoint now just passes through
export async function calculatePrice(req, res) {
  const { domain, duration, currency, lifetime } = req.body;
  const amount = await computeAmount(domain, duration, currency, lifetime);
  const txRef = `mint_${Date.now()}`;
  const ts = Math.floor(Date.now() / 1000);

  // Create your HMAC over everything
  const payload = [domain, duration, amount, currency, txRef, ts].join("|");
  const hash = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");

  return res.json({ amount, currency, txRef, ts, hash });
}

/**
 * Verifies that a given payment-intent payload matches its HMAC.
 * Use this in your webhook to guard against tampering.
 *
 * @param {object} params
 * @param {string} params.domain
 * @param {string} params.duration
 * @param {number} params.amount
 * @param {string} params.currency
 * @param {string} params.txRef
 * @param {number} params.ts
 * @param {string} params.hash
 */
export function verifyHash({ domain, duration, amount, currency, txRef, ts, hash }) {
  const payload  = [domain, duration, amount, currency, txRef, ts].join('|')
  const expected = crypto.createHmac('sha256', HMAC_SECRET)
                         .update(payload)
                         .digest('hex')

  console.log("Expected hash:", expected);
  // timingSafeEqual guards against subtle timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(hash,     'hex'),
  )
}
