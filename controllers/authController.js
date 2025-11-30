const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendMail } = require('../middleware/email');
const { registerOTP } = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    })
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, superAdminKey } = req.body;

        // check if user already exist
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exist'
            })
        }

        const saltRound = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, saltRound);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();


        // determine role: default 'user', allow 'superadmin' only when secret key matches
        const role = (superAdminKey && process.env.SUPER_ADMIN_KEY && superAdminKey === process.env.SUPER_ADMIN_KEY)
            ? 'superadmin'
            : 'user';

        const user = new User({
            name,
            email,
            password: hashPassword,
            role,
            otp: otp,
            otpExpiry: Date.now() + 10 * 60 * 1000 // 10 minutes from now
        })

        await user.save();
        const firstName = (user?.name || "").trim().split(" ")[0];

        const subject = `Hello ${firstName}, kindly verify your email`;

        const htmlContent = registerOTP(user.otp, firstName);

        const details = {
            email: user.email,
            subject,
            html: htmlContent,
        };

        await sendMail(details);

        res.status(201).json({
            message: 'User registered successfully', 
            // data: user,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token: generateToken(user._id)
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        })
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        // check expiry
        if (user.otpExpiry && user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // compare as strings to avoid type issues
        if (String(user.otp) !== String(otp).trim()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // mark verified and clear OTP fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully' });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        })
    }
};


exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                message: 'user not found'
            })
        };

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        Object.assign(user, { otp: otp, otpExpiry: Date.now() + 10 * 60 * 1000 });

        const firstName = (user?.name || "").trim().split(" ")[0];

        const subject = `Hello ${firstName}, kindly verify your email`;

        const htmlContent = registerOTP(user.otp, firstName);

        const details = {
            email: user.email,
            subject,
            html: htmlContent,
        };

        await sendMail(details);
        await user.save();
        res.status(200).json({
            message: 'Otp sent, kindly check your email'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error resending otp' + error.message
        })
    }
};

exports.logIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            },
            token: generateToken(user._id)
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// exports.getProfile = async (req, res) => {
//     res.json(req.user);
// };

// exports.updateProfile = async (req, res) => {
//     try {
//         const {name} = req.body;

//         const user = await User.findById(req.user._id);

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found'
//             });
//         }

//         req.user.name = name || req.user.name;

//         if (req.file) {
//             req.user.profilePicture = req.file.filename;
//         }

//         await req.user.save();

//         res.json({
//             message: 'Profile updated',
//             user: req.user
//         })
//     } catch (error) {
//         res.status(500).json({
//             message: 'Server error',
//             error: error.message
//         });
//     }
// };