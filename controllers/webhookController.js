const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.korapayWebhook = async (req, res) => {
    console.log('Korapay Webhook received:', req.body);
    try {
        // 1. Verify Hash
        const signature = req.headers['x-korapay-signature'];
        const dataToHash = JSON.stringify(req.body.data);
        const hash = crypto.createHmac('sha256', process.env.KORAPAY_SECRET_KEY)
            .update(dataToHash).digest('hex');

        if (hash !== signature) {
            console.error('Invalid Korapay webhook signature');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { event, data } = req.body;

        // --- HANDLE DEPOSITS (Already working) ---
        if (event === 'charge.success' && data.status === 'success') {
            const reference = data.reference;
            const transaction = await Transaction.findOne({ reference, status: 'pending' });

            if (transaction) {
                transaction.status = 'success';
                await transaction.save();

                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });
                console.log(`[DEPOSIT] Wallet credited for ref: ${reference}`);
            }
        }

        // --- HANDLE TRANSFER SUCCESS (New) ---
        if (event === 'transfer.success') {
            const transaction = await Transaction.findOne({ reference: data.reference, status: 'pending' });

            if (transaction) {
                transaction.status = 'success';
                await transaction.save();
                console.log(`[TRANSFER] Marked as success for ref: ${data.reference}`);
            }
        }

        // --- HANDLE TRANSFER FAILURE (Refund logic) ---
        if (event === 'transfer.failed') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            // Refund if it was a debit and hasn't been reversed yet
            if (transaction && transaction.status !== 'reversed' && transaction.type === 'debit') {
                transaction.status = 'reversed';
                transaction.description = `Transfer failed: ${data.detail || 'Money returned to wallet'}`;
                await transaction.save();

                // Put the money back!
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`[TRANSFER] Failed, wallet refunded for ref: ${data.reference}`);
            }
        }

        res.status(200).send('Webhook Received');

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};