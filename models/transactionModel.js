const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    category: {
        type: String,
        enum: ['transfer', 'deposit', 'withdrawal'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'reversed'],
        default: 'success'
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema)
module.exports = Transaction