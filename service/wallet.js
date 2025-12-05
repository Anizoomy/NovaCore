const Wallet = require('../models/walletModel');
const Transaction = require('../models/transactionModel');
const Payment = require('../models/paymentModel');
const { initializePayment } = require('../service/korapay');


exports.fundWalletInit = async (userId, user, amount) => {
    if (!amount || amount < 100) {
        throw new Error ( 'Amount must be at least #100');
    }

    if (amount > 5_000_000) {
        throw new Error ( 'Amount must not exceed #5,000,000');
    }

    try {
        // initialize korapay payment
        // const { reference, link } = await initializePayment(user, amount);
        const init = await initializePayment(user, amount);

        if (!init || !init.reference || !init.link) {
            console.log('Invalid initiallize payment response:', init);
            throw new Error('No valid response')
        }

        // save reference to database
        await Payment.create({
            reference: init.reference,
            user: userId,
            amount,
            event: 'charge.initialize',
            status: 'pending'
        });


        return {
            message: 'Payment Initialized',
            reference: init.reference,
            paymentLink: init.link
        };

    } catch (err) {
        console.error('Error in fundWalletInit:', err.response?.data || err.message);
        throw new Error('Failed to initialize wallet funding');
    }
};