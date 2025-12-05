const crypto = require('crypto');
const axios = require('axios');
const Wallet = require('../models/walletModel');
const Transaction = require('../models/transactionModel');
const Payment = require('../models/paymentModel');
const { sendDepositEmail } = require('../utils/depositEmail');

const SECRET = process.env.KORAPAY_SECRET_KEY;

exports.webhook = async (req, res) => {
    try {
        const rawBody = req.body; // express.raw sets this as a Buffer
        let payload;
        try {
            payload = JSON.parse(rawBody.toString());
        } catch (err) {
            console.error('Invalid JSON payload', err.message);
            return res.status(400).json({ message: 'Invalid JSON payload' });
        }

        // Signature Verification
        const signature = req.headers['x-korapay-signature'];

        if (!signature) {
            console.log('Missing signature header');
            return res.status(400).json({ message: 'Signature missing' });
        }

        const generatedHash = crypto
            .createHmac('SHA512', SECRET)
            .update(rawBody)
            .digest('hex');

        if (generatedHash !== signature) {
            console.log('Invalid signature');
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // save webhook event for logs
        const reference = payload?.data.reference;
        const metadata = payload?.data.metadata || {};

        await Payment.create({
            reference,
            event: payload.event,
            raw: payload
        });

        // Handle charge success

        if (payload.event === 'charge.success') {

            // verify charge with korapay
            const verifyUrl = `https://api.korapay.com/merchant/api/v1/charges/${reference}`;

            let verify;

            try {
                verify = await axios.get(verifyUrl, {
                    headers: {
                        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`
                    }
                });
            } catch (err) {
                console.error('Charge verification error:', err.response?.data || err.messsage);
                return res.sendStatus(200);
            }

            const charge = verify.data?.data;

            if (!charge || charge.status !== 'success') {
                console.log('Charge not verified');
                return res.sendStatus(200);
            }

            const amount = charge.amount;
            const userId = metadata.userId;
            const email = metadata.email;

            if (!userId) {
                console.log('No userId found in metadata');
                return res.sendStatus(200);
            }

            // Credit wallet
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                console.error('Wallet not found for user:', userId);
                res.sendStatus(200);
            }

            wallet.balance += amount;
            await wallet.save();

            // Log transaction
            await Transaction.create({
                walletId: wallet._id,
                type: 'credit',
                amount,
                currency: 'NGN',
                meta: {
                    reference,
                    note: 'Wallet funding'
                }
            });

            // send notification email
            if (email) {
                await sendDepositEmail(email, amount);
            }

            console.log('Wallet funded successfully:', amount);

        }

        return res.status(200).json({ message: 'Webhook processed' });

    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ message: 'Webhook processing failed' });
    }

};