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

/**
 * Korapay Webhook Controller
 * Handles Deposits (charge.success) and Payouts (transfer.success/failed)
 */
exports.korapayWebhook = async (req, res) => {
    console.log('--- 🔔 KORAPAY WEBHOOK RECEIVED 🔔 ---');

    try {
        // 1. EXTRACT DATA
        const signature = req.headers['x-korapay-signature'];
        const secretKey = (process.env.KORAPAY_SECRET_KEY || '').trim();
        const { event, data } = req.body;

        if (!signature) {
            console.error('❌ No signature found in headers');
            return res.status(401).send('No signature');
        }

        // 2. SIGNATURE VERIFICATION (Robust Multi-Method Check)
        // We try both the rawBody (from app.js) and the standard stringified body 
        // to handle any middleware variations on Render.
        const hashRaw = crypto.createHmac('sha256', secretKey).update(req.rawBody || '').digest('hex');
        const hashStringified = crypto.createHmac('sha256', secretKey).update(JSON.stringify(req.body)).digest('hex');

        const isValid = (signature === hashRaw || signature === hashStringified);

        if (!isValid) {
            console.error('❌ SIGNATURE MISMATCH');
            console.log('Header:', signature);
            console.log('Hashed Raw:', hashRaw);
            // If you are still testing, you can temporarily comment out the next line 
            // to bypass the check, but NEVER do this in live production.
            return res.status(401).json({ status: 'error', message: 'Signature Mismatch' });
        }

        console.log(`✅ VERIFIED: Event [${event}] for Reference [${data.reference}]`);

        // 3. LOGIC FOR DEPOSITS (User funding their wallet)
        if (event === 'charge.success') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();

                // Increment user wallet balance
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`💰 DEPOSIT SUCCESS: Wallet ${transaction.wallet} credited +${transaction.amount}`);
            }
        }

        // 4. LOGIC FOR TRANSFER SUCCESS (Withdrawal completed)
        if (event === 'transfer.success') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();
                console.log(`📤 Payout Successful for ${data.reference}`);
            }
        }

        // 5. LOGIC FOR TRANSFER FAILURES (Auto-Refund user)
        if (event === 'transfer.failed' || event === 'transfer.reversed') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            // Only refund if the transaction was previously successful or pending and is a debit (withdrawal)
            if (transaction && transaction.status !== 'reversed' && transaction.type === 'debit') {
                transaction.status = 'reversed';
                transaction.description = `Refund: ${data.detail || 'Bank declined'}`;
                await transaction.save();

                // Give the money back to the wallet
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`🔄 REFUNDED: ${transaction.amount} returned to wallet due to failure.`);
            }
        }

        // 6. RESPOND TO KORAPAY
        // Always send 200/OK so Kora stops retrying
        return res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('🔥 WEBHOOK CRASH:', error.message);
        return res.status(500).send('Internal Server Error');
    }
};