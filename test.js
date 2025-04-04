import {PinataSDK} from 'pinata';
import 'dotenv/config';

const pinata = new PinataSDK({
    pinataJwt: `${process.env.JWT}`,
    pinataGateway: `${process.env.VITE_GATEWAY_URL}`,
  })


pinata.testAuthentication().then((result) => {
  console.log("Pinata auth success!", result);
}).catch((err) => {
  console.error("Pinata auth failed:", err);
});
