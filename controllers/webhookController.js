const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.korapayWebhook = async (req, res) => {
    console.log('Korapay Webhook received:', req.body);
    console.log('Event Type:', req.body.event);
    console.log('Reference:', req.body.data?.reference);

    

    try {
        // verify signature security
        const signature = req.headers['x-korapay-signature'];
        const dataToHash = JSON.stringify(req.body.data);
        const hash = crypto.createHmac('sha256', process.env.KORAPAY_SECRET_KEY)
            .update(dataToHash).digest('hex');

        console.log('Header Signature:', signature);
        console.log('Calculated Hash:', hash);

        if (hash !== signature) {
            console.error('Invalid Korapay webhook signature');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { event, data } = req.body;
console.log('Webhook Event:', event);
        // Handle success charge
        if (event === 'charge.success') {
            const reference = data.reference;
             console.log(`deposit transaction: ${reference}`);

            // find the pending transaction
            const transaction = await Transaction.findOne({ reference: reference });

            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();

                // Credit the wallet
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`Wallet credited for ref: ${reference}`);
            } else {
                console.log(`⚠️ DEPOSIT SKIP: Transaction not found or already processed. Status: ${transaction?.status}`);
            }
        }

        // Handle transfer success
        if (event === 'transfer.success') {
            const transaction = await Transaction.findOne({ reference: data.reference });

            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();
                console.log(`Transfer successful for ref: ${data.reference}`);
            }
        }

        // Handle failed charge
        if (event === 'transfer.failed' || event === 'transfer.reversed') {
            const transaction = await Transaction.findOne({ reference: data.reference,
                 status: {$ne: 'reversed'} //dont refund twice
                 });

            // refund only ifif we haven't already reversed
            if (transaction && transaction.status !== 'reversed'&& transaction.type === 'debit') {
                // mark as reversed
                transaction.status = 'reversed';
                transaction.description = `Transfer failed: ${data.detail || 'Money returned to wallet'}`;
                await transaction.save();

                // put money back into the user wallet
                await Wallet.findByIdAndUpdate(transaction.wallet, {
                    $inc: { balance: transaction.amount }
                });

                console.log(`Transfer failed, wallet refuned for ref: ${data.reference}`)

            }

        }

        res.status(200).send('Webhook Received');

    } catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(500).send('Internal sever Error');
    };
};