import express from "express";
import Member from "./wallets.js";
import Droptip from "./droptips.js";
import { calculateTotalBNBValue } from "./packages/balance.js";
import { getFirstMemecoin } from './packages/firstMemecoin.js'
import { getLastMemecoin } from './packages/firstMemecoin.js'
import { getUserCategory } from './packages/status.js'
import { getCount } from './packages/count.js'
import { PinataSDK } from "pinata"
import multer from "multer" 
import "dotenv/config"

const pinata = new PinataSDK({
    pinataJwt: `${process.env.VITE_PINATA_JWT}`,
    pinataGateway: `${process.env.VITE_GATEWAY_URL}`,
  })

  const upload = multer({ storage: multer.memoryStorage() });


const router = express.Router();

/**
 * @route POST /api/wallets
 * @desc Save or update a user's wallet
 */
router.post("/wallets/newWallet", async (req, res) => {
    const { userId, iv, salt} = req.body;

    if (!userId || !iv ) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    console.log( 'done checking')
    try {
        let user = await Member.findOne({ UserId: userId.toString() }); // Ensure string match
        console.log('checking again')
        if (!user) {
            user = new Member({ UserId: userId.toString(), iv: iv, s: salt });
            await user.save();
            console.log(`Wallet saved successfully:`);
            return res.status(201).json({ message: "Wallet saved successfully"});
        } else {
            return res.status(409).json({ message: "Wallet already exists"});
        }
    } catch (err) {
        console.error(`Error saving wallet: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});


router.post("/droptips/newDroptip", async (req, res) => {
    const { droptipId, droptip } = req.body;
    
    if (!droptipId || !droptip) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try{
        let drop = new Droptip({ droptipId: droptipId.toString(), droptip: droptip });
        await drop.save();
        res.status(200).json({message: "Wallet Saved Sucessfully", droptipId, droptip});
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// /**
//  * @route GET /api/wallets/:userId
//  * @desc Retrieve all wallets for a user
//  */
// router.get("/wallets/privatekey/:userId", async (req, res) => {
//     try {
//         const { userId } = req.params;
//         console.log(`Searching for wallet with user ID: ${userId}`); // Debugging log

//         const user = await Member.findOne({ UserId: userId.toString() }); // Ensure string match

//         if (!user) {
//             console.log(`No wallet found for user ID: ${userId}`);
//             return res.status(404).json({ error: "Wallet not found" });
//         }

//         console.log(`Wallet found: ${JSON.stringify(user.wallet.wallet)}`);
//         res.status(200).json({ v: user.wallet.v, iv: user.wallet.iv });
//     } catch (err) {
//         console.error(`Error fetching wallet: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// });
router.get("/wallets/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Searching for wallet with user ID: ${userId}`); // Debugging log

        const user = await Member.findOne({ UserId: userId.toString() }); // Ensure string match

        if (!user) {
            console.log(`No wallet found for user ID: ${userId}`);
            return res.status(404).json({ error: "Wallet not found" });
        }

        console.log(`Wallet found`);
        res.status(200).json({ iv: user.iv, s: user.s });
    } catch (err) {
        console.error(`Error fetching wallet: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});
router.get("/address/:address", async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`Searching for wallet with user ID: ${address}`); // Debugging log

        const [r, f, l, u, c] = await Promise.all([
            calculateTotalBNBValue(address), 
            getFirstMemecoin(address),
            getLastMemecoin(address),
            getUserCategory(address),
            getCount(address)
        ]);
        
        res.status(200).json({ status: r.status, first: f, last: l, user: u, count: c });
    } catch (err) {
        console.error(`Error fetching wallet: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});



router.get("/droptips/:droptipId", async (req, res) => {
    const { droptipId } = req.params;

    try {
        const drop = await Droptip.findOne({ droptipId: droptipId});

        if (!drop) {
            return res.status(404).json({ error: "drop not found" });
        }
        res.status(200).json({droptipId: droptipId, droptip: drop.droptip});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/droptips/rel/", async (req, res) => {
    const { droptipId } = req.params;

    try {
        const drops = await Droptip.find({ "droptip.available": true }).toArray();

        if (!drops) {
            return res.status(404).json({ error: "drops not found" });
        }
        res.status(200).json({drops: drops});

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/nft/upload", upload.single("file"), async (req, res) =>{
    try {
        console.log("File received:", req.file);
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const upload = await pinata.upload.public.file(req.file.buffer);
        url = "https://gateway.pinata.cloud/ipfs/" + upload.cid
        res.status(200).json({message: 'Files uploaded successfully', url: url})
    }catch(error){
        res.status(500).json({error: error.message});
        console.log(error)
    }
})

router.post("/nft/uploadMetadata", async (req, res) => {
    try {
        const metadata = req.body;
        if (!metadata) {
            return res.status(400).json({ error: "No metadata provided" });
        }

        const upload = await pinata.upload.public.json(metadata);
        const url = "https://gateway.pinata.cloud/ipfs/" + upload.cid;
        
        res.status(200).json({ message: "Metadata uploaded successfully", url });
    } catch (error) {
        console.error("Metadata upload error:", error);
        res.status(500).json({ error: error.message });
    }
});


router.post("/droptips/updateDroptip", async (req, res) => {
    const { droptipId, droptip } = req.body;

    try {
        const updatedDrop = await Droptip.findOneAndUpdate(
            { droptipId }, 
            { $set: { droptip } }, 
            { new: true } // Returns the updated document
        );

        if (!updatedDrop) {
            return res.status(404).json({ error: "Droptip not found" });
        }

        res.status(200).json({ message: `${droptipId} updated successfully`, updatedDrop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route DELETE /api/wallets
 * @desc Remove a specific wallet for a user
 */
router.delete("/", async (req, res) => {
    const { userId, blockchain } = req.body;

    if (!userId || !blockchain) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        let member = await Member.findOne({ userId });

        if (!member || !member.wallets.has(blockchain)) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        member.wallets.delete(blockchain);
        await member.save();

        res.json({ message: "Wallet deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
