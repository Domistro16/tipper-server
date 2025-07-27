import "dotenv/config";
import { Queue, Worker }from "bullmq";
import Redis from "ioredis";
import { ethers, JsonRpcProvider, hexlify, randomBytes } from "ethers";
import contractAbi from "./abis/Controller.json" with { type: "json" }; // your compiled ABI
import { AbiCoder } from "ethers";

// ─── Redis & Queue setup ───────────────────────────────────────────────────────
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 14945,
  username: 'default', 
  password: process.env.REDIS_PASSWORD, // Ensure this is set!
  tls: {} // Add this if using Redis Cloud TLS
};

const redisClient = new Redis(process.env.REDIS_URL);

const mintQueue = new Queue('mintqueue', { connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
        password: process.env.REDIS_PASSWORD,
        tls: {}
    }});


   redisClient.on('connect', () => console.log('Redis client connected'));
   redisClient.on('error', (err) => console.error('Redis client error', err));

// ─── Exported helpers ───────────────────────────────────────────────────────S────

/**
 * Enqueue a mint job.
 * @param {{ userWallet: string, domain: string, duration: number, paymentProof: { txRef: string, flutterwaveId: string } }} jobData
 */
export async function queueMint(jobData) {
  console.log("Queuing mint job:", jobData);
  try {
    const job = await mintQueue.add(jobData, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    console.log(`✅ Job added to queue with ID: ${job.id}`);
    const state = await job.getState();
console.log(`🔍 Job state is: ${state}`);
    return job; // optionally return the job or its ID/state
  } catch (err) {
    console.error("❌ Failed to add job to queue:", err);
    throw err; // allow upstream code to handle it
  }
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
new Worker(
  'mintqueue',
  async (job) => {
    const { userWallet, domain, params: registerparams, paymentProof } = job.data;

    console.log(`🟡 [mintWorker] Processing job for domain: ${domain}`);

    // 1) Setup ethers.js
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER_URL);
    const signer = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.MINT_CONTRACT_ADDRESS, contractAbi, signer);

    console.log('umm:', userWallet, domain, registerparams);

    // 2) Encode proof
    const abiCoder = new AbiCoder();
    const secretBytes = randomBytes(32);
    const proofBytes = hexlify(secretBytes);

    console.log(`🟡 [mintWorker] Using proofBytes: ${proofBytes}`);

    const commitment = await contract.makeCommitment(
      domain,
      userWallet,
      registerparams.duration,
      proofBytes,
      registerparams.resolver,
      registerparams.data,
      registerparams.reverseRecord,
      registerparams.ownerControlledFuses,
      registerparams.lifetime
    );

    console.log(`🟡 [mintWorker] commitment=${commitment}`);

    await contract.commit(commitment);
    const waitMs = Number(60) * 1000 + 5000;
    console.log(`waiting ${waitMs / 1000}s for commitment age...`);
    await new Promise((r) => setTimeout(r, waitMs));

    // 3) Register
    console.log(`🟡 [mintWorker] Minting domain="${domain}" for ${userWallet}`);
    const tx = await contract.registerWithCard(
      domain,
      userWallet,
      registerparams.duration,
      proofBytes,
      registerparams.resolver,
      registerparams.data,
      registerparams.reverseRecord,
      registerparams.ownerControlledFuses,
      registerparams.lifetime,
      registerparams.referree
    );

    console.log(`🟡 [mintWorker] Tx sent: ${tx.hash}`);

    // 4) Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ [mintWorker] Tx confirmed in block ${receipt.blockNumber}`);

    return receipt;
  },
  {
    connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
        password: process.env.REDIS_PASSWORD,
        tls: {}
    },
  }
); 
// (Optional) handle errors / logging
mintQueue.on("failed", (job, err) => {
  console.error(`❌ [mintQueue] Job ${job.id} failed:`, err);
});
