const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');
const redisClient = require('../utils/redis');

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
        const reference = data.reference;

        // redis idempotency check
        // NX(not exist) redis save the key only if it the first time it has seenbut if it's a duplicate it says no and return null
        // EX(expire) redis will automatically delete thr record after 24 hours which is 86400 seconds
        const isDuplicate = await redisClient.set(
            `processed_webhook:${reference}`,
            'locked',
            { NX: true, EX: 86400 }
        );

        // if 'isDuplicate' is null, it means this reference has already been processed
        if (!isDuplicate) {
            console.log(`Request with reference ${reference} has already been processed. Skipping.`);
            return res.status(200).send('Webhook Received');
        }

        // handle deposit
        if (event === 'charge.success' && data.status === 'success') {
            const reference = data.reference;
            const transaction = await Transaction.findOne({ reference, status: 'pending' });

            if (transaction) {
                transaction.status = 'success';
                await transaction.save();

                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });
                console.log(`Wallet credited for ref: ${reference}`);
            }
        }

        // handle transfer success
        if (event === 'transfer.success') {
            const transaction = await Transaction.findOne({ reference: data.reference, status: 'pending' });

            if (transaction) {
                transaction.status = 'success';
                await transaction.save();
                console.log(`[TRANSFER] Marked as success for ref: ${data.reference}`);
            }
        }

        // handle transfer failure and refund 
        if (event === 'transfer.failed') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            // Refund if it was a debit and hasn't been reversed yet
            if (transaction && transaction.status !== 'reversed' && transaction.type === 'debit') {
                transaction.status = 'reversed';
                transaction.description = `Transfer failed: ${data.detail || 'Money returned to wallet'}`;
                await transaction.save();

                // Put the money back
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`Transfer failed, wallet refunded for ref: ${data.reference}`);
            }
        }

        res.status(200).send('Webhook Received');

    } catch (error) {
        console.error('Webhook Error:', error);

        if (req.body.data && req.body.data.reference) {
            await redisClient.del(`processed_webhook:${req.body.data.reference}`);
        }
        res.status(500).send('Internal Server Error');
    }
};