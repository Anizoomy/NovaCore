// const crypto = require('crypto');
// const Transaction = require('../models/transactionModel');
// const Wallet = require('../models/walletModel');

// exports.korapayWebhook = async (req, res) => {
//     console.log('--- KORAPAY WEBHOOK START ---');

//     try {
//         // Verify that this request actually came from Korapay
//         // I use HMAC SHA256 hashing to compare the signature in the header 
//         // with a hash of the raw request body using our Secret Key.
//         const signature = req.headers['x-korapay-signature'];
        
//         const secretKey = (process.env.KORAPAY_SECRET_KEY || '').trim();
//         const { event, data } = req.body;

//         const hashA = crypto.createHmac('sha256', secretKey).update(req.rawBody || '').digest('hex');
//         const hashB = crypto.createHmac('sha256', secretKey).update(JSON.stringify(req.body)).digest('hex');
//          const hashC = crypto.createHmac('sha256', secretKey).update(JSON.stringify(req.body.data)).digest('hex');

//         console.log('--- SIGNATURE CHECK ---');
//         console.log('Header from Kora:', signature);
//         console.log('Method A (Raw): ', hashA, signature === hashA ? '✅ MATCH' : '❌ NO');
//         console.log('Method B (Body):', hashB, signature === hashB ? '✅ MATCH' : '❌ NO');
//         console.log('Method C (Data):', hashC, signature === hashC ? '✅ MATCH' : '❌ NO');

//         if (signature === hashA || signature === hashB || signature === hashC) {
            
//             console.log(`🚀 PROCESSING VERIFIED EVENT: ${event}`);

//             if (event === 'charge.success') {
//                 const transaction = await Transaction.findOne({ reference: data.reference });
//                 if (transaction && transaction.status === 'pending') {
//                     transaction.status = 'success';
//                     await transaction.save();
//                     await Wallet.findByIdAndUpdate(transaction.wallet, { $inc: { balance: transaction.amount } });
//                     console.log(`💰 Deposit Saved: ${data.reference}`);
//                 }
//             }

//         // const payload = req.rawBody || JSON.stringify(req.body);

//         // if (!payload) {
//         //     console.error('RAW BODY MISSING: Ensure app.use(express.json({verify:...})) is in app.js');
//         //     return res.status(400).send('Raw body missing');
//         // }

//         // const hash = crypto.createHmac('sha256', secretKey)
//         //     .update(payload) 
//         //     .digest('hex');

//         // // If the hashes don't match, someone might be trying to fake a payment
//         // if (hash !== signature) {
//         //     console.error('SIGNATURE MISMATCH');
//         //     console.log('Received Header:', signature);
//         //     console.log('Calculated Hash:', hash);
//         //     console.log('Payload Length:', payload.length);
//         //     console.log('Secret Key Length:', secretKey.length);

//         //     return res.status(401).json({ message: 'Invalid Signature' });
//         // }

//         // // Extract the event type and data from the request body
//         // const { event, data } = req.body;
//         // console.log(`Processing Event: ${event} for Ref: ${data.reference}`);

//         // //HANDLE DEPOSITS (User funding their wallet)
//         // // Event 'charge.success' means the user has successfully paid you.
//         // if (event === 'charge.success') {
//         //     // Find the transaction record we created when the user started the payment
//         //     const transaction = await Transaction.findOne({ reference: data.reference });

//         //     // Only proceed if the transaction exists and is currently 'pending'
//         //     if (transaction && transaction.status === 'pending') {
//         //         // Mark the transaction as complete
//         //         transaction.status = 'success';
//         //         await transaction.save();

//                 // Increment (add) the amount to the user's wallet balance
//         //         await Wallet.findByIdAndUpdate(transaction.wallet, {
//         //             $inc: { balance: transaction.amount }
//         //         });

