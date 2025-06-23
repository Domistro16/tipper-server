import "dotenv/config";
import Queue from "bull";
import Redis from "ioredis";
import { ethers } from "ethers";
import { encodeAbi } from "ethers";
import contractAbi from "./abis/MintContract.json"; // your compiled ABI
import { AbiCoder } from "ethers";

// ─── Redis & Queue setup ───────────────────────────────────────────────────────
const redisOpts = {
  host: process.env.REDIS_INTERNAL_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};
const redisClient = new Redis(redisOpts);

const mintQueue = new Queue("mintQueue", { redis: redisOpts });

// ─── Exported helpers ───────────────────────────────────────────────────────────

/**
 * Enqueue a mint job.
 * @param {{ userWallet: string, domain: string, duration: number, paymentProof: { txRef: string, flutterwaveId: string } }} jobData
 */
export async function queueMint(jobData) {
  return mintQueue.add(jobData, {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

/** Returns true if this txRef has already been seen. */
export async function isTxRefUsed(txRef) {
  return (await redisClient.sismember("usedTxRefs", txRef)) === 1;
}

/** Mark a txRef as used to prevent replay attacks. */
export async function markTxRefUsed(txRef) {
  return redisClient.sadd("usedTxRefs", txRef);
}

// ─── Worker: process jobs and call your contract ────────────────────────────────

mintQueue.process(async (job) => {
  const { userWallet, domain, registerparams, paymentProof } = job.data;

  // 1) Setup ethers.js
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_PROVIDER_URL
  );
  const signer = new ethers.Wallet(
    process.env.BACKEND_WALLET_PRIVATE_KEY,
    provider
  );
  const contract = new ethers.Contract(
    process.env.MINT_CONTRACT_ADDRESS,
    contractAbi,
    signer
  );

  // 2) ABI-encode the paymentProof struct into bytes
  const abiCoder = new AbiCoder();
  const proofBytes = abiCoder.encode(
    ["string", "string"],
    [paymentProof.txRef, paymentProof.flutterwaveId]
  );

  const commitment = await contract.makeCommittment(
    registerparams.domain,
    userWallet,
    registerparams.duration,
    proofBytes,
    registerparams.resolver,
    registerparams.data,
    registerparams.reverseRecord,
    registerparams.ownerControlledFuses,
    registerparams.lifetime
  );

  await contract.commit(commitment);
  const waitMs = Number(minAge) * 1000 + 5000;
  console.log(`waiting ${waitMs / 1000}s for commitment age...`);
  await new Promise((r) => setTimeout(r, waitMs));

  // 3) Call the mint function
  console.log(`🟡 [mintQueue] Minting domain="${domain}" for ${userWallet}`);
  const tx = await contract.registerWithCard(
    registerparams.domain,
    registerparams.address,
    registerparams.duration,
    proofBytes,
    registerparams.resolver,
    registerparams.data,
    registerparams.reverseRecord,
    registerparams.ownerControlledFuses,
    registerparams.lifetime,
    registerparams.referree
  );
  console.log(`🟡 [mintQueue] Tx sent: ${tx.hash}`);

  // 4) Wait for confirmation
  const receipt = await tx.wait();
  console.log(`✅ [mintQueue] Tx confirmed in block ${receipt.blockNumber}`);

  return Promise.resolve();
});

// (Optional) handle errors / logging
mintQueue.on("failed", (job, err) => {
  console.error(`❌ [mintQueue] Job ${job.id} failed:`, err);
});
