import "dotenv/config"
import { Alchemy, Network } from "alchemy-sdk";

const settings = {
  apiKey: process.env.VITE_KEY, // Replace with your Alchemy API Key.
  network: Network.BNB_MAINNET, // Replace with your network.
};
const alchemy = new Alchemy(settings);

export async function getFirstMemecoin(address) {
  try{
  const response = await alchemy.core.getAssetTransfers({
    toAddress: address,
    category: ["erc20"],
  });

  const firstMemecoin = response.transfers[0].rawContract.address;

  const metadata = await alchemy.core.getTokenMetadata(firstMemecoin);

  const name = metadata.name
  return (name);
}catch(error){
  return('null')
}

}

export async function getLastMemecoin(address) {
  try{
  const response = await alchemy.core.getAssetTransfers({
    toAddress: address,
    category: ["erc20"],
    order: 'desc'

  });

  const lastMemecoin = response.transfers[0].rawContract.address;

  const metadata = await alchemy.core.getTokenMetadata(lastMemecoin);

  const name = metadata.name
  return (name);
}catch(error){
  return ('null')
}

}