//         //         console.log(`DEPOSIT CONFIRMED: Wallet credited for ${data.reference}`);
//         //     } else {
//         //         console.log(`DEPOSIT SKIP: Transaction already processed or not found.`);
//         //     }
//         // }

//         //HANDLE TRANSFER SUCCESS (Withdrawals/Payouts)
//         // Event 'transfer.success' means the money has reached the recipient's bank account.
//         if (event === 'transfer.success') {
//             const transaction = await Transaction.findOne({ reference: data.reference });

//             if (transaction && transaction.status === 'pending') {
//                 // Simply mark the transaction as successful
//                 transaction.status = 'success';
//                 await transaction.save();
//                 console.log(`TRANSFER SUCCESS: Record updated for ${data.reference}`);
//             }
//         }

//         //HANDLE TRANSFER FAILURES (Refund Logic)
//         // If a transfer fails or is reversed by the bank, we must return the money to the user.
//         if (event === 'transfer.failed' || event === 'transfer.reversed') {
//             const transaction = await Transaction.findOne({ reference: data.reference });

//             // Ensure we only refund if the transaction isn't already reversed
//             if (transaction && transaction.status !== 'reversed' && transaction.type === 'debit') {
//                 transaction.status = 'reversed';
//                 transaction.description = `Failed: ${data.detail || 'Bank declined transfer'}`;
//                 await transaction.save();

//                 // Refund the amount back to the user's wallet balance
//                 await Wallet.findByIdAndUpdate(transaction.wallet, {
//                     $inc: { balance: transaction.amount }
//                 });

//                 console.log(`REFUND PROCESSED: Money returned for ref: ${data.reference}`);
//             }
//         }

//         return res.status(200).send('Webhook Processed Successfully');

//     } catch (error) {
//         console.error('WEBHOOK ERROR:', error.message);
//         return res.status(500).send('Internal Server Error');
//     }
// };


const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.korapayWebhook = async (req, res) => {
    console.log('--- 🔔 KORAPAY WEBHOOK DEBUG 🔔 ---');

    try {
        const signature = req.headers['x-korapay-signature'];
        const secretKey = (process.env.KORAPAY_SECRET_KEY || '').trim();
        const rawPayload = req.rawBody || '';

        // DEBUG LOGS (Safe for console)
        console.log('1. Key Stats:', {
            length: secretKey.length,
            prefix: secretKey.substring(0, 7), // Should be sk_test or sk_live
            suffix: secretKey.substring(secretKey.length - 4)
        });

        // Calculate Hash
        const hash = crypto.createHmac('sha256', secretKey)
            .update(rawPayload)
            .digest('hex');

        console.log('2. Signature Comparison:');
        console.log('Received Header:', signature);
        console.log('Calculated Hash:', hash);

        if (hash !== signature) {
            console.error('❌ STILL MISMATCHED');
            
            // EMERGENCY WORKAROUND FOR TESTING ONLY:
            // If you are 100% sure your logic is correct and you just want to 
            // see if the database part works, you can temporarily 
            // uncomment the line below to "force" it to pass. 
            // DO NOT LEAVE THIS UNCOMMENTED IN PRODUCTION.
            
            // if (process.env.NODE_ENV !== 'production') { console.log('⚠️ BYPASSING SIGNATURE FOR TEST'); } else { return res.status(401).send('Unauthorized'); }
            
            return res.status(401).send('Unauthorized');
        }

        // --- SUCCESS LOGIC ---
        const { event, data } = req.body;
        console.log(`✅ MATCH FOUND: Processing ${event}`);

        if (event === 'charge.success') {
            const transaction = await Transaction.findOne({ reference: data.reference });
            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();
                await Wallet.findByIdAndUpdate(transaction.wallet, { $inc: { balance: transaction.amount } });
                console.log(`💰 Credited: ${data.reference}`);
            }
        }

        return res.status(200).send('OK');

    } catch (error) {
        console.error('🔥 CRITICAL ERROR:', error.message);
        return res.status(500).send('Internal Error');
    }
};