const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.korapayWebhook = async (req, res) => {
    console.log('--- KORAPAY WEBHOOK START ---');

    try {
        // Verify that this request actually came from Korapay
        // I use HMAC SHA256 hashing to compare the signature in the header 
        // with a hash of the raw request body using our Secret Key.
        const signature = req.headers['x-korapay-signature'];
        const hash = crypto.createHmac('sha256', process.env.KORAPAY_SECRET_KEY)
            .update(JSON.stringify(req.body)) 
            .digest('hex');

        // If the hashes don't match, someone might be trying to fake a payment
        if (hash !== signature) {
            console.error('Signature Mismatch');
            return res.status(401).json({ message: 'Invalid Signature' });
        }

        // Extract the event type and data from the request body
        const { event, data } = req.body;
        console.log(`Processing Event: ${event} for Ref: ${data.reference}`);

        //HANDLE DEPOSITS (User funding their wallet)
        // Event 'charge.success' means the user has successfully paid you.
        if (event === 'charge.success') {
            // Find the transaction record we created when the user started the payment
            const transaction = await Transaction.findOne({ reference: data.reference });

            // Only proceed if the transaction exists and is currently 'pending'
            if (transaction && transaction.status === 'pending') {
                // Mark the transaction as complete
                transaction.status = 'success';
                await transaction.save();

                // Increment (add) the amount to the user's wallet balance
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`DEPOSIT CONFIRMED: Wallet credited for ${data.reference}`);
            } else {
                console.log(`DEPOSIT SKIP: Transaction already processed or not found.`);
            }
        }

        //HANDLE TRANSFER SUCCESS (Withdrawals/Payouts)
        // Event 'transfer.success' means the money has reached the recipient's bank account.
        if (event === 'transfer.success') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            if (transaction && transaction.status === 'pending') {
                // Simply mark the transaction as successful
                transaction.status = 'success';
                await transaction.save();
                console.log(`TRANSFER SUCCESS: Record updated for ${data.reference}`);
            }
        }

        //HANDLE TRANSFER FAILURES (Refund Logic)
        // If a transfer fails or is reversed by the bank, we must return the money to the user.
        if (event === 'transfer.failed' || event === 'transfer.reversed') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            // Ensure we only refund if the transaction isn't already reversed
            if (transaction && transaction.status !== 'reversed' && transaction.type === 'debit') {
                transaction.status = 'reversed';
                transaction.description = `Failed: ${data.detail || 'Bank declined transfer'}`;
                await transaction.save();

                // Refund the amount back to the user's wallet balance
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`REFUND PROCESSED: Money returned for ref: ${data.reference}`);
            }
        }

        return res.status(200).send('Webhook Processed Successfully');

    } catch (error) {
        console.error('WEBHOOK ERROR:', error.message);
        return res.status(500).send('Internal Server Error');
    }
};