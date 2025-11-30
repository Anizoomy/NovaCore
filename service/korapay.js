require('dotenv').config();
const axios = require('axios');
const generateRef = require('../utils/generateRef');

exports.initializePayment = async (user, amount) => {
    const reference = generateRef('KRPAY');

    const payload = {
        amount: amount,
        currency: 'NGN',
        redirect_url: process.env.KORAPAY_REDIRECT_URL,
        customer: {
            email: user.email,
            name: user.name
        },
        reference
    };

    try {
        const response = await axios.post(
            'https://api.korapay.com/merchant/api/v1/charges/initialize',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            reference,
            link: response.data?.data?.checkout_url
        };

    } catch (err) {
        console.error('Korapay init Error:', {
            message: err.message,
            data: err.response?.data,
            status: err.response?.status
        });
    }
};