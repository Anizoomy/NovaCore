const express = require('express');
const { register, verifyOtp, resendOtp, logIn } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', logIn);

module.exports = router;