import "dotenv/config"
export async function getPriceInUSD(tokenAddress) {
  try {
    const options = {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        addresses: [
          { network: 'bnb-mainnet', address: tokenAddress }
        ]
      })
    };

    const res = await fetch(`https://api.g.alchemy.com/prices/v1/${process.env.VITE_KEY}/tokens/by-address`, options);
    const jsonResponse = await res.json(); // ✅ Parse response as JSON

    console.log(jsonResponse); // Log full response to debug

    // Safe access to nested values
    const priceInUSD = jsonResponse?.data?.[0]?.prices?.[0]?.value;

    return priceInUSD ? Number(priceInUSD) : 0; // Ensure it returns a valid number

  } catch (error) {
    console.log('No price found', error);
    return 0;
  }
}