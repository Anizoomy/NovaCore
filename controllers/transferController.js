const axios = require('axios');
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');
const crypto = require('crypto');

const KORAPAY_URL = 'https://api.korapay.com/merchant/api/v1';

// To get List of Banks for the dropdown
exports.getBanks = async (req, res) => {
    try {
        // console.log('Using Key:', process.env.KORAPAY_SECRET_KEY?.substring(0, 10) + '...');

        const response = await axios.get(`${KORAPAY_URL}/misc/banks?currency=NGN`, {
            headers: {
                Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                Accept: 'application/json'
            }
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
        { account: String(accountNumber), bank: String(bankCode) },
        { headers: { Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`, Accept: 'application/json' } });

        const data = response.data.data;
    
        res.status(200).json({
            status: 'success',
            acountName: data.account_name,
            accountNumber: data.account_number,
            bankName: data.bank_name
        });
    } catch (error) {
        console.log('korapay error:', error.response?.data || error.message);
        res.status(400).json({ message: "Verify account failed", error: error.response?.data || 'Invalid account or bank code' });
    }
};

// Initiate Transfer
exports.initiateTransfer = async (req, res) => {
    const { amount, bankCode, accountNumber, narration } = req.body;
    const userId = req.user.id; // From auth middleware

    try {
        // Find user's wallet
        const wallet = await Wallet.findOne({ user: userId });
        
        // Check if user has enough money
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const reference = `TRNS_${crypto.randomBytes(6).toString('hex').toUpperCase()}-${Date.now()}`;
        
        // Call Korapay to send the money
        const korapayBody = {
            reference: reference,
            destination: {
                type: 'bank_account',
                amount: amount,
                currency: 'NGN',
                bank_account: {
                    bank: bankCode,
                    account: accountNumber,
                },
                customer: {
                    name: req.user.name || 'User',
                    email: req.user.email
                }
            },
            description: narration || `Transfer of ${amount} NGN to ${accountNumber}`
        };

        // Debit the wallet (Prevents double spending)
        wallet.balance -= amount;
        await wallet.save();

        // Create the transaction record as 'pending'
         const transaction = await Transaction.create({
            user: userId,
            wallet: wallet._id,
            type: 'debit',
            category: 'transfer',
            amount,
            reference,
            description: narration,
            bankDetails: { bankName: bankCode, accountNumber:accountNumber },
            status: 'pending'
        });



        const response = await axios.post(`${KORAPAY_URL}/transactions/disburse`, korapayBody, {
            headers: { 
                Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

            // Update transaction based on Korapay response
            const koraStatus = response.data.data?.status;

            if (koraStatus === 'success') {
                transaction.status = 'success';
            } else if (koraStatus === 'failed') {
                transaction.status = 'failed';
                // Refund the wallet immediately
                wallet.balance += amount;
                await wallet.save();
            }

        await transaction.save();
         res.status(200).json({ 
            status: 'success', 
            message: 'Transfer initiated',
            transaction_status: transaction.status,
            reference: reference,
            amount: amount,
            korapay_details: response.data.message
        });

    } catch (error) {
        console.error("Transfer Error:", JSON.stringify(error.response?.data, null, 2));
        res.status(500).json({ message: "Transfer failed to initiate", error: error.response?.data.message });
    }
};