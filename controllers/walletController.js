const wallet = require('../service/wallet');

exports.fundWalletInit = async (req, res) => {
    try {
        const { amount } = req.body;

        const result = await wallet.fundWalletInit(
            req.user._id,
            req.user,
            amount
        );

        res.status(200).json({
            message: 'Payment Initialized',
            reference: result.reference,
            paymentLink: result.paymentLink
        });

    } catch (error) {
        console.error('Fund ini error:', error.message);
        res.status(400).json({
            message: error.message
        });
    }
};