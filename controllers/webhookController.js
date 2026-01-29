const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.korapayWebhook = async (req, res) => {
    console.log('Korapay Webhook received:', req.body);
    try {
        // verify signature security
        const signature = req.headers['x-korapay-signature'];
        const hash = crypto.createHmac('sha256', process.env.KORAPAY_SECRET_KEY)
            .update(req.rawBody).digest('hex');

            console.log('Header Signature:', signature);
            console.log('Calculated Hash:', hash);

        if (hash !== signature) {
            console.error('Invalid Korapay webhook signature');

            console.log('Header Signature:', signature);
            console.log('Calculated Hash:', hash);
            return res.status(401).json({message: 'Unauthorized'});
        }

        const { event, data } = req.body;

        // Handle success charge
        if (event === 'charge.success' && data.status === 'success') {
            const reference = data.reference;

            // find the pending transaction
            const transaction = await Transaction.findOne({ reference, status: 'pending' });

            if (transaction) {
                transaction.status = 'success';
                await transaction.save();

                // Credit the wallet
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`Wallet credited for ref: ${reference}`);
            }
        }

        res.status(200).send('Webhook Received');

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal sever Error');
    }
};