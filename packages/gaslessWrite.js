// Node.js backend function (using ethers.js) to perform the gasless contract write

import { ethers } from "ethers";

const forwarderABI = [
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData",
        name: "request",
        type: "tuple",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData[]",
        name: "requests",
        type: "tuple[]",
      },
      {
        internalType: "address payable",
        name: "refundReceiver",
        type: "address",
      },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData",
        name: "request",
        type: "tuple",
      },
    ],
    name: "verify",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export async function gaslessContractWrite({
  targetABI,
  targetAddress,
  functionName,
  functionArgs,
  gasLimit = 100000,
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER_URL);
  const relayerUrl = process.env.RELAYER_URL || "https://your-relayer-url.com";
  const forwarderAddress =
    process.env.FORWARDER_ADDRESS || "0xYourForwarderAddress";
  const signer = new ethers.Wallet(
    process.env.BACKEND_WALLET_PRIVATE_KEY,
    provider
  );
  try {
    const forwarderContract = new ethers.Contract(
      forwarderAddress,
      forwarderABI,
      signer
    );

    // 1. Get current nonce
    const nonce = await forwarderContract.nonces(signer.address);

    // 2. Encode calldata
    const iface = new ethers.Interface(targetABI);
    const calldata = iface.encodeFunctionData(functionName, functionArgs);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 5;

    // 3. Build request object
    const request = {
      from: signer.address,
      to: targetAddress,
      value: 0,
      gas: gasLimit,
      nonce: Number(nonce),
      deadline,
      data: calldata,
    };

    // 4. Define domain and types for EIP-712
    const domain = {
      name: "ERC2771Forwarder",
      version: "1",
      chainId: 97,
      verifyingContract: forwarderAddress,
    };

    const types = {
      ForwardRequest: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint48" },
        { name: "data", type: "bytes" },
      ],
    };

    // 5. Sign typed data
    const signature = await signer.signTypedData(domain, types, request);

    // 6. Send request to relayer
    const finalRequest = {
      from: request.from,
      to: request.to,
      value: request.value.toString(),
      gas: request.gas.toString(),
      deadline: request.deadline.toString(),
      data: request.data,
      signature,
    };

    const response = await fetch(relayerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: finalRequest, signature }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Relayer failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const { result } = await response.json();
    const parsedResult = JSON.parse(result);
    console.log(parsedResult)
    return parsedResult.txHash;
  } catch (err) {
    console.error("Gasless contract write error:", err);
    throw err;
  }
}
