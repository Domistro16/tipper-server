import "dotenv/config"
export const getCount = async (address) => {

const options = {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      params: [address, 'latest'],
      method: 'eth_getTransactionCount'
    })
  };

 const response = await fetch(`https://bnb-mainnet.g.alchemy.com/v2/${process.env.VITE_KEY}`, options)
console.log(response);
 const formatted = response.json();

 const count = parseInt(formatted.data.result, 16)
    return count;
}