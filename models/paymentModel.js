const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    reference: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    event: {
        type: String,
        enum: ['initialize', 'webhook', 'verified']
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema)
module.exports = Payment

