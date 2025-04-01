import { Network, Alchemy } from "alchemy-sdk";
import Web3 from "web3";
import "dotenv/config"
  // Main function to calculate total BNB value
  const web3 = new Web3('https://bsc-dataseed.binance.org/');
  const settings = {
    apiKey: process.env.VITE_KEY, // Replace with your Alchemy API Key.
    network: Network.BNB_MAINNET, // Replace with your network.
  };
  const alchemy = new Alchemy(settings);

  const WHALE_STATUS = {
    KRAKEN: { min: 15,  tag: "KRAKEN" },
    WHALE: { min: 14, tag: "WHALE" },
    SHARK: { min: 10, tag: "SHARK" },
    FISH: { min: 5, tag: "FISH" },
    PLEB: { min: 0.1, tag: "PLEB" }
};

const tokenAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
]
const getWhaleStatus = (balance) => { 
  if (balance < WHALE_STATUS.PLEB.min || balance == Infinity) {
      return WHALE_STATUS.PLEB;
  } else if (balance <= WHALE_STATUS.FISH.min) {
      return WHALE_STATUS.FISH;
  } else if (balance <= WHALE_STATUS.SHARK.min) {
      return WHALE_STATUS.SHARK;
  } else if(balance <= WHALE_STATUS.WHALE.min){
      return WHALE_STATUS.WHALE;
  } else {
      return WHALE_STATUS.KRAKEN
  }
};



export async function calculateTotalBNBValue(address) {
  let pageKey = null;
  let allBalances = [];

  do {
    const response = await alchemy.core.getTokenBalances(address, {
      type: "erc20",
      pageKey: pageKey,
    });
    allBalances = allBalances.concat(response.tokenBalances);
    pageKey = response.pageKey; 
  } while (pageKey); 

    let values = []
    let i = 1;
    const nonZeroBalances = allBalances.filter((token) => {
      return token.tokenBalance !== "0";
    });
  
    let whale = [];
    if(nonZeroBalances.length == 0){
      return{status: 'PLEB'}
    }
    for(const token of nonZeroBalances){
      const tokenContract = new web3.eth.Contract(tokenAbi, token.contractAddress);
      let balance = token.tokenBalance;

    // Get metadata of token
    const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);

    // Compute token balance in human-readable format
    balance = Number(balance) / Math.pow(10, metadata.decimals);
    balance = parseFloat(balance.toFixed(2));
    
    // Print name, balance, and symbol of token
      let supply;
      try {
        supply = await tokenContract.methods.totalSupply().call();
      } catch (error) {
        console.error("Error fetching total supply:", error);
        supply = 1000000000000;
      }
      const percerntage = (balance / Number(supply)) * 100;

      const whaleStatus = getWhaleStatus(percerntage);
      whale.push(whaleStatus.tag);

    values.push({
      name: metadata.name,
      balance: balance,
      symbol: metadata.symbol
    })
    console.log(`${i++}. ${metadata.name}: ${balance} ${metadata.symbol}`);
    }
    let status = '';
    if(whale){
        if(whale.find((element) => element === "KRAKEN")){
            status = "KRAKEN";
    }
    else if(whale.find((element) => element === "WHALE")){
            status = "WHALE";
    } else if(whale.find((element) => element === "SHARK")){
            status = "SHARK"
    }else if(whale.find((element) => element === "FISH")){
            status = "FISH";
    }else{ status = "PLEB"}
}

    
    return {status: status}
  }