const axios = require('axios');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');
const crypto = require('crypto');

const KORAPAY_URL = 'https://api.korapay.com/merchant/api/v1';

// To get List of Banks for the dropdown
exports.getBanks = async (req, res) => {
    try {
        const response = await axios.get(`${KORAPAY_URL}/banks`, {
            headers: { Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}` }
        });
        res.status(200).json(response.data.data);
    } catch (error) {
        console.log('korapay error:', error.response?.data || error.message);
        res.status(500).json({ message: "Could not fetch banks" });
    }
};

// To esolve Account Name (Verify the person before sending)
exports.verifyAccount = async (req, res) => {
    try {
        const { accountNumber, bankCode } = req.body;
        const response = await axios.post(`${KORAPAY_URL}/misc/banks/resolve`, 
        { account: accountNumber, bank: bankCode },
        { headers: { Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}` } });

        res.status(200).json(response.data.data);
    } catch (error) {
        console.log('korapay error:', error.response?.data || error.message);
        res.status(400).json({ message: "Could not verify account", error: error.response?.data });
    }
};

// Initiate Transfer
exports.initiateTransfer = async (req, res) => {
    const { amount, bankCode, bankName, accountNumber, accountName, narration } = req.body;
    const userId = req.user.id; // From auth middleware

    try {
        // Find user's wallet
        const wallet = await Wallet.findOne({ user: userId });
        
        // Check if user has enough money
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const reference = `TRNS_${crypto.randomBytes(6).toString('hex').toUpperCase()}-${Date.now()}`;

        // Create the transaction record as 'pending'
        const transaction = await Transaction.create({
            user: userId,
            wallet: wallet._id,
            amount,
            reference,
            type: 'debit',
            category: 'transfer',
            status: 'pending',
            bankDetails: { bankName, bankCode, accountNumber, accountName },
            description: narration || `Transfer to ${accountName}`
        });

        // Debit the wallet (Prevents double spending)
        wallet.balance -= amount;
        await wallet.save();

        // Call Korapay to send the money
        const response = await axios.post(`${KORAPAY_URL}/transactions/disburse`, {
            reference: reference,
            amount: amount,
            currency: 'NGN',
            bank_code: bankCode,
            account_number: accountNumber,
            customer: {
                name: req.user.name,
                email: req.user.email
            },
            destination_type: 'bank_account'
        }, {
            headers: { Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}` }
        });

        return res.status(200).json({ 
            message: "Transfer is being processed", 
            reference: reference,
            data: response.data.data
        });

    } catch (error) {
        console.error("Transfer Error:", error.response?.data || error.message);
        // If API fails immediately, we should refund the wallet here
        res.status(500).json({ message: "Transfer failed to initiate" });
    }
};